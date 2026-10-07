import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePostCategory, normalizePostContentFormat } from '@/lib/postOptions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latest = searchParams.get('latest') === '1';
    const publishedOnly = searchParams.get('published') === '1';
    const requestedLimit = Number(searchParams.get('limit'));
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 20)
      : undefined;

    const posts = await prisma.post.findMany({
      where: publishedOnly ? { published: true } : undefined,
      orderBy: latest ? { createdAt: 'desc' } : [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Error fetching posts' }, { status: 500 });
  }
}

function makeSlug(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  return base || `post-${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }
    const slug = makeSlug(data.title);

    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug: slug,
        excerpt: data.excerpt,
        content: data.content,
        category: normalizePostCategory(data.category),
        contentFormat: normalizePostContentFormat(data.contentFormat),
        coverImage: data.coverImage,
        videoUrl: data.videoUrl ?? null,
        showCoverImage: data.showCoverImage ?? true,
        published: data.published,
      }
    });
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Error creating post' }, { status: 500 });
  }
}
