'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, Upload } from 'lucide-react';
import styles from '../account.module.css';

type Enrollment = {
  id: number; status: string; createdAt: string; paymentMethod: string | null;
  course: { id: number; title: string; coverImage: string | null; startDate: string | null; modality: string };
  profile: { name: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  COMPROBANTE_SUBIDO: 'Comprobante enviado — en revisión',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

const STATUS_BADGE: Record<string, string> = {
  PENDIENTE_PAGO: 'badgePending',
  COMPROBANTE_SUBIDO: 'badgeUploaded',
  CONFIRMADA: 'badgeConfirmed',
  CANCELADA: 'badgeCancelled',
};

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/enrollments')
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setEnrollments(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#94a3b8', padding: '40px 0' }}>Cargando…</p>;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mis Cursos</h1>
        <p className={styles.pageSubtitle}>Todas tus inscripciones y su estado.</p>
      </div>

      {enrollments.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          <div className={styles.emptyIcon}>📚</div>
          <p>Todavía no estás inscripta en ningún curso.</p>
          <Link href="/#cursos" style={{ color: '#6c5ce7', fontWeight: 700, textDecoration: 'none' }}>
            Ver cursos disponibles →
          </Link>
        </div>
      ) : (
        <div className={styles.enrollList}>
          {enrollments.map((e) => {
            const isConfirmed = e.status === 'CONFIRMADA';
            const isPending = e.status === 'PENDIENTE_PAGO';
            const badgeKey = STATUS_BADGE[e.status] ?? 'badgePending';

            return (
              <div key={e.id} className={styles.enrollCard} style={{ textDecoration: 'none' }}>
                <div className={styles.enrollCover}>
                  {e.course.coverImage
                    ? <img src={e.course.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <BookOpen size={28} />}
                </div>

                <div className={styles.enrollInfo}>
                  <p className={styles.enrollTitle}>{e.course.title}</p>
                  <div className={styles.enrollMeta}>
                    <span className={`${styles.badge} ${styles[badgeKey]}`}>{STATUS_LABEL[e.status]}</span>
                    {e.profile && <span>· {e.profile.name}</span>}
                    {e.course.startDate && (
                      <span>· Inicio: {new Date(e.course.startDate).toLocaleDateString('es-AR')}</span>
                    )}
                    <span>· Inscripta el {new Date(e.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>

                {isConfirmed && (
                  <Link href={`/mi-cuenta/cursos/${e.course.id}`} className={styles.enrollAction}>
                    <ArrowRight size={16} /> Entrar
                  </Link>
                )}

                {isPending && e.paymentMethod === 'TRANSFERENCIA' && (
                  <Link
                    href={`/cursos/${e.course.id}`}
                    className={styles.enrollAction}
                    style={{ background: '#f59e0b' }}
                  >
                    <Upload size={16} /> Subir comprobante
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
