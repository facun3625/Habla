'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, Upload, ChevronDown } from 'lucide-react';
import styles from '../account.module.css';

type Installment = { id: number; number: number; amount: number; dueDate: string | null; status: string };
type InstallmentPlan = { id: number; numInstallments: number; amountPerInstallment: number; currency: string; installments: Installment[] };
type Enrollment = {
  id: number; status: string; createdAt: string; paymentMethod: string | null;
  course: { id: number; title: string; coverImage: string | null; startDate: string | null; modality: string };
  profile: { name: string } | null;
  installmentPlan: InstallmentPlan | null;
};

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  COMPROBANTE_SUBIDO: 'Comprobante enviado — en revisión',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

const STATUS_BADGE: Record<string, string> = {
  PENDIENTE_PAGO: 'badgePending',
  COMPROBANTE_SUBIDO: 'badgeUploaded',
  CONFIRMADA: 'badgeConfirmed',
  CANCELADA: 'badgeCancelled',
};

const INST_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', SUBMITTED: 'En revisión', ACCEPTED: 'Pagada', REJECTED: 'Rechazada',
};

const INST_BADGE: Record<string, string> = {
  PENDING: 'instPending', SUBMITTED: 'instSubmitted', ACCEPTED: 'instAccepted', REJECTED: 'instRejected',
};

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<{ id: number; message: string } | null>(null);

  const refetch = () =>
    fetch('/api/enrollments')
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setEnrollments(Array.isArray(d) ? d : []));

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: number) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const uploadInstallmentProof = async (installmentId: number, file: File) => {
    setUploadingId(installmentId);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/installments/${installmentId}/proof`, { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError({ id: installmentId, message: data.error || 'Error al subir el comprobante.' });
        return;
      }
      await refetch();
    } catch {
      setUploadError({ id: installmentId, message: 'Error de conexión. Intentá de nuevo.' });
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) return <p style={{ color: '#94a3b8', padding: '40px 0' }}>Cargando…</p>;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mis Cursos</h1>
        <p className={styles.pageSubtitle}>Todas tus inscripciones y su estado.</p>
      </div>

      {enrollments.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          <div className={styles.emptyIcon}>📚</div>
          <p>Todavía no estás inscripta en ningún curso.</p>
          <Link href="/#cursos" style={{ color: '#6c5ce7', fontWeight: 700, textDecoration: 'none' }}>
            Ver cursos disponibles →
          </Link>
        </div>
      ) : (
        <div className={styles.enrollList}>
          {enrollments.map((e) => {
            const isConfirmed = e.status === 'CONFIRMADA';
            const isPending = e.status === 'PENDIENTE_PAGO';
            const badgeKey = STATUS_BADGE[e.status] ?? 'badgePending';
            const hasPlan = !!e.installmentPlan;
            const isExpanded = expandedIds.has(e.id);

            return (
              <div key={e.id} className={styles.enrollCard} style={{ textDecoration: 'none', flexWrap: 'wrap' }}>
                <div className={styles.enrollCover}>
                  {e.course.coverImage
                    ? <img src={e.course.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <BookOpen size={28} />}
                </div>

                <div className={styles.enrollInfo}>
                  <p className={styles.enrollTitle}>{e.course.title}</p>
                  <div className={styles.enrollMeta}>
                    <span className={`${styles.badge} ${styles[badgeKey]}`}>{STATUS_LABEL[e.status]}</span>
                    {e.profile && <span>· {e.profile.name}</span>}
                    {e.course.startDate && (
                      <span>· Inicio: {new Date(e.course.startDate).toLocaleDateString('es-AR')}</span>
                    )}
                    <span>· Inscripta el {new Date(e.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>

                {hasPlan && (
                  <button className={styles.installmentToggle} onClick={() => toggleExpand(e.id)}>
                    <ChevronDown size={15} style={{ transform: isExpanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
                    Ver cuotas
                  </button>
                )}

                {isConfirmed && (
                  <Link href={`/mi-cuenta/cursos/${e.course.id}`} className={styles.enrollAction}>
                    <ArrowRight size={16} /> Entrar
                  </Link>
                )}

                {isPending && e.paymentMethod === 'TRANSFERENCIA' && (
                  <Link
                    href={`/cursos/${e.course.id}`}
                    className={styles.enrollAction}
                    style={{ background: '#f59e0b' }}
                  >
                    <Upload size={16} /> Subir comprobante
                  </Link>
                )}

                {hasPlan && isExpanded && (
                  <div className={styles.installmentPanel}>
                    <div className={styles.installmentHeader}>
                      {e.installmentPlan!.numInstallments} cuotas de {e.installmentPlan!.amountPerInstallment.toLocaleString('es-AR')} {e.installmentPlan!.currency}
                    </div>
                    {e.installmentPlan!.installments.map((inst) => {
                      const canUpload = inst.status === 'PENDING' || inst.status === 'REJECTED';
                      const isUploading = uploadingId === inst.id;
                      return (
                        <div key={inst.id} className={styles.installmentRow}>
                          <span className={styles.installmentNum}>#{inst.number}</span>
                          <span className={styles.installmentAmount}>
                            {inst.amount.toLocaleString('es-AR')} {e.installmentPlan!.currency}
                          </span>
                          {inst.dueDate && (
                            <span className={styles.installmentDue}>
                              Vence: {new Date(inst.dueDate).toLocaleDateString('es-AR')}
                            </span>
                          )}
                          <span className={`${styles.instBadge} ${styles[INST_BADGE[inst.status] ?? 'instPending']}`} style={canUpload ? { marginLeft: 0 } : undefined}>
                            {INST_STATUS_LABEL[inst.status] ?? inst.status}
                          </span>
                          {canUpload && (
                            <label className={styles.installmentUploadBtn} style={{ marginLeft: 'auto', opacity: isUploading ? 0.6 : 1, pointerEvents: isUploading ? 'none' : undefined }}>
                              <Upload size={13} /> {isUploading ? 'Subiendo…' : 'Subir comprobante'}
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                style={{ display: 'none' }}
                                onChange={(ev) => {
                                  const file = ev.target.files?.[0];
                                  if (file) uploadInstallmentProof(inst.id, file);
                                  ev.target.value = '';
                                }}
                              />
                            </label>
                          )}
                          {uploadError?.id === inst.id && (
                            <span style={{ width: '100%', fontSize: '0.75rem', color: '#dc2626' }}>{uploadError.message}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
