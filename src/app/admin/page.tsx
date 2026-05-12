'use client';

import { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import Link from 'next/link';
import { BookOpen, Users, Bell, CheckCircle, Clock } from 'lucide-react';
import styles from './dashboard.module.css';

type Stats = {
  totalCourses: number;
  publishedCourses: number;
  totalUsers: number;
  pendingEnrollments: number;
  pendingDetails: { courseId: number; courseTitle: string; count: number }[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/courses').then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/admin/enrollments/pending').then((r) => r.json()),
    ]).then(([courses, users, pending]) => {
      const c = Array.isArray(courses) ? courses : [];
      const u = Array.isArray(users) ? users : [];
      setStats({
        totalCourses: c.length,
        publishedCourses: c.filter((x: any) => x.status === 'PUBLICADO').length,
        totalUsers: u.length,
        pendingEnrollments: pending?.total ?? 0,
        pendingDetails: pending?.details ?? [],
      });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Dashboard</h2>
          <p className={styles.subtitle}>Resumen general de la plataforma.</p>
        </div>

        {loading ? (
          <p className={styles.loading}>Cargando...</p>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <Link href="/admin/courses" className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#f5f3ff', color: 'var(--primary)' }}>
                  <BookOpen size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats?.totalCourses}</span>
                  <span className={styles.statLabel}>Cursos totales</span>
                  <span className={styles.statSub}>{stats?.publishedCourses} publicados</span>
                </div>
              </Link>

              <Link href="/admin/users" className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <Users size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats?.totalUsers}</span>
                  <span className={styles.statLabel}>Usuarios registrados</span>
                </div>
              </Link>

              <div className={`${styles.statCard} ${(stats?.pendingEnrollments ?? 0) > 0 ? styles.statCardAlert : ''}`}>
                <div className={styles.statIcon} style={{ background: (stats?.pendingEnrollments ?? 0) > 0 ? '#fff7ed' : '#f8fafc', color: (stats?.pendingEnrollments ?? 0) > 0 ? '#ea580c' : '#94a3b8' }}>
                  <Bell size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stats?.pendingEnrollments}</span>
                  <span className={styles.statLabel}>Inscripciones pendientes</span>
                  <span className={styles.statSub}>con comprobante subido</span>
                </div>
              </div>
            </div>

            {(stats?.pendingEnrollments ?? 0) > 0 && (
              <div className={styles.pendingSection}>
                <h3 className={styles.sectionTitle}>
                  <Clock size={18} /> Inscripciones por confirmar
                </h3>
                <div className={styles.pendingList}>
                  {stats?.pendingDetails.map((item) => (
                    <Link
                      key={item.courseId}
                      href={`/admin/courses/${item.courseId}?tab=enrollments`}
                      className={styles.pendingItem}
                    >
                      <div className={styles.pendingCourse}>{item.courseTitle}</div>
                      <div className={styles.pendingCount}>
                        <CheckCircle size={14} />
                        {item.count} {item.count === 1 ? 'inscripción' : 'inscripciones'}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
