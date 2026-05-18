'use client';

import { useState, useEffect } from 'react';
import { Check, Info } from 'lucide-react';
import styles from '../courseAdmin.module.css';

type Profile = { id: number; name: string };
type CPConfig = {
  profileId: number;
  profile: Profile;
  installmentsEnabled: boolean;
  maxInstallments: number;
};

export default function Installments({ courseId }: { courseId: string }) {
  const [configs, setConfigs] = useState<CPConfig[]>([]);
  const [globalAR, setGlobalAR] = useState(false);
  const [globalEXT, setGlobalEXT] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${courseId}/installments`).then(r => r.json()),
      fetch('/api/settings?public=1').then(r => r.json()),
    ]).then(([cps, settings]) => {
      setConfigs(cps);
      setGlobalAR(settings.cuotas_ar_enabled === 'true');
      setGlobalEXT(settings.cuotas_ext_enabled === 'true');
    }).finally(() => setLoading(false));
  }, [courseId]);

  const globalEnabled = globalAR || globalEXT;

  const update = (profileId: number, field: 'installmentsEnabled' | 'maxInstallments', value: boolean | number) =>
    setConfigs(prev => prev.map(c => c.profileId === profileId ? { ...c, [field]: value } : c));

  const save = async () => {
    setSaving(true);
    await fetch(`/api/courses/${courseId}/installments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configs.map(c => ({
        profileId: c.profileId,
        installmentsEnabled: c.installmentsEnabled,
        maxInstallments: c.maxInstallments,
      }))),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.modulesTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Configuración de Cuotas</h3>
          <p className={styles.sectionDesc}>Habilitá el pago en cuotas por perfil para este curso.</p>
        </div>
        <button className={styles.addBtnSmall} onClick={save} disabled={saving}>
          <Check size={14} /> {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      {!globalEnabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fef9c3', border: '1.5px solid #fde047', borderRadius: 12, marginBottom: 20, fontSize: '0.88rem', color: '#854d0e' }}>
          <Info size={16} />
          Las cuotas no están habilitadas globalmente. Activá "Cuotas" en <strong>Configuración → Cuotas</strong> primero.
        </div>
      )}

      {configs.length === 0 ? (
        <p style={{ color: '#aaa', padding: '2rem', textAlign: 'center' }}>
          Este curso no tiene perfiles configurados. Agregá perfiles en la pestaña Precios.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {configs.map(c => (
            <div key={c.profileId} style={{ border: `1.5px solid ${c.installmentsEnabled ? '#6c5ce7' : '#e8e3ff'}`, borderRadius: 14, padding: '18px 20px', background: c.installmentsEnabled ? '#faf9ff' : 'white', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a004f' }}>{c.profile.name}</div>
                </div>

                {/* Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Cuotas</span>
                  <button
                    type="button"
                    onClick={() => update(c.profileId, 'installmentsEnabled', !c.installmentsEnabled)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: c.installmentsEnabled ? '#6c5ce7' : '#cbd5e1',
                      position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: c.installmentsEnabled ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', display: 'block',
                    }} />
                  </button>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: c.installmentsEnabled ? '#6c5ce7' : '#94a3b8' }}>
                    {c.installmentsEnabled ? 'Habilitado' : 'Deshabilitado'}
                  </span>
                </div>

                {/* Max cuotas */}
                {c.installmentsEnabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Máx. cuotas</span>
                    <select
                      value={c.maxInstallments}
                      onChange={e => update(c.profileId, 'maxInstallments', Number(e.target.value))}
                      style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.88rem', fontFamily: 'inherit', color: '#1e293b' }}
                    >
                      {[2, 3, 4, 6, 8, 10, 12].map(n => (
                        <option key={n} value={n}>{n} cuotas</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
