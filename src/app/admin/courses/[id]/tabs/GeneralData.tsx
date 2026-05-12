'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../courseAdmin.module.css';

type CourseForm = {
  title: string;
  startDate: string;
  endDate: string;
  modality: string;
  capacity: number;
  schedule: string;
  description: string;
  targetAudience: string;
  status: string;
  coverImage: string;
};

const EMPTY: CourseForm = {
  title: '',
  startDate: '',
  endDate: '',
  modality: 'VIRTUAL',
  capacity: 0,
  schedule: '',
  description: '',
  targetAudience: '',
  status: 'BORRADOR',
  coverImage: '',
};

type Profile = { id: number; name: string };

export default function GeneralData({ courseId, onTitleChange }: { courseId: string; onTitleChange?: (t: string) => void }) {
  const [form, setForm] = useState<CourseForm>(EMPTY);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [capacities, setCapacities] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${courseId}`).then(r => r.json()),
      fetch('/api/profiles').then(r => r.json()),
      fetch(`/api/courses/${courseId}/access`).then(r => r.json()),
    ]).then(([data, profs, access]) => {
      const loaded: CourseForm = {
        title: data.title ?? '',
        startDate: data.startDate ? data.startDate.slice(0, 10) : '',
        endDate: data.endDate ? data.endDate.slice(0, 10) : '',
        modality: data.modality ?? 'VIRTUAL',
        capacity: data.capacity ?? 0,
        schedule: data.schedule ?? '',
        description: data.description ?? '',
        targetAudience: data.targetAudience ?? '',
        status: data.status ?? 'BORRADOR',
        coverImage: data.coverImage ?? '',
      };
      setForm(loaded);
      setProfiles(Array.isArray(profs) ? profs : []);

      // Pre-fill capacities and credentials from CourseProfile
      const caps: Record<string, string> = {};
      const creds: Record<string, boolean> = {};
      if (Array.isArray(access)) {
        access.forEach((cp: any) => {
          if (cp.capacity > 0) caps[cp.profile.name] = String(cp.capacity);
          if (cp.requireCredential) creds[cp.profile.name] = true;
        });
      }
      setCapacities(caps);
      setCredentials(creds);
      onTitleChange?.(loaded.title);
    }).finally(() => setLoading(false));
  }, [courseId]);

  const selectedProfiles = form.targetAudience
    ? form.targetAudience.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const totalCapacity = selectedProfiles.reduce((sum, name) => {
    const c = Number(capacities[name] ?? 0);
    return sum + c;
  }, 0);

  const toggleProfile = async (profile: Profile) => {
    const isSelected = selectedProfiles.includes(profile.name);
    const next = isSelected
      ? selectedProfiles.filter(n => n !== profile.name)
      : [...selectedProfiles, profile.name];
    const newValue = next.join(', ');
    const newTotal = next.reduce((sum, name) => sum + Number(capacities[name] ?? 0), 0);

    setForm(prev => ({ ...prev, targetAudience: newValue, capacity: newTotal }));

    await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, targetAudience: newValue, capacity: newTotal }),
    });

    if (isSelected) {
      await fetch(`/api/courses/${courseId}/access`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id }),
      });
      setCapacities(prev => { const n = { ...prev }; delete n[profile.name]; return n; });
    } else {
      await fetch(`/api/courses/${courseId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, capacity: 0 }),
      });
    }
  };

  const handleCapacityChange = async (profile: Profile, value: string) => {
    setCapacities(prev => ({ ...prev, [profile.name]: value }));
    const newTotal = selectedProfiles.reduce((sum, name) => {
      const c = name === profile.name ? Number(value || 0) : Number(capacities[name] ?? 0);
      return sum + c;
    }, 0);
    setForm(prev => ({ ...prev, capacity: newTotal }));

    await fetch(`/api/courses/${courseId}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: profile.id, capacity: Number(value) || 0 }),
    });
    await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, capacity: newTotal }),
    });
  };

  const handleCredentialChange = async (profile: Profile, checked: boolean) => {
    setCredentials(prev => ({ ...prev, [profile.name]: checked }));
    await fetch(`/api/courses/${courseId}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: profile.id, requireCredential: checked }),
    });
  };

  const set = (field: keyof CourseForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = field === 'capacity' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'title') onTitleChange?.(e.target.value);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) {
      setForm((prev) => ({ ...prev, coverImage: data.url }));
      await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, coverImage: data.url }),
      });
    }
    setUploading(false);
    e.target.value = '';
  };

  const save = async () => {
    setSaving(true);
    await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  const audienceSection = (
    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 28, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Curso dirigido a</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>se guarda automáticamente</span>
        </div>
        {totalCapacity > 0 && (
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Cupo total: <strong>{totalCapacity}</strong>
          </span>
        )}
      </div>
      {profiles.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
          No hay perfiles creados. <a href="/admin/profiles" style={{ color: 'var(--primary)' }}>Creá perfiles globales primero.</a>
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {profiles.map(p => {
            const checked = selectedProfiles.includes(p.name);
            return (
              <div
                key={p.id}
                style={{
                  border: `2px solid ${checked ? '#a29bfe' : '#e2e8f0'}`,
                  borderRadius: 14,
                  background: checked ? '#faf9ff' : '#f8fafc',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {/* Header: toggle */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: checked ? '1px solid #ede9ff' : 'none',
                }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProfile(p)}
                    style={{ accentColor: '#6c5ce7', width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: checked ? '#4c3a8a' : '#475569' }}>
                    {p.name}
                  </span>
                </label>

                {/* Body: settings (only when selected) */}
                {checked && (
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Cupos disponibles
                      </span>
                      <input
                        type="number"
                        min={0}
                        className={styles.input}
                        style={{ fontSize: '0.88rem', padding: '7px 10px' }}
                        placeholder="Sin límite"
                        value={capacities[p.name] ?? ''}
                        onChange={e => handleCapacityChange(p, e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Requisitos
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={credentials[p.name] ?? false}
                          onChange={e => handleCredentialChange(p, e.target.checked)}
                          style={{ accentColor: '#6c5ce7', width: 14, height: 14 }}
                        />
                        <span style={{ fontSize: '0.83rem', color: '#475569', fontWeight: 600 }}>
                          Pedir comprobante de título
                        </span>
                      </label>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className={styles.tabGrid}>
        <div className={styles.formSection}>
        <div className={styles.fieldGroup}>
          <label>Título del Curso</label>
          <input type="text" value={form.title} onChange={set('title')} className={styles.input} />
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label>Fecha de Inicio</label>
            <input type="date" value={form.startDate} onChange={set('startDate')} className={styles.input} />
          </div>
          <div className={styles.fieldGroup}>
            <label>Fecha de Fin</label>
            <input type="date" value={form.endDate} onChange={set('endDate')} className={styles.input} />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label>Modalidad</label>
            <select value={form.modality} onChange={set('modality')} className={styles.input}>
              <option value="VIRTUAL">Virtual</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label>Horarios</label>
          <input type="text" value={form.schedule} onChange={set('schedule')} placeholder="Ej: Sábados de 9:00 a 13:00" className={styles.input} />
        </div>

        <div className={styles.fieldGroup}>
          <label>Descripción Breve</label>
          <textarea rows={3} value={form.description} onChange={set('description')} className={styles.input} />
        </div>

        <button className={styles.saveButton} onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios'}
        </button>
      </div>

      <div className={styles.mediaSection}>
        <div className={styles.fieldGroup}>
          <label>Imagen de Portada</label>
          <div className={styles.imageUpload}>
            <div className={styles.imagePlaceholder} onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
              {form.coverImage ? (
                <img src={form.coverImage} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
              ) : (
                <span>{uploading ? 'Subiendo...' : 'Subir Imagen (1200x600)'}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <button className={styles.secondaryButton} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Cambiar Imagen'}
            </button>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label>Estado del Curso</label>
          <div className={styles.statusToggle}>
            {(['PUBLICADO', 'BORRADOR', 'CERRADO'] as const).map((s) => (
              <button
                key={s}
                className={`${styles.statusBtn} ${form.status === s ? styles.statusActive : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, status: s }))}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>
      {audienceSection}
    </div>
  );
}
