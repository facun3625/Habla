import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import blogStyles from '../blog.module.css';

export const dynamic = 'force-dynamic';

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug, published: true } });

  if (!post) notFound();

  return (
    <>
      <SiteHeader />
      <main className={blogStyles.main}>
        <article className={blogStyles.article}>
          <Link href="/blog" className={blogStyles.backLink}>← Volver al Blog</Link>

          <header className={blogStyles.articleHeader}>
            <span className={blogStyles.articleDate}>
              {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <h1 className={blogStyles.articleTitle}>{post.title}</h1>
            {post.excerpt && <p className={blogStyles.articleExcerpt}>{post.excerpt}</p>}
          </header>

          {post.coverImage && (
            <div className={blogStyles.coverImageWrapper}>
              <img src={post.coverImage} alt={post.title} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            </div>
          )}

          {post.videoUrl && toEmbedUrl(post.videoUrl) && (
            <div className={blogStyles.videoWrapper}>
              <iframe
                src={toEmbedUrl(post.videoUrl)!}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          )}

          <div
            className={blogStyles.articleContent}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
