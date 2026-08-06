import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { fillCertificateTemplate, toTitleCase } from '@/lib/certificateVars';
import { canAccess } from '@/app/mi-cuenta/cursos/[id]/courseAccess';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const courseId = parseInt(id);

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let userId: number;
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId, userId, status: 'CONFIRMADA' },
  });
  if (!enrollment) return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 });

  if (!enrollment.certificateEnabled) {
    return NextResponse.json({ enabled: false, templates: [] });
  }

  const [user, course, templates, modules, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, profession: true, dni: true } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    prisma.certificateTemplate.findMany({
      where: { courseId },
      include: { module: { select: { id: true, name: true, date: true } } },
    }),
    prisma.module.findMany({
      where: { courseId },
      include: { accessProfiles: { include: { profile: true } } },
    }),
    getSettings(['certificate_header_url', 'certificate_footer_url', 'certificate_signatures']),
  ]);

  if (!course) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const profileId = enrollment.profileId;
  const accessibleModules = modules.filter((m) => canAccess(m, profileId));
  const hasFullAccess = modules.length > 0 && accessibleModules.length === modules.length;

  const applicableTemplates = templates.filter((t) => {
    if (t.moduleId === null) {
      return hasFullAccess;
    } else {
      return accessibleModules.some((m) => m.id === t.moduleId);
    }
  });

  const vars = {
    nombre: toTitleCase(enrollment.userName || user?.name || ''),
    profesion: user?.profession ?? '',
    dni: user?.dni ?? '',
    curso: course.title,
    fecha: new Date().toLocaleDateString('es-AR'),
  };

  const resolvedTemplates = applicableTemplates.map((t) => {
    const templateVars = {
      ...vars,
      fecha: (t.moduleId !== null && t.module?.date) ? t.module.date : vars.fecha,
      modulo: t.module?.name ?? '',
    };
    return {
      id: t.id,
      title: fillCertificateTemplate(t.title, templateVars),
      subtitle: t.subtitle ? fillCertificateTemplate(t.subtitle, templateVars) : null,
      body: fillCertificateTemplate(t.bodyTemplate, templateVars),
    };
  });

  let signatures: { name: string; imageUrl: string | null; subtitle?: string | null }[] = [];
  try { signatures = JSON.parse(settings.certificate_signatures || '[]'); } catch { signatures = []; }

  return NextResponse.json({
    enabled: true,
    headerUrl: settings.certificate_header_url ?? null,
    footerUrl: settings.certificate_footer_url ?? null,
    signatures,
    templates: resolvedTemplates,
  });
}
