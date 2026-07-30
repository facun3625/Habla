import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const source = await prisma.course.findUnique({
      where: { id: Number(id) },
      include: {
        courseProfiles: true,
        prices: true,
        resources: true,
        modules: { include: { accessProfiles: true }, orderBy: { order: 'asc' } },
      },
    });
    if (!source) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    // Se duplican los datos de configuración del curso (módulos, precios, materiales, textos)
    // pero nunca inscripciones ni progreso de gate — son de la edición anterior, no de la nueva.
    // Los links/info de conexión de cada módulo también se vacían: suelen cambiar por edición (Zoom, etc.)
    // y las fechas se dejan en blanco para que la admin cargue las de la nueva cursada.
    const created = await prisma.course.create({
      data: {
        title: `${source.title} (copia)`,
        coverImage: source.coverImage,
        modality: source.modality,
        capacity: source.capacity,
        schedule: source.schedule,
        description: source.description,
        targetAudience: source.targetAudience,
        status: 'BORRADOR',
        confirmationEmail: source.confirmationEmail,
        confirmationEmailSubject: source.confirmationEmailSubject,
        objectives: source.objectives,
        gateStep1Content: source.gateStep1Content,
        gateTerm1Title: source.gateTerm1Title,
        gateTerm1Body: source.gateTerm1Body,
        gateTerm2Title: source.gateTerm2Title,
        gateTerm2Body: source.gateTerm2Body,
        courseProfiles: {
          create: source.courseProfiles.map((cp) => ({
            profileId: cp.profileId,
            capacity: cp.capacity,
            requireCredential: cp.requireCredential,
            installmentsEnabled: cp.installmentsEnabled,
            maxInstallments: cp.maxInstallments,
          })),
        },
        prices: {
          create: source.prices.map((p) => ({
            name: p.name,
            amount: p.amount,
            currency: p.currency,
            active: p.active,
            profileId: p.profileId,
          })),
        },
        resources: {
          create: source.resources.map((r) => ({
            type: r.type,
            title: r.title,
            fileUrl: r.fileUrl,
            visible: r.visible,
            order: r.order,
          })),
        },
        modules: {
          create: source.modules.map((m) => ({
            name: m.name,
            order: m.order,
            date: m.date,
            accessAll: m.accessAll,
            topics: m.topics,
            connectionLink: null,
            connectionInfo: null,
            accessProfiles: {
              create: m.accessProfiles.map((ap) => ({ profileId: ap.profileId })),
            },
          })),
        },
      },
    });

    return NextResponse.json({ id: created.id });
  } catch (e) {
    console.error('POST /api/courses/[id]/duplicate', e);
    return NextResponse.json({ error: 'Error al duplicar el curso' }, { status: 500 });
  }
}
