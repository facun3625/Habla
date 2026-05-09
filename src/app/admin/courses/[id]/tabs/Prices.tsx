'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Check, AlertCircle } from 'lucide-react';
import styles from '../courseAdmin.module.css';

type Profile = { id: number; name: string };
type ModuleAccess = { profileId: number; profile: Profile };
type Module = { id: number; name: string; accessAll: boolean; accessProfiles: ModuleAccess[] };
type Price = { id: number; amount: number; currency: string; active: boolean; profile: Profile | null };

type ProfileRow = {
  profile: Profile;
  accessibleModules: Module[];
  totalModules: number;
  price: Price | null;
};

export default function Prices({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { amount: string; currency: string }>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${courseId}`).then(r => r.json()),
      fetch('/api/profiles').then(r => r.json()),
      fetch(`/api/courses/${courseId}/modules`).then(r => r.json()),
      fetch(`/api/courses/${courseId}/prices`).then(r => r.json()),
    ]).then(([course, allProfiles, modules, prices]: [any, Profile[], Module[], Price[]]) => {
      const targetNames = (course.targetAudience ?? '')
        .split(',').map((s: string) => s.trim()).filter(Boolean);
      const courseProfiles = allProfiles.filter(p => targetNames.includes(p.name));
      const totalModules = modules.length;

      const built: ProfileRow[] = courseProfiles.map(profile => {
        const accessibleModules = modules.filter(m =>
          m.accessAll || m.accessProfiles.some(a => a.profileId === profile.id)
        );
        const price = prices.find(p => p.profile?.id === profile.id) ?? null;
        return { profile, accessibleModules, totalModules, price };
      });

      setRows(built);
      const initialDrafts: Record<number, { amount: string; currency: string }> = {};
      built.forEach(r => {
        initialDrafts[r.profile.id] = {
          amount: r.price ? String(r.price.amount) : '',
          currency: r.price?.currency ?? 'ARS',
        };
      });
      setDrafts(initialDrafts);
    }).finally(() => setLoading(false));
  }, [courseId]);

  const savePrice = async (row: ProfileRow) => {
    const draft = drafts[row.profile.id];
    if (!draft?.amount) return;
    setSaving(prev => ({ ...prev, [row.profile.id]: true }));

    const body = {
      name: row.profile.name,
      amount: Number(draft.amount),
      currency: draft.currency,
      profileId: row.profile.id,
    };

    let updated: Price;
    if (row.price) {
      const res = await fetch(`/api/courses/${courseId}/prices/${row.price.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, active: row.price.active }),
      });
      updated = await res.json();
    } else {
      const res = await fetch(`/api/courses/${courseId}/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      updated = await res.json();
    }

    setRows(prev => prev.map(r =>
      r.profile.id === row.profile.id ? { ...r, price: updated } : r
    ));
    setSaving(prev => ({ ...prev, [row.profile.id]: false }));
    setSaved(prev => ({ ...prev, [row.profile.id]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [row.profile.id]: false })), 2000);
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.pricesTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Esquema de Precios</h3>
          <p className={styles.sectionDesc}>
            Los perfiles se toman de "Curso dirigido a" en Datos Generales.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={styles.emptyState}>
          <AlertCircle size={32} />
          <p>No hay perfiles seleccionados. Marcá a quiénes va dirigido el curso en <strong>Datos Generales</strong>.</p>
        </div>
      ) : (
        <div className={styles.pricesSmartGrid}>
          {rows.map(row => {
            const draft = drafts[row.profile.id] ?? { amount: '', currency: 'ARS' };
            const allModules = row.accessibleModules.length === row.totalModules;
            const moduleCount = row.accessibleModules.length;

            return (
              <div key={row.profile.id} className={styles.pricesSmartRow}>
                {/* Profile + module info */}
                <div className={styles.pricesSmartLeft}>
                  <p className={styles.pricesSmartName}>{row.profile.name}</p>
                  <div className={styles.pricesSmartModules}>
                    <BookOpen size={13} />
                    {row.totalModules === 0 ? (
                      <span>Sin módulos configurados</span>
                    ) : allModules ? (
                      <span>Acceso a <strong>todos los módulos</strong> ({moduleCount})</span>
                    ) : (
                      <span>
                        Acceso a <strong>{moduleCount} de {row.totalModules}</strong> módulos
                        {row.accessibleModules.length > 0 && (
                          <span className={styles.pricesModuleNames}>
                            : {row.accessibleModules.map(m => m.name).join(', ')}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price input */}
                <div className={styles.pricesSmartRight}>
                  <div className={styles.pricesSmartInputRow}>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="Monto"
                      value={draft.amount}
                      onChange={e => setDrafts(prev => ({ ...prev, [row.profile.id]: { ...prev[row.profile.id], amount: e.target.value } }))}
                      style={{ width: 130 }}
                    />
                    <select
                      className={styles.input}
                      value={draft.currency}
                      onChange={e => setDrafts(prev => ({ ...prev, [row.profile.id]: { ...prev[row.profile.id], currency: e.target.value } }))}
                      style={{ width: 80 }}
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                    <button
                      className={styles.addBtnSmall}
                      onClick={() => savePrice(row)}
                      disabled={saving[row.profile.id] || !draft.amount}
                      style={{ minWidth: 90 }}
                    >
                      {saved[row.profile.id] ? (
                        <><Check size={14} /> Guardado</>
                      ) : saving[row.profile.id] ? '...' : (
                        row.price ? 'Actualizar' : 'Guardar'
                      )}
                    </button>
                  </div>
                  {row.price && (
                    <p className={styles.pricesSmartCurrent}>
                      Precio actual: <strong>{row.price.amount.toLocaleString('es-AR')} {row.price.currency}</strong>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
