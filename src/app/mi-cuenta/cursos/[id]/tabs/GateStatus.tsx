'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
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

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function GateStatus({ gate, progress }: { gate: Gate; progress: Progress }) {
  const [openId, setOpenId] = useState<'step1' | 'term1' | 'term2' | null>(null);

  const items = [
    { id: 'step1' as const, label: 'Información leída', date: progress.step1At, body: gate.step1Content },
    { id: 'term1' as const, label: gate.term1Title || 'Término y condición 1', date: progress.term1AcceptedAt, body: gate.term1Body },
    { id: 'term2' as const, label: gate.term2Title || 'Término y condición 2', date: progress.term2AcceptedAt, body: gate.term2Body },
  ];

  return (
    <div className={styles.gateStatusCard}>
      <p className={styles.gateStatusTitle}>Ya leíste esta información y aceptaste los términos</p>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className={styles.gateStatusItem}>
            <button
              type="button"
              className={styles.gateStatusRow}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
              <span className={styles.gateStatusLabel}>{item.label}</span>
              <span className={styles.gateStatusDate}>{formatDate(item.date)}</span>
              <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', color: '#a78bfa' }} />
            </button>
            {isOpen && (
              <div className={styles.gateStatusBody} dangerouslySetInnerHTML={{ __html: item.body || '' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
