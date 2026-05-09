'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import styles from '../account.module.css';

type Profile = { id: number; name: string };
type User = {
  id: number; name: string | null; email: string;
  phone: string | null; profession: string | null;
  profileId: number | null; profile: Profile | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', profession: '', profileId: '' });
  const [hasActiveEnrollments, setHasActiveEnrollments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
      fetch('/api/profiles').then((r) => r.ok ? r.json() : []),
      fetch('/api/enrollments').then((r) => r.ok ? r.json() : []),
    ]).then(([u, p, enrollments]) => {
      if (u) {
        setUser(u);
        setForm({
          name: u.name ?? '',
          phone: u.phone ?? '',
          profession: u.profession ?? '',
          profileId: u.profileId ? String(u.profileId) : '',
        });
      }
      setProfiles(Array.isArray(p) ? p : []);
      const active = Array.isArray(enrollments) && enrollments.some(
        (e: { status: string }) => ['PENDIENTE_PAGO', 'COMPROBANTE_SUBIDO', 'CONFIRMADA'].includes(e.status)
      );
      setHasActiveEnrollments(active);
    });
  }, []);

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    const body: Record<string, unknown> = {
      name: form.name,
      phone: form.phone,
      profession: form.profession,
    };
    if (!hasActiveEnrollments) {
      body.profileId = form.profileId ? Number(form.profileId) : null;
    }

    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setUser((prev) => prev ? { ...prev, ...data } : data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(data.error ?? 'Error al guardar.');
    }
  };

  if (!user) return <p style={{ color: '#94a3b8', padding: '40px 0' }}>Cargando…</p>;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mi Perfil</h1>
        <p className={styles.pageSubtitle}>Actualizá tus datos personales.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.form}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Nombre completo</label>
              <input
                type="text"
                className={styles.input}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="text"
                className={`${styles.input} ${styles.inputDisabled}`}
                value={user.email}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Teléfono</label>
              <input
                type="text"
                className={styles.input}
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Profesión / Ocupación</label>
              <input
                type="text"
                className={styles.input}
                value={form.profession}
                onChange={(e) => setForm((p) => ({ ...p, profession: e.target.value }))}
                placeholder="Ej: Fonoaudióloga"
              />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>
                Perfil
                {hasActiveEnrollments && (
                  <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, background: '#f1f5f9', borderRadius: 5, padding: '1px 7px' }}>
                    No modificable con inscripciones activas
                  </span>
                )}
              </label>
              {hasActiveEnrollments ? (
                <input
                  type="text"
                  className={`${styles.input} ${styles.inputDisabled}`}
                  value={user.profile?.name ?? 'Sin perfil asignado'}
                  readOnly
                />
              ) : (
                <select
                  className={styles.input}
                  value={form.profileId}
                  onChange={(e) => setForm((p) => ({ ...p, profileId: e.target.value }))}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Sin perfil</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {error && <div className={styles.errorBanner}><AlertCircle size={18} />{error}</div>}
          {saved && <div className={styles.successBanner}><CheckCircle size={18} />Datos guardados correctamente.</div>}

          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving
              ? <><Loader size={16} className={styles.spin} /> Guardando…</>
              : <><Save size={16} /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </>
  );
}
