import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import blogStyles from './blog.module.css';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <>
      <SiteHeader />
      <main className={blogStyles.main}>
        <div className={blogStyles.pageHeader}>
          <h1 className={blogStyles.pageTitle}>Blog y Noticias</h1>
          <p className={blogStyles.pageSubtitle}>Novedades, artículos y recursos sobre apraxia del habla.</p>
        </div>

        {posts.length === 0 ? (
          <p className={blogStyles.empty}>No hay entradas publicadas aún.</p>
        ) : (
          <div className={blogStyles.blogGrid}>
            {posts.map(post => (
              <article key={post.id} className={blogStyles.blogCard}>
                <div className={blogStyles.blogCardImage}>
                  {post.coverImage && (
                    <img src={post.coverImage} alt={post.title} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  )}
                </div>
                <div className={blogStyles.blogCardContent}>
                  <span className={blogStyles.blogCardDate}>
                    {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <h2 className={blogStyles.blogCardTitle}>{post.title}</h2>
                  {post.excerpt && <p className={blogStyles.blogCardExcerpt}>{post.excerpt}</p>}
                  <Link href={`/blog/${post.slug}`} className={blogStyles.blogCardReadMore}>Leer más →</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
