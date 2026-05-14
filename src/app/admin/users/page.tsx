'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Search, User, Trash2, ShieldCheck, BookOpen } from 'lucide-react';
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
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterProfile, setFilterProfile] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

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
                  <tr key={u.id}>
                    <td className={styles.courseCell}>
                      <div className={styles.courseIcon}>
                        <User size={18} />
                      </div>
                      <div>
                        <div className={styles.courseTitle}>{u.name ?? '(sin nombre)'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                        {u.profession && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.profession}</div>
                        )}
                      </div>
                    </td>
                    <td>
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
                    <td>
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
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        {u.role === 'ADMIN' && (
                          <span title="Admin" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                            <ShieldCheck size={16} />
                          </span>
                        )}
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
    </AdminLayout>
  );
}
