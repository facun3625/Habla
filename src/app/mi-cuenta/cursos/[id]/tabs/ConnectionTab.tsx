'use client';

import { useState, useEffect } from 'react';
import { Video, Lock } from 'lucide-react';
import styles from '../../../account.module.css';
import { canAccess, type Module as AccessModule } from '../courseAccess';
import GateFlow from './GateFlow';
import GateStatus from './GateStatus';

type ConnectionModule = AccessModule & { connectionLink: string | null; connectionInfo: string | null };
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
type ConnectionData = {
  gate: Gate | null;
  progress: Progress;
  modules: ConnectionModule[] | null;
};

export default function ConnectionTab({ courseId, profileId }: { courseId: string; profileId: number | null }) {
  const [data, setData] = useState<ConnectionData | null>(null);
  const [blockReason, setBlockReason] = useState<'NOT_ENROLLED' | 'INSTALLMENTS_PENDING' | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/courses/${courseId}/connection`)
      .then(async (r) => {
        if (r.status === 403) {
          const body = await r.json().catch(() => ({}));
          setBlockReason(body.error === 'INSTALLMENTS_PENDING' ? 'INSTALLMENTS_PENDING' : 'NOT_ENROLLED');
          return;
        }
        if (!r.ok) return;
        setData(await r.json());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [courseId]);

  const advance = async (step: 1 | 2 | 3) => {
    const res = await fetch(`/api/courses/${courseId}/connection/gate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    });
    if (res.ok) load();
  };

  if (loading) return <p style={{ color: '#94a3b8', padding: '40px 0' }}>Cargando…</p>;

  if (blockReason === 'NOT_ENROLLED') {
    return (
      <div className={styles.card}>
        <p style={{ color: '#64748b', textAlign: 'center', padding: '24px 0' }}>
          Todavía no tenés una inscripción confirmada en este curso. Una vez que tu pago sea confirmado vas a poder ver los links de conexión.
        </p>
      </div>
    );
  }

  if (blockReason === 'INSTALLMENTS_PENDING') {
    return (
      <div className={styles.card}>
        <p style={{ color: '#64748b', textAlign: 'center', padding: '24px 0' }}>
          Para acceder a los links de conexión primero tenés que saldar todas las cuotas pendientes de este curso. Podés ver el estado de tus pagos en &quot;Mis Cursos&quot;.
        </p>
      </div>
    );
  }

  if (!data) return null;

  if (!data.progress.completedAt && data.gate) {
    return <GateFlow gate={data.gate} progress={data.progress} onAdvance={advance} />;
  }

  const modules = data.modules ?? [];

  return (
    <div className={styles.card}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>
        Links de conexión
      </h2>

      {data.gate && <GateStatus gate={data.gate} progress={data.progress} />}

      {modules.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>Este curso todavía no tiene módulos cargados.</p>
      ) : (
        modules.map((mod) => {
          const accessible = canAccess(mod, profileId);
          return (
            <div key={mod.id} className={`${styles.connectionItem} ${!accessible ? styles.connectionItemLocked : ''}`}>
              <div className={`${styles.moduleNum} ${accessible ? styles.moduleNumActive : ''}`}>
                {accessible ? <Video size={14} /> : <Lock size={13} />}
              </div>
              <div style={{ flex: 1 }}>
                <span className={styles.moduleName}>{mod.name}</span>
                {mod.date && <span className={styles.moduleDate} style={{ marginLeft: 8 }}>📅 {mod.date}</span>}
                {accessible && mod.connectionInfo && (
                  <div className={styles.connectionInfoBody} dangerouslySetInnerHTML={{ __html: mod.connectionInfo }} />
                )}
                {!accessible && (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>Sin acceso</div>
                )}
              </div>
              {accessible && (
                mod.connectionLink
                  ? <a href={mod.connectionLink} target="_blank" rel="noreferrer" className={styles.connectionLinkBtn}>Unirme</a>
                  : <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>Próximamente</span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
