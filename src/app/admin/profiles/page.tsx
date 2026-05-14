'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Plus, Edit2, Trash2, Check, X, Users } from 'lucide-react';
import styles from './profiles.module.css';
import ConfirmModal from '../components/ConfirmModal';

type Profile = { id: number; name: string; description: string | null; createdAt: string };

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    fetch('/api/profiles')
      .then((r) => r.json())
      .then(setProfiles)
      .finally(() => setLoading(false));
  }, []);

  const startAdd = () => { setForm({ name: '', description: '' }); setAdding(true); setEditingId(null); };
  const startEdit = (p: Profile) => { setForm({ name: p.name, description: p.description ?? '' }); setEditingId(p.id); setAdding(false); };
  const cancel = () => { setAdding(false); setEditingId(null); };

  const save = async () => {
    if (!form.name.trim()) return;
    if (adding) {
      const res = await fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { const p = await res.json(); setProfiles((prev) => [...prev, p]); }
      else { const e = await res.json(); alert(e.error); }
    } else if (editingId) {
      const res = await fetch(`/api/profiles/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { const p = await res.json(); setProfiles((prev) => prev.map((x) => x.id === p.id ? p : x)); }
    }
    cancel();
  };

  const deleteProfile = (id: number, name: string) => {
    setConfirmModal({
      message: `¿Eliminar el perfil "${name}"?`,
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
        if (res.ok) setProfiles((prev) => prev.filter((p) => p.id !== id));
      },
    });
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Perfiles de Usuario</h2>
            <p className={styles.subtitle}>Definí los tipos de alumno que pueden inscribirse a los cursos.</p>
          </div>
          <button className={styles.createButton} onClick={startAdd}>
            <Plus size={20} /> Nuevo Perfil
          </button>
        </div>

        {adding && (
          <div className={styles.formCard}>
            <h3>Nuevo perfil</h3>
            <input
              autoFocus
              className={styles.input}
              placeholder="Nombre (ej: Fonoaudiólogo)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
            <input
              className={styles.input}
              placeholder="Descripción (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={save}><Check size={16} /> Guardar</button>
              <button className={styles.cancelBtn} onClick={cancel}><X size={16} /> Cancelar</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className={styles.empty}>Cargando...</p>
        ) : profiles.length === 0 && !adding ? (
          <div className={styles.emptyState}>
            <Users size={40} />
            <p>No hay perfiles creados aún.</p>
            <button className={styles.createButton} onClick={startAdd}><Plus size={18} /> Crear primer perfil</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {profiles.map((p) => (
              <div key={p.id} className={`${styles.card} ${editingId === p.id ? styles.cardEditing : ''}`}>
                {editingId === p.id ? (
                  <>
                    <input
                      autoFocus
                      className={styles.input}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                      className={styles.input}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Descripción"
                    />
                    <div className={styles.formActions}>
                      <button className={styles.saveBtn} onClick={save}><Check size={16} /> Guardar</button>
                      <button className={styles.cancelBtn} onClick={cancel}><X size={16} /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.cardIcon}><Users size={24} /></div>
                    <div className={styles.cardInfo}>
                      <h3>{p.name}</h3>
                      {p.description && <p>{p.description}</p>}
                    </div>
                    <div className={styles.cardActions}>
                      <button className={styles.actionBtn} onClick={() => startEdit(p)} title="Editar"><Edit2 size={16} /></button>
                      <button className={styles.actionBtnDelete} onClick={() => deleteProfile(p.id, p.name)} title="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </AdminLayout>
  );
}
