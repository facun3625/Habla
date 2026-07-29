'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CreditCard, X } from 'lucide-react';
import styles from './InstallmentsGateModal.module.css';

type Data = {
  enabled: boolean;
  title: string;
  message: string;
  courses: { courseId: number; title: string }[];
};

const STORAGE_KEY = 'hp_dismissed_installments_gate';

export default function InstallmentsGateModal() {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<Data | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/mi-cuenta/installments-gate')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Data | null) => {
        setData(d);
        try {
          setDismissed(sessionStorage.getItem(STORAGE_KEY) === '1');
        } catch {
          // sessionStorage no disponible (modo privado, etc.) — se pierde el estado, no rompe nada.
        }
      });
  }, []);

  // No interrumpir en "Mis Cursos", que es justamente donde puede subir el comprobante de pago.
  if (!data || !data.enabled || data.courses.length === 0 || dismissed) return null;
  if (pathname === '/mi-cuenta/cursos') return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignorar
    }
  };

  const goToCourses = () => {
    dismiss();
    router.push('/mi-cuenta/cursos');
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={dismiss} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <CreditCard size={22} />
          </div>
          <div>
            <p className={styles.title}>{data.title || 'Tenés cuotas pendientes'}</p>
            {data.message ? (
              <div className={styles.message} dangerouslySetInnerHTML={{ __html: data.message }} />
            ) : (
              <p className={styles.subtitle}>
                Para acceder a los links de conexión primero tenés que tener todas las cuotas saldadas.
              </p>
            )}
          </div>
        </div>

        <div className={styles.courseList}>
          {data.courses.map((c) => (
            <div key={c.courseId} className={styles.courseItem}>
              <span className={styles.courseName}>{c.title}</span>
            </div>
          ))}
        </div>

        <button className={styles.goBtn} onClick={goToCourses}>
          Ver estado de mis cuotas
        </button>
      </div>
    </div>
  );
}
