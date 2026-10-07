import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import blogStyles from './blog.module.css';
import { categoryFromSlug, POST_CATEGORIES } from '@/lib/postOptions';

export const dynamic = 'force-dynamic';

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string | string[] }>;
}) {
  const requestedCategory = (await searchParams).categoria;
  const category = categoryFromSlug(Array.isArray(requestedCategory) ? requestedCategory[0] : requestedCategory);
  const categoryInfo = category ? POST_CATEGORIES[category] : null;
  const posts = await prisma.post.findMany({
    where: { published: true, ...(category ? { category } : {}) },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <>
      <SiteHeader />
      <main className={blogStyles.main}>
        <div className={blogStyles.pageHeader}>
          <h1 className={blogStyles.pageTitle}>{categoryInfo?.title ?? 'Novedades'}</h1>
          <p className={blogStyles.pageSubtitle}>
            {categoryInfo?.description ?? 'Blog, investigaciones y recursos sobre apraxia del habla.'}
          </p>
          <nav className={blogStyles.categoryTabs} aria-label="Categorías de novedades">
            <Link href="/blog" className={`${blogStyles.categoryTab} ${!category ? blogStyles.categoryTabActive : ''}`}>Todas</Link>
            {Object.entries(POST_CATEGORIES).map(([key, item]) => (
              <Link
                key={key}
                href={`/blog?categoria=${item.slug}`}
                className={`${blogStyles.categoryTab} ${category === key ? blogStyles.categoryTabActive : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {posts.length === 0 ? (
          <p className={blogStyles.empty}>No hay publicaciones en esta categoría todavía.</p>
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
                  <span className={blogStyles.categoryBadge}>
                    {POST_CATEGORIES[post.category as keyof typeof POST_CATEGORIES]?.label ?? 'Blog'}
                  </span>
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
