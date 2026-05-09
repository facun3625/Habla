import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import blogStyles from '../blog.module.css';

export const dynamic = 'force-dynamic';

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
              <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover' }} />
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
