'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Trash2, X, ChevronDown } from 'lucide-react';
import React from 'react';
import styles from '../courseAdmin.module.css';
import ConfirmModal from '../../../components/ConfirmModal';

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
type Installment = { id: number; number: number; amount: number; dueDate: string | null; status: string; proofUrl: string | null; notes: string | null };
type InstallmentPlan = { id: number; numInstallments: number; amountPerInstallment: number; currency: string; installments: Installment[] };
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
  installmentPlan: InstallmentPlan | null;
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

const INST_STATUS: Record<string, string> = {
  PENDING: 'Pendiente', SUBMITTED: 'Enviado', ACCEPTED: 'Acreditado', REJECTED: 'Rechazado',
};
const INST_COLOR: Record<string, string> = {
  PENDING: '#94a3b8', SUBMITTED: '#b45309', ACCEPTED: '#15803d', REJECTED: '#dc2626',
};
const INST_BG: Record<string, string> = {
  PENDING: '#f1f5f9', SUBMITTED: '#fef9c3', ACCEPTED: '#dcfce7', REJECTED: '#fee2e2',
};

export default function Enrollments({ courseId }: { courseId: string }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const refetch = () =>
    fetch(`/api/courses/${courseId}/enrollments`)
      .then((r) => r.json())
      .then((data) => setEnrollments(Array.isArray(data) ? data : []));

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, [courseId]);

  const confirmEnrollment = async (id: number) => {
    const res = await fetch(`/api/enrollments/${id}/confirm`, { method: 'POST' });
    if (res.ok) {
      await refetch();
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
      await refetch();
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    }
  };

  const toggleExpand = (id: number) =>
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const updateInstallment = async (installmentId: number, status: string) => {
    await fetch(`/api/installments/${installmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await refetch();
  };

  const deleteEnrollment = (id: number) => {
    setConfirmModal({
      message: '¿Eliminar esta inscripción? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch(`/api/enrollments/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await refetch();
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
              {filtered.map((e) => {
                const hasPlan = !!e.installmentPlan;
                const isExpanded = expandedIds.has(e.id);
                const pendingInstallments = e.installmentPlan?.installments.filter(i => i.status === 'SUBMITTED').length ?? 0;
                return (
                  <React.Fragment key={e.id}>
                    <tr>
                      <td>
                        <div className={styles.userCell}>
                          <span className={styles.userName}>{e.userName || '—'}</span>
                          <span className={styles.userEmail}>{e.email}</span>
                        </div>
                      </td>
                      <td>{e.profile?.name ?? '—'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span>{e.paymentMethod ? METHOD_LABEL[e.paymentMethod] ?? e.paymentMethod : '—'}</span>
                          {hasPlan && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6c5ce7', background: '#f0ebff', borderRadius: 10, padding: '2px 7px', width: 'fit-content' }}>
                              {e.installmentPlan!.numInstallments} cuotas
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.enrollStatusBadge} ${STATUS_CLASS[e.status] ?? ''}`}>
                          {STATUS_LABEL[e.status] ?? e.status}
                        </span>
                      </td>
                      <td>{e.receiptUrl ? <FileLink url={e.receiptUrl} /> : '—'}</td>
                      <td>{e.credentialUrl ? <FileLink url={e.credentialUrl} /> : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {hasPlan ? (
                            <button
                              className={styles.actionBtnConfirm}
                              title="Ver cuotas"
                              onClick={() => toggleExpand(e.id)}
                              style={{ position: 'relative', background: pendingInstallments > 0 ? '#6c5ce7' : undefined }}
                            >
                              <ChevronDown size={15} style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
                              {pendingInstallments > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', borderRadius: '50%', width: 14, height: 14, fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{pendingInstallments}</span>}
                            </button>
                          ) : (
                            <>
                              {e.status === 'COMPROBANTE_SUBIDO' && (
                                <>
                                  <button className={styles.actionBtnConfirm} title="Confirmar" onClick={() => updateStatus(e.id, 'CONFIRMADA')}><CheckCircle size={15} /></button>
                                  <button className={styles.actionBtnDelete} title="Rechazar" onClick={() => updateStatus(e.id, 'CANCELADA')}><XCircle size={15} /></button>
                                </>
                              )}
                              {e.status === 'PENDIENTE_PAGO' && (
                                <button className={styles.actionBtnConfirm} title="Confirmar" onClick={() => updateStatus(e.id, 'CONFIRMADA')}><CheckCircle size={15} /></button>
                              )}
                            </>
                          )}
                          <button className={styles.actionBtnDelete} title="Eliminar" onClick={() => deleteEnrollment(e.id)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                    {hasPlan && isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0 0 12px 0', background: '#faf9ff' }}>
                          <div style={{ margin: '0 12px', border: '1.5px solid #e4dcff', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ padding: '10px 16px', background: '#f0ebff', fontWeight: 700, fontSize: '0.82rem', color: '#4c3a8a', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Cuenta corriente — {e.installmentPlan!.numInstallments} cuotas de {e.installmentPlan!.amountPerInstallment.toLocaleString('es-AR')} {e.installmentPlan!.currency}</span>
                              <span style={{ fontWeight: 400, color: '#7c6fa0' }}>{e.userName}</span>
                            </div>
                            {e.installmentPlan!.installments.map(inst => (
                              <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: '1px solid #ede8ff', background: 'white', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#6c5ce7', width: 22 }}>#{inst.number}</span>
                                <span style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 600 }}>{inst.amount.toLocaleString('es-AR')} {e.installmentPlan!.currency}</span>
                                {inst.dueDate && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(inst.dueDate).toLocaleDateString('es-AR')}</span>}
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: INST_BG[inst.status] ?? '#f1f5f9', color: INST_COLOR[inst.status] ?? '#64748b' }}>
                                  {INST_STATUS[inst.status] ?? inst.status}
                                </span>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                                  {inst.proofUrl && <FileLink url={inst.proofUrl} label="Ver comprobante" />}
                                  {inst.status === 'SUBMITTED' && (
                                    <>
                                      <button className={styles.actionBtnConfirm} title="Acreditar" onClick={() => updateInstallment(inst.id, 'ACCEPTED')}><CheckCircle size={14} /></button>
                                      <button className={styles.actionBtnDelete} title="Rechazar" onClick={() => updateInstallment(inst.id, 'REJECTED')}><XCircle size={14} /></button>
                                    </>
                                  )}
                                  {inst.status === 'ACCEPTED' && <CheckCircle size={16} color="#15803d" />}
                                  {inst.status === 'REJECTED' && <XCircle size={16} color="#dc2626" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
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
