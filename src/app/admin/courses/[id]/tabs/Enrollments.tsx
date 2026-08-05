'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Trash2, X, ChevronDown, Bell, Search, Mail } from 'lucide-react';
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

type Profile = { name: string; id?: number };
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
  gateAccepted: boolean;
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
  TRANSFERENCIA_UY: 'Transferencia UY',
  TRANSFERENCIA_EXT: 'Transferencia Exterior',
};

// A qué moneda del esquema de precios corresponde cada medio de pago.
// No hay un monto guardado por inscripción, así que el total pagado se estima
// buscando el precio actual del perfil en la moneda que corresponde a este medio.
const CURRENCY_FOR_METHOD: Record<string, 'ARS' | 'USD'> = {
  MERCADO_PAGO: 'ARS',
  TRANSFERENCIA: 'ARS',
  TRANSFERENCIA_AR: 'ARS',
  TRANSFERENCIA_UY: 'USD',
  TRANSFERENCIA_EXT: 'USD',
  PAYPAL: 'USD',
};

type Price = { amount: number; currency: string; profile: { id: number } | null };

// Monto a mostrar por inscripción en la columna "Precio". Si pesify está activo,
// todo se re-expresa en el precio ARS del perfil (cuotas: proporcional a lo pagado).
function enrollmentAmount(
  e: Enrollment,
  prices: Price[],
  pesify: boolean
): { text: string; approx: boolean } {
  if (e.status !== 'CONFIRMADA') return { text: '—', approx: false };

  if (pesify) {
    const arsPrice = e.profile?.id
      ? prices.find((p) => p.profile?.id === e.profile!.id && p.currency === 'ARS')
      : undefined;
    if (!arsPrice) return { text: '—', approx: false };
    if (e.installmentPlan) {
      const totalContracted = e.installmentPlan.numInstallments * e.installmentPlan.amountPerInstallment;
      const paid = e.installmentPlan.installments
        .filter((i) => i.status === 'ACCEPTED')
        .reduce((sum, i) => sum + i.amount, 0);
      const fraction = totalContracted > 0 ? paid / totalContracted : 0;
      return { text: `${Math.round(arsPrice.amount * fraction).toLocaleString('es-AR')} ARS`, approx: true };
    }
    return { text: `${arsPrice.amount.toLocaleString('es-AR')} ARS`, approx: false };
  }

  if (e.installmentPlan) {
    const paid = e.installmentPlan.installments
      .filter((i) => i.status === 'ACCEPTED')
      .reduce((sum, i) => sum + i.amount, 0);
    return { text: `${paid.toLocaleString('es-AR')} ${e.installmentPlan.currency}`, approx: false };
  }

  const currency = e.paymentMethod ? CURRENCY_FOR_METHOD[e.paymentMethod] : undefined;
  const price = currency && e.profile?.id
    ? prices.find((p) => p.profile?.id === e.profile!.id && p.currency === currency)
    : undefined;
  if (!price) return { text: '—', approx: false };
  return { text: `${price.amount.toLocaleString('es-AR')} ${currency}`, approx: true };
}

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
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [resendModal, setResendModal] = useState<{ id: number; email: string } | null>(null);
  const [extraEmail, setExtraEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendError, setResendError] = useState('');
  const [pesify, setPesify] = useState(false);

  const refetch = () =>
    fetch(`/api/courses/${courseId}/enrollments`)
      .then((r) => r.json())
      .then((data) => setEnrollments(Array.isArray(data) ? data : []));

  useEffect(() => {
    refetch().finally(() => setLoading(false));
    fetch(`/api/courses/${courseId}/prices`)
      .then((r) => r.json())
      .then((data) => setPrices(Array.isArray(data) ? data : []))
      .catch(() => setPrices([]));
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
    try {
      const res = await fetch(`/api/installments/${installmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'No se pudo actualizar la cuota. Intentá de nuevo.');
        return;
      }
      await refetch();
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch {
      alert('Error de conexión al actualizar la cuota. Intentá de nuevo.');
    }
  };

  const remindInstallment = async (installmentId: number) => {
    await fetch(`/api/installments/${installmentId}/remind`, { method: 'POST' });
  };

  const openResendModal = (id: number, email: string) => {
    setResendModal({ id, email });
    setExtraEmail('');
    setResendStatus('idle');
    setResendError('');
  };

  const closeResendModal = () => {
    setResendModal(null);
    setResendStatus('idle');
  };

  const sendResendConfirmation = async () => {
    if (!resendModal) return;
    setResendStatus('sending');
    setResendError('');
    const timeout = AbortSignal.timeout(30000);
    try {
      const res = await fetch(`/api/enrollments/${resendModal.id}/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraEmail: extraEmail.trim() || undefined }),
        signal: timeout,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResendStatus('error');
        setResendError(data.error || 'Error al reenviar el mail');
        return;
      }
      setResendStatus('sent');
    } catch (err) {
      setResendStatus('error');
      setResendError(
        err instanceof DOMException && err.name === 'TimeoutError'
          ? 'El envío está tardando demasiado. Puede que el mail haya salido igual — revisá la casilla antes de reintentar.'
          : 'Error al reenviar el mail'
      );
    }
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

  const withPendingInstallments = enrollments.filter(e =>
    e.installmentPlan?.installments.some(i => i.status === 'PENDING' || i.status === 'SUBMITTED')
  );

  const withCompletedPlan = enrollments.filter(e =>
    e.installmentPlan &&
    e.installmentPlan.installments.length > 0 &&
    e.installmentPlan.installments.every(i => i.status === 'ACCEPTED' || i.status === 'SUBMITTED')
  );

  const singlePayment = enrollments.filter(e =>
    e.status === 'CONFIRMADA' && !e.installmentPlan
  );

  // Total pagado: para cuotas es exacto (suma de cuotas acreditadas). Para pago único
  // no hay un monto guardado por inscripción, así que se estima con el precio ACTUAL
  // del perfil — si cambiaste un precio después de esa inscripción, esa parte va a quedar aproximada.
  let totalARS = 0;
  let totalUSD = 0;
  let undeterminedCount = 0;

  for (const e of enrollments) {
    if (e.status !== 'CONFIRMADA') continue;

    if (e.installmentPlan) {
      const paid = e.installmentPlan.installments
        .filter((i) => i.status === 'ACCEPTED')
        .reduce((sum, i) => sum + i.amount, 0);
      if (e.installmentPlan.currency === 'USD') totalUSD += paid;
      else totalARS += paid;
      continue;
    }

    const currency = e.paymentMethod ? CURRENCY_FOR_METHOD[e.paymentMethod] : undefined;
    const price = currency && e.profile?.id
      ? prices.find((p) => p.profile?.id === e.profile!.id && p.currency === currency)
      : undefined;
    if (!price) { undeterminedCount++; continue; }
    if (currency === 'USD') totalUSD += price.amount;
    else totalARS += price.amount;
  }

  // "Pesificar todo": en vez de sumar por moneda, cada inscripción se cuenta con el
  // precio en ARS de SU perfil (el mismo esquema de precios de la pestaña "Precios"),
  // sin importar en qué moneda pagó realmente. No es una cotización de dólar —
  // usa el precio en pesos que vos ya configuraste para ese perfil.
  let totalPesified = 0;
  let pesifyUndeterminedCount = 0;

  if (pesify) {
    for (const e of enrollments) {
      if (e.status !== 'CONFIRMADA') continue;
      const arsPrice = e.profile?.id
        ? prices.find((p) => p.profile?.id === e.profile!.id && p.currency === 'ARS')
        : undefined;
      if (!arsPrice) { pesifyUndeterminedCount++; continue; }

      if (e.installmentPlan) {
        const totalContracted = e.installmentPlan.numInstallments * e.installmentPlan.amountPerInstallment;
        const paid = e.installmentPlan.installments
          .filter((i) => i.status === 'ACCEPTED')
          .reduce((sum, i) => sum + i.amount, 0);
        const fraction = totalContracted > 0 ? paid / totalContracted : 0;
        totalPesified += arsPrice.amount * fraction;
      } else {
        totalPesified += arsPrice.amount;
      }
    }
  }

  const filteredByStatus = filter === 'all' ? enrollments
    : filter === 'CUOTAS_PENDIENTES' ? withPendingInstallments
    : filter === 'CUOTAS_COMPLETAS' ? withCompletedPlan
    : filter === 'PAGO_UNICO' ? singlePayment
    : enrollments.filter((e) => e.status === filter);

  const searchTerm = search.trim().toLowerCase();
  const filtered = searchTerm
    ? filteredByStatus.filter((e) =>
        e.userName.toLowerCase().includes(searchTerm) || e.email.toLowerCase().includes(searchTerm)
      )
    : filteredByStatus;

  const pendingReceipts = enrollments.filter((e) => e.status === 'COMPROBANTE_SUBIDO').length;

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.enrollmentsTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Inscripciones ({enrollments.length})</h3>
          <p className={styles.sectionDesc}>Revisá pagos y confirmá inscripciones.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {(totalARS > 0 || totalUSD > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {pesify ? (
                <div
                  title="Cada inscripción cuenta con el precio en ARS de su perfil, no con una cotización de dólar."
                  style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}
                >
                  Total pesificado: {Math.round(totalPesified).toLocaleString('es-AR')} ARS
                </div>
              ) : (
                <>
                  {totalARS > 0 && (
                    <div
                      title="Cuotas: exacto (solo acreditadas). Pago único: estimado con el precio actual del perfil."
                      style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}
                    >
                      Total pagado: {totalARS.toLocaleString('es-AR')} ARS
                    </div>
                  )}
                  {totalUSD > 0 && (
                    <div
                      title="Cuotas: exacto (solo acreditadas). Pago único: estimado con el precio actual del perfil."
                      style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}
                    >
                      Total pagado: {totalUSD.toLocaleString('es-AR')} USD
                    </div>
                  )}
                </>
              )}
              {totalUSD > 0 && (
                <button
                  type="button"
                  onClick={() => setPesify((v) => !v)}
                  title="Convierte todo a pesos usando el precio en ARS de cada perfil (no aplica cotización de dólar)."
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: pesify ? '#6c5ce7' : '#f1f5f9',
                    color: pesify ? 'white' : '#475569',
                    border: 'none', borderRadius: 20, padding: '6px 14px',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  🇦🇷 {pesify ? 'Pesificado' : 'Pesificar todo'}
                </button>
              )}
            </div>
          )}
          {!pesify && undeterminedCount > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {undeterminedCount} confirmada{undeterminedCount > 1 ? 's' : ''} sin precio configurado para su perfil/moneda — no se sumó al total
            </span>
          )}
          {pesify && pesifyUndeterminedCount > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {pesifyUndeterminedCount} confirmada{pesifyUndeterminedCount > 1 ? 's' : ''} sin precio en ARS configurado para su perfil — no se sumó al total
            </span>
          )}
          {pendingReceipts > 0 && (
            <div className={styles.alertBadge}>
              {pendingReceipts} comprobante{pendingReceipts > 1 ? 's' : ''} para revisar
            </div>
          )}
        </div>
      </div>

      <div className={styles.searchBox}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div className={styles.filterTabs}>
        {[
          { key: 'all', label: 'Todas', count: enrollments.length },
          { key: 'COMPROBANTE_SUBIDO', label: 'Para revisar', count: enrollments.filter(e => e.status === 'COMPROBANTE_SUBIDO').length },
          { key: 'CONFIRMADA', label: 'Confirmadas', count: enrollments.filter(e => e.status === 'CONFIRMADA').length },
          { key: 'CUOTAS_PENDIENTES', label: 'Cuotas pendientes', count: withPendingInstallments.length },
          { key: 'CUOTAS_COMPLETAS', label: 'Plan completo', count: withCompletedPlan.length },
          { key: 'PAGO_UNICO', label: 'Pago único', count: singlePayment.length },
          { key: 'PENDIENTE_PAGO', label: 'Pendientes', count: enrollments.filter(e => e.status === 'PENDIENTE_PAGO').length },
          { key: 'CANCELADA', label: 'Canceladas', count: enrollments.filter(e => e.status === 'CANCELADA').length },
        ].map((f) => (
          <button
            key={f.key}
            className={`${styles.filterTab} ${filter === f.key ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className={styles.filterCount}>{f.count}</span>
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
                <th>Precio</th>
                <th>Estado</th>
                <th title="Aceptó la información y los términos de 'Links de conexión'">Consent.</th>
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
                        {(() => {
                          const { text, approx } = enrollmentAmount(e, prices, pesify);
                          return (
                            <span
                              title={approx ? 'Estimado con el precio configurado, no es el monto exacto guardado del pago.' : undefined}
                              style={{ fontWeight: 700, color: text === '—' ? '#cbd5e1' : '#1e293b' }}
                            >
                              {text}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`${styles.enrollStatusBadge} ${STATUS_CLASS[e.status] ?? ''}`}>
                          {STATUS_LABEL[e.status] ?? e.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} title={e.gateAccepted ? 'Aceptó la información y los términos' : 'Todavía no aceptó'}>
                        {e.gateAccepted
                          ? <CheckCircle size={16} color="#15803d" />
                          : <XCircle size={16} color="#cbd5e1" />}
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
                          {e.status === 'CONFIRMADA' && (
                            <button
                              title="Reenviar confirmación por mail"
                              onClick={() => openResendModal(e.id, e.email)}
                              style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '4px 7px', cursor: 'pointer', color: '#6c5ce7', display: 'flex', alignItems: 'center' }}
                            >
                              <Mail size={15} />
                            </button>
                          )}
                          <button className={styles.actionBtnDelete} title="Eliminar" onClick={() => deleteEnrollment(e.id)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                    {hasPlan && isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ padding: '0 0 12px 0', background: '#faf9ff' }}>
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
                                  {inst.status === 'PENDING' && (
                                    <button
                                      title="Enviar recordatorio"
                                      onClick={() => remindInstallment(inst.id)}
                                      style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 7px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                                    >
                                      <Bell size={12} /> Recordar
                                    </button>
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
      {resendModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,40,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={closeResendModal}
        >
          <div
            style={{ background: 'white', borderRadius: 18, padding: '32px 32px 28px', maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>Reenviar confirmación</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
              Se enviará a <strong>{resendModal.email}</strong>. Opcionalmente podés agregar un email adicional para que le llegue también a otra casilla.
            </p>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
              Email adicional (opcional)
            </label>
            <input
              type="email"
              value={extraEmail}
              onChange={(e) => setExtraEmail(e.target.value)}
              placeholder="otro@email.com"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit' }}
            />
            {resendStatus === 'error' && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>{resendError}</p>
            )}
            {resendStatus === 'sent' && (
              <p style={{ color: '#15803d', fontSize: '0.85rem', marginBottom: 12, fontWeight: 700 }}>Mail enviado correctamente.</p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={closeResendModal}
                style={{ padding: '10px 22px', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', background: 'white', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}
              >
                {resendStatus === 'sent' ? 'Cerrar' : 'Cancelar'}
              </button>
              {resendStatus !== 'sent' && (
                <button
                  onClick={sendResendConfirmation}
                  disabled={resendStatus === 'sending'}
                  style={{ padding: '10px 22px', border: 'none', borderRadius: 10, cursor: resendStatus === 'sending' ? 'default' : 'pointer', background: '#6c5ce7', color: 'white', fontWeight: 700, fontSize: '0.9rem', opacity: resendStatus === 'sending' ? 0.7 : 1 }}
                >
                  {resendStatus === 'sending' ? 'Enviando...' : 'Enviar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
