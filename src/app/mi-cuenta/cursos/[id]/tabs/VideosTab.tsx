'use client';

import { useState, useEffect } from 'react';
import { PlayCircle, ChevronDown } from 'lucide-react';
import styles from '../../../account.module.css';

type Video = { id: number; title: string; embedUrl: string };

export default function VideosTab({ courseId }: { courseId: string }) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [blockReason, setBlockReason] = useState<'NOT_ENROLLED' | 'INSTALLMENTS_PENDING' | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/videos/student`)
      .then(async (r) => {
        if (r.status === 403) {
          const body = await r.json().catch(() => ({}));
          setBlockReason(body.error === 'INSTALLMENTS_PENDING' ? 'INSTALLMENTS_PENDING' : 'NOT_ENROLLED');
          return;
        }
        if (!r.ok) return;
        setVideos(await r.json());
      })
      .catch(() => setVideos([]));
  }, [courseId]);

  if (blockReason === 'NOT_ENROLLED') {
    return (
      <div className={styles.card}>
        <p style={{ color: '#64748b', textAlign: 'center', padding: '24px 0' }}>
          Todavía no tenés una inscripción confirmada en este curso.
        </p>
      </div>
    );
  }

  if (blockReason === 'INSTALLMENTS_PENDING') {
    return (
      <div className={styles.card}>
        <p style={{ color: '#64748b', textAlign: 'center', padding: '24px 0' }}>
          Para ver los videos primero tenés que saldar todas las cuotas pendientes de este curso.
        </p>
      </div>
    );
  }

  if (videos === null) return <p style={{ color: '#94a3b8', padding: '40px 0' }}>Cargando…</p>;

  if (videos.length === 0) {
    return (
      <div className={styles.card}>
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>Este curso todavía no tiene videos cargados.</p>
      </div>
    );
  }

  return (
    <div className={styles.card} onContextMenu={(e) => e.preventDefault()}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>
        Videos de clases dictadas
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {videos.map((v) => {
          const isOpen = openId === v.id;
          return (
            <div key={v.id} style={{ border: '1px solid #ede9fe', borderRadius: 14, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : v.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', background: '#f8f7ff', border: 'none', cursor: 'pointer',
                  font: 'inherit', textAlign: 'left',
                }}
              >
                <PlayCircle size={18} color="#6c5ce7" />
                <span style={{ flex: 1, fontWeight: 700, color: '#1e1b4b', fontSize: '0.92rem' }}>{v.title}</span>
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#94a3b8' }} />
              </button>
              {isOpen && (
                <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                  <iframe
                    src={v.embedUrl}
                    allow="autoplay"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
