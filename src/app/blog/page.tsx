import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import styles from '../page.module.css';
import blogStyles from './blog.module.css';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
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
          <div className={styles.blogGrid}>
            {posts.map(post => (
              <article key={post.id} className={styles.blogCard}>
                <div className={styles.blogImage}>
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className={styles.blogImagePlaceholder}>
                      <span>Foto del artículo</span>
                    </div>
                  )}
                </div>
                <div className={styles.blogContent}>
                  <span className={styles.blogDate}>
                    {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <h2 className={styles.blogTitle}>{post.title}</h2>
                  {post.excerpt && <p className={styles.blogExcerpt}>{post.excerpt}</p>}
                  <Link href={`/blog/${post.slug}`} className={styles.readMore}>Leer más</Link>
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
