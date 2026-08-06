'use client';

import { useState, useEffect } from 'react';
import { Download, Award } from 'lucide-react';
import styles from '../../../account.module.css';
import { downloadCertificatePdf } from '@/lib/certificateRender';

type CertTemplate = { id: number; title: string; subtitle: string | null; body: string };
type Signature = { name: string; imageUrl: string | null };
type Data = { enabled: boolean; headerUrl: string | null; footerUrl: string | null; signatures: Signature[]; templates: CertTemplate[] };

export default function CertificateTab({ courseId }: { courseId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [blockReason, setBlockReason] = useState<'NOT_ENROLLED' | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/certificate/student`)
      .then(async (r) => {
        if (r.status === 403) { setBlockReason('NOT_ENROLLED'); return; }
        if (!r.ok) return;
        setData(await r.json());
      })
      .catch(() => setData(null));
  }, [courseId]);

  const download = async (t: CertTemplate) => {
    if (!data) return;
    setDownloadingId(t.id);
    try {
      await downloadCertificatePdf(
        { headerUrl: data.headerUrl, footerUrl: data.footerUrl, signatures: data.signatures, title: t.title, subtitle: t.subtitle, body: t.body },
        `certificado-${t.title.toLowerCase().replace(/\s+/g, '-')}.pdf`
      );
    } catch {
      alert('No se pudo generar el certificado. Intentá de nuevo.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (blockReason === 'NOT_ENROLLED') {
    return (
      <div className={styles.card}>
        <p style={{ color: '#64748b', textAlign: 'center', padding: '24px 0' }}>
          Todavía no tenés una inscripción confirmada en este curso.
        </p>
      </div>
    );
  }

  if (data === null) return <p style={{ color: '#94a3b8', padding: '40px 0' }}>Cargando…</p>;

  if (!data.enabled) {
    return (
      <div className={styles.card}>
        <p style={{ color: '#64748b', textAlign: 'center', padding: '24px 0' }}>
          Tu certificado todavía no está habilitado. Cuando el equipo confirme que completaste el curso vas a poder descargarlo acá.
        </p>
      </div>
    );
  }

  if (data.templates.length === 0) {
    return (
      <div className={styles.card}>
        <p style={{ color: '#64748b', textAlign: 'center', padding: '24px 0' }}>
          Todavía no hay un certificado configurado para tu perfil en este curso.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {data.templates.map((t) => (
        <div key={t.id} className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ background: '#f5f3ef' }}>
            {data.headerUrl && <img src={data.headerUrl} alt="" style={{ width: '100%', display: 'block' }} />}
            <div style={{ padding: '32px 28px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, color: '#4c3fae' }}>{t.title}</p>
              {t.subtitle && <p style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600, color: '#6c5ce7' }}>{t.subtitle}</p>}
              <div
                style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: t.body }}
              />
            </div>
            {data.signatures.filter((s) => s.name.trim()).length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', padding: '0 28px 32px' }}>
                {data.signatures.filter((s) => s.name.trim()).map((sig, i) => (
                  <div key={i} style={{ textAlign: 'center', minWidth: 160 }}>
                    {sig.imageUrl && (
                      <img src={sig.imageUrl} alt="" style={{ height: 50, maxWidth: 180, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                    )}
                    <div style={{ borderTop: '2px solid #4c3fae', margin: '0 auto 8px', width: 180 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{sig.name}</span>
                  </div>
                ))}
              </div>
            )}
            {data.footerUrl && <img src={data.footerUrl} alt="" style={{ width: '100%', display: 'block' }} />}
          </div>
          <div style={{ padding: '16px 28px', borderTop: '1px solid #ede9fe', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => download(t)}
              disabled={downloadingId === t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, background: '#6c5ce7', color: 'white',
                border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.88rem',
                cursor: downloadingId === t.id ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: downloadingId === t.id ? 0.7 : 1,
              }}
            >
              {downloadingId === t.id ? <Award size={16} /> : <Download size={16} />}
              {downloadingId === t.id ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
