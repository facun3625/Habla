'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Edit2, Check, X } from 'lucide-react';
import styles from '../courseAdmin.module.css';
import ConfirmModal from '../../components/ConfirmModal';

type Profile = { id: number; name: string; description: string | null };
type CourseProfile = { id: number; profileId: number; capacity: number; profile: Profile };

export default function Access({ courseId }: { courseId: string }) {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [courseProfiles, setCourseProfiles] = useState<CourseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ profileId: '', capacity: '' });
  const [editCapacity, setEditCapacity] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/profiles').then((r) => r.json()),
      fetch(`/api/courses/${courseId}/access`).then((r) => r.json()),
    ]).then(([profiles, access]) => {
      setAllProfiles(profiles);
      setCourseProfiles(access);
    }).finally(() => setLoading(false));
  }, [courseId]);

  const availableProfiles = allProfiles.filter(
    (p) => !courseProfiles.some((cp) => cp.profileId === p.id)
  );

  const addAccess = async () => {
    if (!form.profileId) return;
    const res = await fetch(`/api/courses/${courseId}/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: Number(form.profileId), capacity: Number(form.capacity) || 0 }),
    });
    if (res.ok) {
      const cp = await res.json();
      setCourseProfiles((prev) => [...prev, cp]);
      setForm({ profileId: '', capacity: '' });
      setAdding(false);
    }
  };

  const updateCapacity = async (profileId: number) => {
    const res = await fetch(`/api/courses/${courseId}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, capacity: Number(editCapacity) || 0 }),
    });
    if (res.ok) {
      const cp = await res.json();
      setCourseProfiles((prev) => prev.map((x) => x.profileId === profileId ? cp : x));
      setEditingId(null);
    }
  };

  const removeAccess = (profileId: number, name: string) => {
    setConfirmModal({
      message: `¿Quitar el perfil "${name}" de este curso?`,
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch(`/api/courses/${courseId}/access`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId }),
        });
        if (res.ok) setCourseProfiles((prev) => prev.filter((cp) => cp.profileId !== profileId));
      },
    });
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.segmentsTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Acceso por Perfil</h3>
          <p className={styles.sectionDesc}>
            Definí qué perfiles pueden inscribirse y el cupo disponible para cada uno.
          </p>
        </div>
        {availableProfiles.length > 0 && (
          <button className={styles.addBtnSmall} onClick={() => setAdding(true)}>
            <Plus size={18} /> Agregar Perfil
          </button>
        )}
      </div>

      {allProfiles.length === 0 && (
        <div className={styles.emptyState}>
          <Users size={32} />
          <p>No hay perfiles creados. <a href="/admin/profiles">Creá perfiles globales primero.</a></p>
        </div>
      )}

      <div className={styles.listContainer}>
        {courseProfiles.map((cp) => (
          <div key={cp.id} className={styles.listItem}>
            <div className={styles.itemMain}>
              <div className={styles.segmentIcon}><Users size={20} /></div>
              <div className={styles.itemInfo}>
                <h4>{cp.profile.name}</h4>
                {editingId === cp.profileId ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <input
                      autoFocus
                      type="number"
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(e.target.value)}
                      className={styles.input}
                      style={{ width: 100 }}
                      placeholder="Cupo"
                    />
                    <button className={styles.iconBtnSuccess} onClick={() => updateCapacity(cp.profileId)}><Check size={14} /></button>
                    <button className={styles.actionBtn} onClick={() => setEditingId(null)}><X size={14} /></button>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                    Cupo: <strong>{cp.capacity === 0 ? 'Ilimitado' : cp.capacity}</strong>
                  </p>
                )}
              </div>
            </div>
            {editingId !== cp.profileId && (
              <div className={styles.itemActions}>
                <button
                  className={styles.actionBtn}
                  title="Editar cupo"
                  onClick={() => { setEditingId(cp.profileId); setEditCapacity(String(cp.capacity)); }}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  className={styles.actionBtnDelete}
                  title="Quitar perfil"
                  onClick={() => removeAccess(cp.profileId, cp.profile.name)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        ))}

        {adding && availableProfiles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
            <select
              autoFocus
              className={styles.input}
              style={{ flex: 1, minWidth: 160 }}
              value={form.profileId}
              onChange={(e) => setForm({ ...form, profileId: e.target.value })}
            >
              <option value="">Seleccionar perfil…</option>
              {availableProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="number"
              className={styles.input}
              style={{ width: 90, flexShrink: 0 }}
              placeholder="Cupo"
              title="Cupo (0 = ilimitado)"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
            <button className={styles.addBtnSmall} style={{ flexShrink: 0 }} onClick={addAccess}>Agregar</button>
            <button onClick={() => setAdding(false)} style={{ flexShrink: 0, background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', padding: '8px 4px', fontSize: '0.85rem' }}>Cancelar</button>
          </div>
        )}

        {!adding && availableProfiles.length > 0 && (
          <button className={styles.addBtn} onClick={() => setAdding(true)}>
            <Plus size={20} /> Agregar perfil al curso
          </button>
        )}
      </div>
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          confirmLabel="Quitar"
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
