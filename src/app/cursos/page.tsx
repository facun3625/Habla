'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import styles from './cursos.module.css';

type Course = {
  id: number;
  title: string;
  description: string | null;
  coverImage: string | null;
  startDate: string | null;
  modality: string;
  schedule: string | null;
  targetAudience: string | null;
  status: string;
  capacity: number;
  _count: { enrollments: number };
};

const MODALITY: Record<string, string> = { VIRTUAL: 'Virtual', PRESENCIAL: 'Presencial', HIBRIDO: 'Híbrido' };

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCourses(Array.isArray(data) ? data.filter((c: Course) => c.status !== 'BORRADOR') : []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const publicados = courses.filter(c => c.status === 'PUBLICADO');
  const cerrados = courses.filter(c => c.status === 'CERRADO');

  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>
            {publicados.length >= 2 ? 'Próximos Cursos' : 'Próximo Curso'}
          </h1>
          <p className={styles.subtitle}>Formación especializada en apraxia del habla infantil.</p>
        </div>

        <div>
          {loading ? (
            <div className={styles.loadingState}>Cargando cursos...</div>
          ) : publicados.length === 0 && cerrados.length === 0 ? (
            <div className={styles.emptyState}>No hay cursos disponibles por el momento.</div>
          ) : (
            <>
              {publicados.length > 0 && (
                <section className={styles.section}>
                  <div className={styles.grid}>
                    {publicados.map(course => (
                      <Link key={course.id} href={`/cursos/${course.id}`} className={styles.card}>
                        <div className={styles.cardImage}>
                          {course.coverImage
                            ? <Image src={course.coverImage} alt={course.title} fill style={{ objectFit: 'cover' }} />
                            : <div className={styles.cardImagePlaceholder} />
                          }
                          <span className={styles.modalityBadge}>{MODALITY[course.modality] ?? course.modality}</span>
                        </div>
                        <div className={styles.cardContent}>
                          <h2 className={styles.cardTitle}>{course.title}</h2>
                          {course.description && (
                            <p className={styles.cardDesc}>{course.description}</p>
                          )}
                          <div className={styles.cardMeta}>
                            {course.startDate && (
                              <span><Calendar size={14} /> {new Date(course.startDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            )}
                            {course.schedule && <span><Clock size={14} /> {course.schedule}</span>}
                            {course.targetAudience && <span><Users size={14} /> {course.targetAudience}</span>}
                          </div>
                          <span className={styles.cta}>Ver curso e inscribirme <ArrowRight size={15} /></span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {cerrados.length > 0 && (
                <section className={styles.pastSection}>
                  <p className={styles.pastLabel}>Cursos anteriores</p>
                  <div className={styles.pastGrid}>
                    {cerrados.map(course => (
                      <Link key={course.id} href={`/cursos/${course.id}`} className={styles.pastCard}>
                        <div className={styles.pastImage}>
                          {course.coverImage
                            ? <Image src={course.coverImage} alt={course.title} fill style={{ objectFit: 'cover' }} />
                            : <div className={styles.pastImagePlaceholder} />
                          }
                        </div>
                        <div className={styles.pastInfo}>
                          <span className={styles.pastBadge}>Cerrado</span>
                          <h4 className={styles.pastTitle}>{course.title}</h4>
                          {course.startDate && (
                            <span className={styles.pastDate}>
                              <Calendar size={12} /> {new Date(course.startDate).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
