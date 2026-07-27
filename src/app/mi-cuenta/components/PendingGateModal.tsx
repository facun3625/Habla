'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import styles from './PendingGateModal.module.css';

type PendingCourse = { courseId: number; title: string };

export default function PendingGateModal() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingCourse[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/mi-cuenta/pending-gates')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPending(Array.isArray(data) ? data : []));
  }, []);

  if (dismissed || !pending || pending.length === 0) return null;

  const goTo = (courseId: number) => {
    setDismissed(true);
    router.push(`/mi-cuenta/cursos/${courseId}?tab=connection`);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={() => setDismissed(true)} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className={styles.title}>Tenés información pendiente</p>
            <p className={styles.subtitle}>
              Antes de acceder a los links de conexión, tenés que leer la información y aceptar los términos de {pending.length === 1 ? 'este curso' : 'estos cursos'}.
            </p>
          </div>
        </div>

        <div className={styles.courseList}>
          {pending.map((c) => (
            <div key={c.courseId} className={styles.courseItem}>
              <span className={styles.courseName}>{c.title}</span>
              <button className={styles.goBtn} onClick={() => goTo(c.courseId)}>
                Ir ahora <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
