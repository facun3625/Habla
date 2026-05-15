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
  priceARS: Price | null;
  priceUSD: Price | null;
};

type CurrencyDraft = { amount: string };

export default function Prices({ courseId }: { courseId: string }) {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { ARS: CurrencyDraft; USD: CurrencyDraft }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
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
        const profilePrices = prices.filter(p => p.profile?.id === profile.id);
        const priceARS = profilePrices.find(p => p.currency === 'ARS') ?? null;
        const priceUSD = profilePrices.find(p => p.currency === 'USD') ?? null;
        return { profile, accessibleModules, totalModules, priceARS, priceUSD };
      });

      setRows(built);
      const initialDrafts: Record<number, { ARS: CurrencyDraft; USD: CurrencyDraft }> = {};
      built.forEach(r => {
        initialDrafts[r.profile.id] = {
          ARS: { amount: r.priceARS ? String(r.priceARS.amount) : '' },
          USD: { amount: r.priceUSD ? String(r.priceUSD.amount) : '' },
        };
      });
      setDrafts(initialDrafts);
    }).finally(() => setLoading(false));
  }, [courseId]);

  const savePrice = async (row: ProfileRow, currency: 'ARS' | 'USD') => {
    const draft = drafts[row.profile.id]?.[currency];
    if (!draft?.amount) return;
    const key = `${row.profile.id}_${currency}`;
    setSaving(prev => ({ ...prev, [key]: true }));

    const existingPrice = currency === 'ARS' ? row.priceARS : row.priceUSD;
    const body = {
      name: `${row.profile.name} - ${currency}`,
      amount: Number(draft.amount),
      currency,
      profileId: row.profile.id,
    };

    let updated: Price;
    if (existingPrice) {
      const res = await fetch(`/api/courses/${courseId}/prices/${existingPrice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, active: existingPrice.active }),
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

    setRows(prev => prev.map(r => {
      if (r.profile.id !== row.profile.id) return r;
      return currency === 'ARS' ? { ...r, priceARS: updated } : { ...r, priceUSD: updated };
    }));
    setSaving(prev => ({ ...prev, [key]: false }));
    setSaved(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000);
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.pricesTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Esquema de Precios</h3>
          <p className={styles.sectionDesc}>
            Configurá el precio en pesos y en dólares por perfil. Los perfiles se toman de "Curso dirigido a".
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
            const draft = drafts[row.profile.id] ?? { ARS: { amount: '' }, USD: { amount: '' } };
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

                {/* Price inputs — ARS and USD */}
                <div className={styles.pricesSmartRight}>
                  {(['ARS', 'USD'] as const).map(currency => {
                    const key = `${row.profile.id}_${currency}`;
                    const currentPrice = currency === 'ARS' ? row.priceARS : row.priceUSD;
                    return (
                      <div key={currency} className={styles.pricesSmartInputRow} style={{ marginBottom: 8 }}>
                        <span style={{ width: 40, fontWeight: 700, fontSize: '0.85rem', color: currency === 'ARS' ? '#2563eb' : '#16a34a' }}>
                          {currency}
                        </span>
                        <input
                          type="number"
                          className={styles.input}
                          placeholder="Monto"
                          value={draft[currency].amount}
                          onChange={e => setDrafts(prev => ({
                            ...prev,
                            [row.profile.id]: {
                              ...prev[row.profile.id],
                              [currency]: { amount: e.target.value },
                            },
                          }))}
                          style={{ width: 120 }}
                        />
                        <button
                          className={styles.addBtnSmall}
                          onClick={() => savePrice(row, currency)}
                          disabled={saving[key] || !draft[currency].amount}
                          style={{ minWidth: 90 }}
                        >
                          {saved[key] ? (
                            <><Check size={14} /> Guardado</>
                          ) : saving[key] ? '...' : (
                            currentPrice ? 'Actualizar' : 'Guardar'
                          )}
                        </button>
                        {currentPrice && (
                          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 4 }}>
                            {currentPrice.amount.toLocaleString('es-AR')} {currency}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
