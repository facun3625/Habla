'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2 } from 'lucide-react';

const CONFIRM_WORD = 'ELIMINAR';

export default function DangerZone({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const router = useRouter();
  const [enrollmentCount, setEnrollmentCount] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/courses/${courseId}/enrollments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEnrollmentCount(Array.isArray(d) ? d.length : 0))
      .catch(() => setEnrollmentCount(null));
  }, [courseId]);

  const canDelete = confirmText.trim() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: CONFIRM_WORD }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo eliminar el curso.');
        setDeleting(false);
        return;
      }
      router.push('/admin/courses');
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ margin: '0 0 8px', fontWeight: 800, color: '#991b1b' }}>Esta acción es irreversible</p>
          <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Eliminar este curso borra también, para siempre, todas sus inscripciones, cuotas, comprobantes y el historial de pagos asociado
            {enrollmentCount !== null && enrollmentCount > 0 && (
              <> — <strong>actualmente tiene {enrollmentCount} inscripto{enrollmentCount === 1 ? '' : 's'}</strong></>
            )}
            . No se puede deshacer.
          </p>
          <p style={{ margin: '10px 0 0', color: '#7f1d1d', fontSize: '0.85rem' }}>
            Si el curso ya terminó, no hace falta eliminarlo: dejalo en estado <strong>&quot;Cerrado&quot;</strong> en Datos Generales para conservar el historial y poder escribirle a esos inscriptos más adelante.
          </p>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 24px' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#1e1b4b', fontSize: '0.92rem' }}>
          Para confirmar, escribí <strong>{CONFIRM_WORD}</strong> en el siguiente campo:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={CONFIRM_WORD}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', marginBottom: 16, boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>{error}</p>}
        <button
          onClick={handleDelete}
          disabled={!canDelete || deleting}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: canDelete ? '#dc2626' : '#f1f5f9',
            color: canDelete ? 'white' : '#94a3b8',
            border: 'none', borderRadius: 10, padding: '11px 20px',
            fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit',
            cursor: canDelete && !deleting ? 'pointer' : 'not-allowed',
          }}
        >
          <Trash2 size={16} />
          {deleting ? 'Eliminando...' : `Eliminar "${courseTitle}" definitivamente`}
        </button>
      </div>
    </div>
  );
}
