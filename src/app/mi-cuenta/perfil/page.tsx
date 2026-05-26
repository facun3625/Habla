'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import styles from '../account.module.css';

type Profile = { id: number; name: string };
type User = {
  id: number; name: string | null; email: string;
  phone: string | null; profession: string | null;
  profileId: number | null; profile: Profile | null;
  birthDate: string | null; dni: string | null; city: string | null;
  hasApraxiaExperience: boolean | null; hasOtherTraining: boolean | null;
  specificMethod: string | null;
};

function calcAge(dateStr: string): number | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', profession: '', profileId: '' });
  const [hasActiveEnrollments, setHasActiveEnrollments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Questionnaire form state
  const [qForm, setQForm] = useState({
    birthDate: '', dni: '', city: '',
    hasApraxiaExperience: null as boolean | null,
    hasOtherTraining: null as boolean | null,
    methodYes: null as boolean | null,
    specificMethod: '',
  });
  const [qSaving, setQSaving] = useState(false);
  const [qSaved, setQSaved] = useState(false);
  const [qError, setQError] = useState('');

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
        setQForm({
          birthDate: u.birthDate ? u.birthDate.slice(0, 10) : '',
          dni: u.dni ?? '',
          city: u.city ?? '',
          hasApraxiaExperience: u.hasApraxiaExperience ?? null,
          hasOtherTraining: u.hasOtherTraining ?? null,
          methodYes: u.specificMethod !== null && u.specificMethod !== undefined ? true : null,
          specificMethod: u.specificMethod ?? '',
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

  const saveQuestionnaire = async () => {
    if (qForm.methodYes && !qForm.specificMethod.trim()) {
      setQError('Especificá el método en que estás entrenado.'); return;
    }
    setQSaving(true); setQError(''); setQSaved(false);
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthDate: qForm.birthDate || null,
        dni: qForm.dni.trim() || null,
        city: qForm.city.trim() || null,
        hasApraxiaExperience: qForm.hasApraxiaExperience,
        hasOtherTraining: qForm.hasOtherTraining,
        specificMethod: qForm.methodYes ? qForm.specificMethod.trim() || null : null,
        questionnaireCompleted: true,
      }),
    });
    const data = await res.json();
    setQSaving(false);
    if (res.ok) {
      setUser((prev) => prev ? { ...prev, ...data } : data);
      setQSaved(true);
      setTimeout(() => setQSaved(false), 3000);
    } else {
      setQError(data.error ?? 'Error al guardar.');
    }
  };

  const age = calcAge(qForm.birthDate);

  if (!user) return <p style={{ color: '#94a3b8', padding: '40px 0' }}>Cargando…</p>;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mi Perfil</h1>
        <p className={styles.pageSubtitle}>Actualizá tus datos personales.</p>
      </div>

      {/* ── Datos de cuenta ── */}
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

      {/* ── Datos de inscripción ── */}
      <div className={styles.card} style={{ marginTop: 24 }}>
        <h2 className={styles.cardTitle}>Datos de inscripción</h2>
        <div className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Fecha de nacimiento</label>
              <input
                type="date"
                className={styles.input}
                value={qForm.birthDate}
                onChange={(e) => setQForm(p => ({ ...p, birthDate: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Edad</label>
              <div className={styles.ageDisplay}>{age !== null ? `${age} años` : '—'}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>DNI</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ej: 30123456"
                value={qForm.dni}
                onChange={(e) => setQForm(p => ({ ...p, dni: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Ciudad donde ejercés la profesión</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ej: Buenos Aires"
                value={qForm.city}
                onChange={(e) => setQForm(p => ({ ...p, city: e.target.value }))}
              />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>¿Tenés experiencia trabajando con niños con apraxia?</label>
              <div className={styles.yesNo}>
                <button type="button" className={`${styles.yesNoBtn} ${qForm.hasApraxiaExperience === true ? styles.yesNoBtnActive : ''}`} onClick={() => setQForm(p => ({ ...p, hasApraxiaExperience: true }))}>Sí</button>
                <button type="button" className={`${styles.yesNoBtn} ${qForm.hasApraxiaExperience === false ? styles.yesNoBtnActive : ''}`} onClick={() => setQForm(p => ({ ...p, hasApraxiaExperience: false }))}>No</button>
              </div>
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>¿Tomaste otras formaciones en la temática?</label>
              <div className={styles.yesNo}>
                <button type="button" className={`${styles.yesNoBtn} ${qForm.hasOtherTraining === true ? styles.yesNoBtnActive : ''}`} onClick={() => setQForm(p => ({ ...p, hasOtherTraining: true }))}>Sí</button>
                <button type="button" className={`${styles.yesNoBtn} ${qForm.hasOtherTraining === false ? styles.yesNoBtnActive : ''}`} onClick={() => setQForm(p => ({ ...p, hasOtherTraining: false }))}>No</button>
              </div>
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>¿Estás entrenado en algún método específico?</label>
              <div className={styles.yesNo}>
                <button type="button" className={`${styles.yesNoBtn} ${qForm.methodYes === true ? styles.yesNoBtnActive : ''}`} onClick={() => setQForm(p => ({ ...p, methodYes: true }))}>Sí</button>
                <button type="button" className={`${styles.yesNoBtn} ${qForm.methodYes === false ? styles.yesNoBtnActive : ''}`} onClick={() => setQForm(p => ({ ...p, methodYes: false, specificMethod: '' }))}>No</button>
              </div>
              {qForm.methodYes && (
                <input
                  type="text"
                  className={styles.input}
                  style={{ marginTop: 10 }}
                  placeholder="Especificá el método"
                  value={qForm.specificMethod}
                  onChange={(e) => setQForm(p => ({ ...p, specificMethod: e.target.value }))}
                />
              )}
            </div>
          </div>

          {qError && <div className={styles.errorBanner}><AlertCircle size={18} />{qError}</div>}
          {qSaved && <div className={styles.successBanner}><CheckCircle size={18} />Datos de inscripción guardados.</div>}

          <button className={styles.saveBtn} onClick={saveQuestionnaire} disabled={qSaving}>
            {qSaving
              ? <><Loader size={16} className={styles.spin} /> Guardando…</>
              : <><Save size={16} /> Guardar datos de inscripción</>}
          </button>
        </div>
      </div>
    </>
  );
}
