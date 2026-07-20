'use client';

import { Fragment, useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Search, User, Trash2, ShieldCheck, BookOpen, ChevronDown, ChevronUp, Eye, Pencil } from 'lucide-react';
import styles from '../courses/courses.module.css';
import ConfirmModal from '../components/ConfirmModal';

type Profile = { id: number; name: string };
type UserRow = {
  id: number;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  phone: string | null;
  profession: string | null;
  createdAt: string;
  profile: Profile | null;
  _count: { enrollments: number };
  questionnaireCompleted: boolean;
  birthDate: string | null;
  dni: string | null;
  city: string | null;
  hasApraxiaExperience: boolean | null;
  apraxiaExperienceDetail: string | null;
  hasOtherTraining: boolean | null;
  otherTrainingDetail: string | null;
  specificMethod: string | null;
};

function calcAge(dateStr: string): number | null {
  const birth = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function UserDetail({ u }: { u: UserRow }) {
  if (!u.questionnaireCompleted) {
    return (
      <tr>
        <td colSpan={6} style={{ background: '#fafafa', padding: '14px 24px', borderBottom: '1px solid #f0eeff' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>El usuario aún no completó el cuestionario.</span>
        </td>
      </tr>
    );
  }

  const age = u.birthDate ? calcAge(u.birthDate) : null;

  const items: { label: string; value: string | null }[] = [
    { label: 'Nombre completo', value: u.name },
    { label: 'DNI', value: u.dni },
    { label: 'Fecha de nacimiento', value: u.birthDate ? new Date(u.birthDate).toLocaleDateString('es-AR') + (age !== null ? ` (${age} años)` : '') : null },
    { label: 'Ciudad', value: u.city },
    { label: 'Experiencia con apraxia', value: u.hasApraxiaExperience === true ? `Sí${u.apraxiaExperienceDetail ? ` — ${u.apraxiaExperienceDetail}` : ''}` : u.hasApraxiaExperience === false ? 'No' : null },
    { label: 'Otras formaciones', value: u.hasOtherTraining === true ? `Sí${u.otherTrainingDetail ? ` — ${u.otherTrainingDetail}` : ''}` : u.hasOtherTraining === false ? 'No' : null },
    { label: 'Método específico', value: u.specificMethod ? u.specificMethod : u.specificMethod === null && u.questionnaireCompleted ? 'No' : null },
  ];

  return (
    <tr>
      <td colSpan={6} style={{ background: '#faf9ff', padding: '16px 24px', borderBottom: '1px solid #ede9fe' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px 24px' }}>
          {items.map(({ label, value }) => value !== null && (
            <div key={label}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterProfile, setFilterProfile] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [editModal, setEditModal] = useState<{ id: number; name: string; email: string } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/profiles').then((r) => r.json()),
    ]).then(([u, p]) => {
      setUsers(Array.isArray(u) ? u : []);
      setProfiles(Array.isArray(p) ? p : []);
    }).finally(() => setLoading(false));
  }, []);

  const updateRole = async (id: number, role: string) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: role as UserRow['role'] } : u));
    }
  };

  const updateProfile = async (id: number, profileId: string) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: profileId === '' ? null : Number(profileId) }),
    });
    if (res.ok) {
      const data = await res.json();
      const newProfile = profiles.find((p) => p.id === data.profileId) ?? null;
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, profile: newProfile, profileId: data.profileId } : u));
    }
  };

  const impersonate = async (id: number) => {
    const res = await fetch(`/api/users/${id}/impersonate`, { method: 'POST' });
    if (res.ok) {
      window.location.href = '/mi-cuenta';
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'No se pudo ingresar como este usuario.');
    }
  };

  const saveEdit = async () => {
    if (!editModal) return;
    setEditSaving(true);
    setEditError('');
    const res = await fetch(`/api/users/${editModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editModal.name.trim(), email: editModal.email.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setEditSaving(false);
    if (!res.ok) {
      setEditError(data.error || 'Error al guardar los cambios.');
      return;
    }
    setUsers((prev) => prev.map((u) => u.id === editModal.id ? { ...u, name: data.name, email: data.email } : u));
    setEditModal(null);
  };

  const deleteUser = (id: number, email: string) => {
    setConfirmModal({
      message: `¿Eliminar el usuario "${email}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
      },
    });
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    const matchProfile = !filterProfile || String(u.profile?.id ?? '') === filterProfile;
    return matchSearch && matchRole && matchProfile;
  });

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Usuarios</h2>
            <p className={styles.subtitle}>Todos los usuarios registrados en la plataforma.</p>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
            {users.length} usuario{users.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontFamily: 'inherit', background: '#f8fafc', cursor: 'pointer' }}
          >
            <option value="">Todos los roles</option>
            <option value="STUDENT">Estudiantes</option>
            <option value="ADMIN">Admins</option>
          </select>
          {profiles.length > 0 && (
            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontFamily: 'inherit', background: '#f8fafc', cursor: 'pointer' }}
            >
              <option value="">Todos los perfiles</option>
              <option value="">Sin perfil</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando usuarios...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              {users.length === 0 ? 'No hay usuarios aún.' : 'Sin resultados.'}
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Perfil</th>
                  <th>Rol</th>
                  <th>Inscripciones</th>
                  <th>Registro</th>
                  <th className={styles.actionsHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <Fragment key={u.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === u.id ? null : u.id)}>
                      <td className={styles.courseCell}>
                        <div className={styles.courseIcon}>
                          <User size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={styles.courseTitle}>{u.name ?? '(sin nombre)'}</span>
                            {u.questionnaireCompleted && (
                              <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#15803d', borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>ficha completa</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                          {u.profession && (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.profession}</div>
                          )}
                        </div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={u.profile?.id ?? ''}
                          onChange={(e) => updateProfile(u.id, e.target.value)}
                          style={{ padding: '5px 8px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.83rem', fontFamily: 'inherit', background: '#f8fafc', cursor: 'pointer', maxWidth: 140 }}
                        >
                          <option value="">Sin perfil</option>
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          style={{ padding: '5px 8px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.83rem', fontFamily: 'inherit', background: u.role === 'ADMIN' ? '#f5f3ff' : '#f8fafc', color: u.role === 'ADMIN' ? 'var(--primary)' : '#2c3e50', fontWeight: u.role === 'ADMIN' ? 700 : 400, cursor: 'pointer' }}
                        >
                          <option value="STUDENT">Estudiante</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: '0.9rem' }}>
                          <BookOpen size={14} />
                          {u._count.enrollments}
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {new Date(u.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td className={styles.actionsCell} onClick={e => e.stopPropagation()}>
                        <div className={styles.actionButtons}>
                          {u.role === 'ADMIN' && (
                            <span title="Admin" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                              <ShieldCheck size={16} />
                            </span>
                          )}
                          <button
                            onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                            title="Ver ficha"
                          >
                            {expanded === u.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                          <button
                            onClick={() => { setEditModal({ id: u.id, name: u.name ?? '', email: u.email }); setEditError(''); }}
                            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                            title="Editar nombre / email"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => impersonate(u.id)}
                            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#6c5ce7', display: 'flex', alignItems: 'center' }}
                            title="Ingresar como este usuario"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => deleteUser(u.id, u.email)}
                            className={styles.actionBtnAdmin}
                            style={{ color: '#ff4d4f', border: '1px solid #ff4d4f' }}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded === u.id && <UserDetail u={u} />}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {editModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,40,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setEditModal(null)}
        >
          <div
            style={{ background: 'white', borderRadius: 18, padding: '32px 32px 28px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: '0 0 20px' }}>Editar usuario</h3>

            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Nombre</label>
            <input
              type="text"
              value={editModal.name}
              onChange={(e) => setEditModal((m) => m && { ...m, name: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: 14, fontFamily: 'inherit' }}
            />

            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Email</label>
            <input
              type="email"
              value={editModal.email}
              onChange={(e) => setEditModal((m) => m && { ...m, email: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit' }}
            />

            {editError && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>{editError}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditModal(null)}
                style={{ padding: '10px 22px', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', background: 'white', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                style={{ padding: '10px 22px', border: 'none', borderRadius: 10, cursor: editSaving ? 'default' : 'pointer', background: '#6c5ce7', color: 'white', fontWeight: 700, fontSize: '0.9rem', opacity: editSaving ? 0.7 : 1 }}
              >
                {editSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
