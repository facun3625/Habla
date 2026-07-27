'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import styles from '../../../account.module.css';

type Gate = {
  step1Content: string | null;
  term1Title: string | null;
  term1Body: string | null;
  term2Title: string | null;
  term2Body: string | null;
};
type Progress = {
  step1At: string | null;
  term1AcceptedAt: string | null;
  term2AcceptedAt: string | null;
  completedAt: string | null;
};

export default function GateFlow({
  gate,
  progress,
  onAdvance,
}: {
  gate: Gate;
  progress: Progress;
  onAdvance: (step: 1 | 2 | 3) => Promise<void>;
}) {
  // El paso pendiente es el que todavía requiere acción del alumno.
  let pendingStep: 1 | 2 | 3 = 1;
  if (progress.step1At) pendingStep = 2;
  if (progress.term1AcceptedAt) pendingStep = 3;

  const [viewStep, setViewStep] = useState<1 | 2 | 3>(pendingStep);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cuando se completa un paso de verdad (avanza el pendingStep real), seguimos la vista hasta ahí.
  useEffect(() => {
    setViewStep(pendingStep);
    setChecked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStep]);

  const isReviewing = viewStep < pendingStep;

  const goBack = () => setViewStep((s) => (s - 1) as 1 | 2 | 3);

  const primaryAction = async () => {
    if (isReviewing) {
      setViewStep((s) => (s + 1) as 1 | 2 | 3);
      return;
    }
    setSubmitting(true);
    await onAdvance(viewStep);
    setSubmitting(false);
  };

  const steps = {
    1: { title: null, body: gate.step1Content, needsCheckbox: false },
    2: { title: gate.term1Title || 'Término y condición 1', body: gate.term1Body, needsCheckbox: true },
    3: { title: gate.term2Title || 'Término y condición 2', body: gate.term2Body, needsCheckbox: true },
  } as const;

  const current = steps[viewStep];

  return (
    <div className={styles.card}>
      <p className={styles.gateStepIndicator}>Paso {viewStep} de 3</p>
      {current.title && (
        <h2 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>
          {current.title}
        </h2>
      )}
      <div className={styles.gateBody} dangerouslySetInnerHTML={{ __html: current.body || '' }} />

      {current.needsCheckbox && (
        isReviewing ? (
          <div className={styles.gateCheckboxRow}>
            <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
            Ya aceptaste este término.
          </div>
        ) : (
          <label className={styles.gateCheckboxRow}>
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            He leído y acepto este término.
          </label>
        )
      )}

      <div className={styles.gateActions}>
        {viewStep > 1 && (
          <button type="button" className={styles.gateBackButton} onClick={goBack} disabled={submitting}>
            <ArrowLeft size={16} /> Atrás
          </button>
        )}
        <button
          className={styles.gateButton}
          onClick={primaryAction}
          disabled={submitting || (!isReviewing && current.needsCheckbox && !checked)}
        >
          {submitting ? 'Cargando...' : isReviewing ? 'Siguiente' : current.needsCheckbox ? 'Aceptar y continuar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
