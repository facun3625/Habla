import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TalkContent from './TalkContent';

type Params = { params: Promise<{ slug: string; token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, token } = await params;
  const talk = await prisma.talkPage.findFirst({
    where: { slug, accessToken: token, active: true },
    select: { title: true },
  });
  return {
    title: talk ? `${talk.title} | Hablapraxia` : 'Contenido no disponible | Hablapraxia',
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PublicTalkPage({ params }: Params) {
  const { slug, token } = await params;
  const talk = await prisma.talkPage.findFirst({
    where: { slug, accessToken: token, active: true },
    select: {
      title: true,
      items: {
        orderBy: [{ type: 'asc' }, { order: 'asc' }],
        select: { id: true, type: true, title: true, url: true, order: true },
      },
    },
  });
  if (!talk) notFound();

  return <TalkContent title={talk.title} items={talk.items} />;
}
