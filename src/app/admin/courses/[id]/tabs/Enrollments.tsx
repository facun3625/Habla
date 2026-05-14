'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Trash2, X } from 'lucide-react';
import styles from '../courseAdmin.module.css';
import ConfirmModal from '../../components/ConfirmModal';

function FileLink({ url, label = 'Ver' }: { url: string; label?: string }) {
  const [preview, setPreview] = useState(false);
  const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');

  if (isPdf) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={styles.receiptLink}>
        <ExternalLink size={14} /> {label}
      </a>
    );
  }

  return (
    <>
      <button className={styles.receiptLink} onClick={() => setPreview(true)}>
        <ExternalLink size={14} /> {label}
      </button>
      {preview && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setPreview(false)}
        >
          <button
            onClick={() => setPreview(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <X size={20} />
          </button>
          <img
            src={url}
            alt="Vista previa"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

type Profile = { name: string };
type Enrollment = {
  id: number;
  userName: string;
  email: string;
  profile: Profile | null;
  status: string;
  paymentMethod: string | null;
  receiptUrl: string | null;
  credentialUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  notes: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: 'Pendiente',
  COMPROBANTE_SUBIDO: 'Comprobante subido',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

const STATUS_CLASS: Record<string, string> = {
  PENDIENTE_PAGO: styles.statusPending,
  COMPROBANTE_SUBIDO: styles.statusReview,
  CONFIRMADA: styles.statusConfirmed,
  CANCELADA: styles.statusCancelled,
};

const METHOD_LABEL: Record<string, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  PAYPAL: 'PayPal',
  TRANSFERENCIA: 'Transferencia',
  TRANSFERENCIA_AR: 'Transferencia AR',
  TRANSFERENCIA_EXT: 'Transferencia Exterior',
};

export default function Enrollments({ courseId }: { courseId: string }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/enrollments`)
      .then((r) => r.json())
      .then(setEnrollments)
      .finally(() => setLoading(false));
  }, [courseId]);

  const confirmEnrollment = async (id: number) => {
    const res = await fetch(`/api/enrollments/${id}/confirm`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setEnrollments((prev) => prev.map((e) => e.id === id ? { ...e, ...updated } : e));
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    }
  };

  const updateStatus = async (id: number, status: string) => {
    if (status === 'CONFIRMADA') { await confirmEnrollment(id); return; }
    const res = await fetch(`/api/enrollments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEnrollments((prev) => prev.map((e) => e.id === id ? { ...e, ...updated } : e));
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    }
  };

  const deleteEnrollment = (id: number) => {
    setConfirmModal({
      message: '¿Eliminar esta inscripción? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch(`/api/enrollments/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setEnrollments((prev) => prev.filter((e) => e.id !== id));
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        }
      },
    });
  };

  const filtered = filter === 'all' ? enrollments : enrollments.filter((e) => e.status === filter);
  const pendingReceipts = enrollments.filter((e) => e.status === 'COMPROBANTE_SUBIDO').length;

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.enrollmentsTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Inscripciones ({enrollments.length})</h3>
          <p className={styles.sectionDesc}>Revisá pagos y confirmá inscripciones.</p>
        </div>
        {pendingReceipts > 0 && (
          <div className={styles.alertBadge}>
            {pendingReceipts} comprobante{pendingReceipts > 1 ? 's' : ''} para revisar
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className={styles.filterTabs}>
        {[
          { key: 'all', label: 'Todas' },
          { key: 'COMPROBANTE_SUBIDO', label: 'Para revisar' },
          { key: 'CONFIRMADA', label: 'Confirmadas' },
          { key: 'PENDIENTE_PAGO', label: 'Pendientes' },
          { key: 'CANCELADA', label: 'Canceladas' },
        ].map((f) => (
          <button
            key={f.key}
            className={`${styles.filterTab} ${filter === f.key ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className={styles.filterCount}>
                {f.key === 'all' ? enrollments.length : enrollments.filter((e) => e.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.enrollmentTable}>
        {filtered.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>
            {enrollments.length === 0 ? 'No hay inscripciones aún.' : 'Sin resultados para este filtro.'}
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Perfil</th>
                <th>Pago</th>
                <th>Estado</th>
                <th>Comprobante</th>
                <th>Título</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className={styles.userCell}>
                      <span className={styles.userName}>{e.userName || '—'}</span>
                      <span className={styles.userEmail}>{e.email}</span>
                    </div>
                  </td>
                  <td>{e.profile?.name ?? '—'}</td>
                  <td>{e.paymentMethod ? METHOD_LABEL[e.paymentMethod] ?? e.paymentMethod : '—'}</td>
                  <td>
                    <span className={`${styles.enrollStatusBadge} ${STATUS_CLASS[e.status] ?? ''}`}>
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </td>
                  <td>{e.receiptUrl ? <FileLink url={e.receiptUrl} /> : '—'}</td>
                  <td>{e.credentialUrl ? <FileLink url={e.credentialUrl} /> : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {e.status === 'COMPROBANTE_SUBIDO' && (
                        <>
                          <button
                            className={styles.actionBtnConfirm}
                            title="Confirmar inscripción"
                            onClick={() => updateStatus(e.id, 'CONFIRMADA')}
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            className={styles.actionBtnDelete}
                            title="Rechazar"
                            onClick={() => updateStatus(e.id, 'CANCELADA')}
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      {e.status === 'PENDIENTE_PAGO' && (
                        <button
                          className={styles.actionBtnConfirm}
                          title="Marcar como confirmada (pago verificado)"
                          onClick={() => updateStatus(e.id, 'CONFIRMADA')}
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      <button
                        className={styles.actionBtnDelete}
                        title="Eliminar inscripción"
                        onClick={() => deleteEnrollment(e.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
