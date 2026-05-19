'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, User, Calendar, Clock, ArrowRight, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const MODALITY: Record<string, string> = { VIRTUAL: 'Virtual', PRESENCIAL: 'Presencial', HIBRIDO: 'Híbrido' };

export default function Home() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedPro, setSelectedPro] = useState<any>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [promoTitle, setPromoTitle] = useState('');

  useEffect(() => {
    fetch('/api/professionals')
      .then(res => res.json())
      .then(data => setProfessionals(Array.isArray(data) ? data.filter((p: any) => p.active) : []))
      .catch(err => console.error(err));

    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBlogPosts(data.filter(p => p.published).slice(0, 3));
      })
      .catch(err => console.error(err));

    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(Array.isArray(data) ? data.filter((c: any) => c.status !== 'BORRADOR') : []))
      .catch(err => console.error(err));

    fetch('/api/settings?public=1')
      .then(res => res.json())
      .then(data => {
        if (data.popup_enabled === 'true' && data.popup_title) setPromoTitle(data.popup_title);
      })
      .catch(() => {});
  }, []);

  const scrollToSlide = useCallback((idx: number) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.offsetWidth, behavior: 'smooth' });
    setCarouselIdx(idx);
  }, []);

  const onCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setCarouselIdx(idx);
  }, []);

  const publicados = courses.filter((c: any) => c.status === 'PUBLICADO');
  const latestCourse = publicados[0];
  const cursosAnteriores = courses.filter((c: any) => c.status === 'CERRADO');

  return (
    <>
      <SiteHeader />
      <main>

        {/* ── Hero ── */}
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroBackground}></div>
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <span className={styles.badge}>CURSO</span>
                <h1 className={styles.title}>
                  {latestCourse ? latestCourse.title : <>Apraxia del Habla <span>Infantil</span></>}
                </h1>
                <p className={styles.description}>
                  {latestCourse?.description || 'Ayuda a tu hijo/a a desarrollar su capacidad de habla y comunicación de manera efectiva y divertida.'}
                </p>
                <Link href={latestCourse ? `/cursos/${latestCourse.id}` : "/cursos"} className={styles.verCursosBtn}>
                  {latestCourse ? 'Inscribirme al curso' : 'Ver Cursos'} <ArrowRight size={16} />
                </Link>
              </div>
              <div className={styles.heroImageContainer} style={{ height: '500px' }}>
                <Image
                  src="/hero.png"
                  alt="Apraxia del Habla Infantil"
                  fill
                  style={{ objectFit: 'contain', transform: 'scale(1.1)' }}
                  priority
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Cursos ── */}
        {(publicados.length > 0 || cursosAnteriores.length > 0) && (
          <section id="cursos" className={styles.cursosSection}>

            {/* Header dentro del max-width */}
            <div className={styles.sectionInner}>
              {publicados.length > 0 && (
                <div className={styles.cursosSectionHeader}>
                  <div>
                    <h2 className={styles.cursosSectionTitle}>
                      {publicados.length >= 2 ? 'Próximos Cursos' : 'Próximo Curso'}
                    </h2>
                    <p className={styles.cursosSectionSubtitle}>Formación especializada en apraxia del habla infantil.</p>
                  </div>
                  <Link href="/cursos" className={styles.verTodosLink}>Ver todos los cursos →</Link>
                </div>
              )}
            </div>

            {/* Carousel — ancho completo para el efecto peek */}
            {publicados.length > 0 && (
              <div className={styles.carouselOuter}>
                <div
                  ref={carouselRef}
                  className={styles.carouselTrack}
                  onScroll={onCarouselScroll}
                >
                  {publicados.map((curso: any) => (
                    <div key={curso.id} className={styles.carouselSlide}>
                      <div style={{ position: 'relative' }}>
                      <Link href={`/cursos/${curso.id}`} className={styles.proximoCursoCard}>
                        <div className={styles.proximoCursoImage}>
                          {curso.coverImage
                            ? <img src={curso.coverImage} alt={curso.title} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                            : <div className={styles.proximoCursoImagePlaceholder} />
                          }
                          <span className={styles.courseModalityBadge}>{MODALITY[curso.modality] ?? curso.modality}</span>
                        </div>
                        <div className={styles.proximoCursoContent}>
                          <h3 className={styles.proximoCursoTitle}>{curso.title}</h3>
                          {curso.description && (
                            <p className={styles.proximoCursoDesc}>{curso.description}</p>
                          )}
                          <div className={styles.proximoCursoMeta}>
                            {curso.startDate && (
                              <span><Calendar size={15} /> {new Date(curso.startDate.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            )}
                            {curso.schedule && <span><Clock size={15} /> {curso.schedule}</span>}
                            {curso.targetAudience && <span><Users size={15} /> {curso.targetAudience}</span>}
                          </div>
                          <span className={styles.proximoCursoCta}>Ver curso e inscribirme <ArrowRight size={16} /></span>
                        </div>
                      </Link>
                      {promoTitle && (
                        <button
                          onClick={() => window.dispatchEvent(new Event('openPromoPopup'))}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: -2,
                            transform: 'translateY(-50%)',
                            background: 'linear-gradient(140deg, #6c5ce7 0%, #4f3cc9 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '14px 0 0 14px',
                            padding: '14px 16px 14px 20px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            zIndex: 10,
                            boxShadow: '-4px 0 24px rgba(108,92,231,0.35)',
                            fontFamily: 'inherit',
                            maxWidth: 100,
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed',
                          }}
                          title={promoTitle}
                        >
                          <span style={{ fontSize: '1rem' }}>🏷️</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.3, transform: 'rotate(180deg)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: 160 }}>
                            {promoTitle}
                          </span>
                        </button>
                      )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Flechas laterales */}
                {publicados.length > 1 && (
                  <>
                    <button
                      className={`${styles.carouselArrow} ${styles.carouselArrowLeft} ${carouselIdx === 0 ? styles.carouselArrowHidden : ''}`}
                      onClick={() => scrollToSlide(carouselIdx - 1)}
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      className={`${styles.carouselArrow} ${styles.carouselArrowRight} ${carouselIdx === publicados.length - 1 ? styles.carouselArrowHidden : ''}`}
                      onClick={() => scrollToSlide(carouselIdx + 1)}
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}

                {/* Dots */}
                {publicados.length > 1 && (
                  <div className={styles.carouselDots}>
                    {publicados.map((_: any, i: number) => (
                      <button
                        key={i}
                        className={`${styles.dot} ${i === carouselIdx ? styles.dotActive : ''}`}
                        onClick={() => scrollToSlide(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cursos anteriores */}
            {cursosAnteriores.length > 0 && (
              <div className={styles.sectionInner}>
                <div className={styles.cursosAnterioresWrap}>
                  <p className={styles.cursosAnterioresLabel}>Cursos anteriores</p>
                  <div className={styles.cursosAnterioresGrid}>
                    {cursosAnteriores.map((c: any) => (
                      <Link key={c.id} href={`/cursos/${c.id}`} className={styles.cursoAnteriorCard}>
                        <div className={styles.cursoAnteriorImage}>
                          {c.coverImage
                            ? <img src={c.coverImage} alt={c.title} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                            : <div className={styles.proximoCursoImagePlaceholder} />
                          }
                        </div>
                        <div className={styles.cursoAnteriorInfo}>
                          <span className={styles.cursoAnteriorBadge}>Cerrado</span>
                          <h4 className={styles.cursoAnteriorTitle}>{c.title}</h4>
                          {c.startDate && (
                            <span className={styles.cursoAnteriorDate}>
                              <Calendar size={12} /> {new Date(c.startDate.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </section>
        )}

        {/* ── Nosotras ── */}
        <section id="nosotras" className={styles.nosotrasSection}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Nosotras</h2>
              <p className={styles.sectionSubtitle}>
                Conocé a las profesionales que te acompañarán en este camino.
              </p>
            </div>
            <div className={styles.prosGrid}>
              {professionals.length > 0 ? (
                professionals.map(pro => (
                  <div key={pro.id} className={styles.proCard}>
                    <div className={styles.proImage}>
                      {pro.imageUrl ? (
                        <img src={pro.imageUrl} alt={pro.name} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      ) : (
                        <User size={60} color="white" />
                      )}
                    </div>
                    <h3 className={styles.proName}>{pro.name}</h3>
                    <span className={styles.proRole}>{pro.role}</span>
                    <p className={styles.proBio}>{pro.bio}</p>
                    {pro.instagram && (
                      <a href={pro.instagram} target="_blank" rel="noopener noreferrer" className={styles.proInstagram} aria-label="Instagram">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        Instagram
                      </a>
                    )}
                    <button className={styles.saberMasBtn} onClick={() => setSelectedPro(pro)}>
                      Saber más
                    </button>
                  </div>
                ))
              ) : (
                [1, 2].map(i => (
                  <div key={i} className={`${styles.proCard} ${styles.skeleton}`}>
                    <div className={styles.proImageSkeleton}></div>
                    <div className={styles.skeletonText} style={{ width: '60%', height: '24px', margin: '0 auto 10px' }}></div>
                    <div className={styles.skeletonText} style={{ width: '40%', height: '16px', margin: '0 auto 20px' }}></div>
                    <div className={styles.skeletonText} style={{ width: '80%', height: '60px', margin: '0 auto' }}></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── Noticias ── */}
        <section className={styles.blogSection}>
          <div className={styles.sectionInner}>
            <div className={styles.blogHeader}>
              <div>
                <h2 className={styles.blogSectionTitle}>Publicaciones</h2>
                <p className={styles.blogSectionSubtitle}>Investigaciones, recursos clínicos y novedades sobre apraxia del habla.</p>
              </div>
              <Link href="/blog" className={styles.viewAllLink}>Ver todas →</Link>
            </div>
            <div className={styles.blogGrid}>
              {blogPosts.length > 0 ? (
                blogPosts.map(post => (
                  <article key={post.id} className={styles.blogCard}>
                    <div className={styles.blogImage}>
                      {post.coverImage ? (
                        <img src={post.coverImage} alt={post.title} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      ) : (
                        <div className={styles.blogImagePlaceholder} />
                      )}
                    </div>
                    <div className={styles.blogContent}>
                      <span className={styles.blogDate}>
                        {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <h3 className={styles.blogTitle}>{post.title}</h3>
                      <p className={styles.blogExcerpt}>{post.excerpt}</p>
                      <Link href={`/blog/${post.slug}`} className={styles.readMore}>Leer más <ArrowRight size={13} /></Link>
                    </div>
                  </article>
                ))
              ) : (
                [1, 2, 3].map(i => (
                  <article key={i} className={`${styles.blogCard} ${styles.skeleton}`}>
                    <div className={styles.blogImagePlaceholder}></div>
                    <div className={styles.blogContent}>
                      <div className={styles.skeletonText} style={{ width: '40%', height: '14px', marginBottom: '10px' }}></div>
                      <div className={styles.skeletonText} style={{ width: '90%', height: '24px', marginBottom: '10px' }}></div>
                      <div className={styles.skeletonText} style={{ width: '100%', height: '60px' }}></div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />

      {selectedPro && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPro(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setSelectedPro(null)}>
              <X size={24} />
            </button>
            <div className={styles.modalHeader}>
              <div className={styles.modalImageContainer}>
                <img
                  src={selectedPro.imageUrl || '/favicon.png'}
                  alt={selectedPro.name}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>
              <div className={styles.modalInfo}>
                <h3 className={styles.modalTitle}>{selectedPro.name}</h3>
                <span className={styles.modalRole}>{selectedPro.role}</span>
                {selectedPro.instagram && (
                  <a href={selectedPro.instagram} target="_blank" rel="noopener noreferrer" className={styles.proInstagram} style={{ marginTop: '10px', display: 'inline-flex' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    Instagram
                  </a>
                )}
              </div>
            </div>
            <div className={styles.modalDivider}></div>
            <div
              className={styles.modalCV}
              dangerouslySetInnerHTML={{ __html: selectedPro.cvContent || 'CV no disponible.' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
