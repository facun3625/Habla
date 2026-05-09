'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import styles from './account.module.css';

type Enrollment = {
  id: number; status: string; createdAt: string;
  course: { id: number; title: string; coverImage: string | null };
};

type User = { name: string | null; profile: { name: string } | null };

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  COMPROBANTE_SUBIDO: 'Comprobante enviado',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

export default function AccountDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then(setUser);
    fetch('/api/enrollments').then((r) => r.ok ? r.json() : []).then((d) => setEnrollments(Array.isArray(d) ? d : []));
  }, []);

  const confirmed = enrollments.filter((e) => e.status === 'CONFIRMADA');
  const pending = enrollments.filter((e) => e.status === 'PENDIENTE_PAGO' || e.status === 'COMPROBANTE_SUBIDO');

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className={styles.pageSubtitle}>Bienvenida a tu espacio de aprendizaje.</p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
            <CheckCircle size={20} color="#15803d" />
          </div>
          <div className={styles.statValue}>{confirmed.length}</div>
          <div className={styles.statLabel}>Cursos activos</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fff7ed' }}>
            <Clock size={20} color="#c2410c" />
          </div>
          <div className={styles.statValue}>{pending.length}</div>
          <div className={styles.statLabel}>Pendientes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ede9fe' }}>
            <BookOpen size={20} color="#6c5ce7" />
          </div>
          <div className={styles.statValue}>{enrollments.length}</div>
          <div className={styles.statLabel}>Total inscripciones</div>
        </div>
      </div>

      {/* Recent enrollments */}
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>Mis cursos</h2>
          <Link href="/mi-cuenta/cursos" style={{ fontSize: '0.85rem', color: '#6c5ce7', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📚</div>
            <p>Todavía no estás inscripta en ningún curso.</p>
            <Link href="/#cursos" style={{ color: '#6c5ce7', fontWeight: 700, textDecoration: 'none' }}>Ver cursos disponibles →</Link>
          </div>
        ) : (
          <div className={styles.enrollList}>
            {enrollments.slice(0, 4).map((e) => {
              const isConfirmed = e.status === 'CONFIRMADA';
              const badgeClass = {
                PENDIENTE_PAGO: styles.badgePending,
                COMPROBANTE_SUBIDO: styles.badgeUploaded,
                CONFIRMADA: styles.badgeConfirmed,
                CANCELADA: styles.badgeCancelled,
              }[e.status] ?? styles.badgePending;

              return (
                <Link
                  key={e.id}
                  href={isConfirmed ? `/mi-cuenta/cursos/${e.course.id}` : '/mi-cuenta/cursos'}
                  className={`${styles.enrollCard} ${!isConfirmed ? styles.enrollCardDisabled : ''}`}
                >
                  <div className={styles.enrollCover}>
                    {e.course.coverImage
                      ? <img src={e.course.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <BookOpen size={28} />}
                  </div>
                  <div className={styles.enrollInfo}>
                    <p className={styles.enrollTitle}>{e.course.title}</p>
                    <div className={styles.enrollMeta}>
                      <span className={`${styles.badge} ${badgeClass}`}>{STATUS_LABEL[e.status]}</span>
                      <span>{new Date(e.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                  {isConfirmed && (
                    <div className={styles.enrollAction}><ArrowRight size={16} /> Entrar</div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
