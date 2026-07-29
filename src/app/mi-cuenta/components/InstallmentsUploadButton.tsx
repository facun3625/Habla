'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ChevronDown } from 'lucide-react';

type Course = { courseId: number; title: string };

export default function InstallmentsUploadButton({
  courses,
  className,
  label = 'Subir comprobante',
  onNavigate,
}: {
  courses: Course[];
  className?: string;
  label?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [choosing, setChoosing] = useState(false);

  if (courses.length === 0) return null;

  const goTo = (courseId: number) => {
    setChoosing(false);
    onNavigate?.();
    router.push(`/mi-cuenta/cursos?highlight=${courseId}`);
  };

  if (courses.length === 1) {
    return (
      <button type="button" className={className} onClick={() => goTo(courses[0].courseId)}>
        <Upload size={16} /> {label}
      </button>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button type="button" className={className} onClick={() => setChoosing((v) => !v)}>
        <Upload size={16} /> {label} <ChevronDown size={14} />
      </button>
      {choosing && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 19 }}
            onClick={() => setChoosing(false)}
          />
          <div
            style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 6, background: 'white',
              borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid #ede9fe',
              minWidth: 230, zIndex: 20, overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 14px', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
              ¿A qué curso querés ir?
            </div>
            {courses.map((c) => (
              <button
                key={c.courseId}
                type="button"
                onClick={() => goTo(c.courseId)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                  fontWeight: 600, color: '#1e1b4b', fontFamily: 'inherit',
                }}
              >
                {c.title}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
