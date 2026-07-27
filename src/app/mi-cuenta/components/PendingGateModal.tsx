'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import styles from './PendingGateModal.module.css';

type PendingCourse = { courseId: number; title: string };

const STORAGE_KEY = 'hp_dismissed_gate_popups';

function readDismissed(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistDismissed(ids: Set<number>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // sessionStorage no disponible (modo privado, etc.) — se pierde el estado, no rompe nada.
  }
}

export default function PendingGateModal() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState<PendingCourse[] | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(() => readDismissed());

  useEffect(() => {
    fetch('/api/mi-cuenta/pending-gates')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPending(Array.isArray(data) ? data : []));
  }, []);

  if (!pending) return null;

  // No interrumpir con el popup de un curso si ya estamos parados en la página de ese curso
  // (por ejemplo, justo después de tocar "Ir ahora"), ni si ya se descartó en esta sesión.
  const visible = pending.filter(
    (c) => !dismissedIds.has(c.courseId) && pathname !== `/mi-cuenta/cursos/${c.courseId}`
  );

  if (visible.length === 0) return null;

  const dismiss = (ids: number[]) => {
    const next = new Set(dismissedIds);
    ids.forEach((id) => next.add(id));
    setDismissedIds(next);
    persistDismissed(next);
  };

  const goTo = (courseId: number) => {
    dismiss([courseId]);
    router.push(`/mi-cuenta/cursos/${courseId}?tab=connection`);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={() => dismiss(visible.map((c) => c.courseId))} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className={styles.title}>Tenés información pendiente</p>
            <p className={styles.subtitle}>
              Antes de acceder a los links de conexión, tenés que leer la información y aceptar los términos de {visible.length === 1 ? 'este curso' : 'estos cursos'}.
            </p>
          </div>
        </div>

        <div className={styles.courseList}>
          {visible.map((c) => (
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
