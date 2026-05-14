'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Mail, Search, Trash2 } from 'lucide-react';
import styles from '../courses/courses.module.css';
import ConfirmModal from '../components/ConfirmModal';

type Subscriber = {
  id: number;
  email: string;
  createdAt: string;
  active: boolean;
};

export default function SubscribersAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const fetchSubscribers = () => {
    setLoading(true);
    fetch('/api/subscribers')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSubscribers(Array.isArray(data) ? data : []))
      .catch(() => setSubscribers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDelete = (id: number) => {
    setConfirmModal({
      message: '¿Estás seguro de eliminar este suscriptor?',
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch(`/api/subscribers/${id}`, { method: 'DELETE' });
        if (res.ok) setSubscribers(prev => prev.filter(s => s.id !== id));
      },
    });
  };

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Suscriptores</h2>
            <p className={styles.subtitle}>Personas registradas para recibir novedades.</p>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando suscriptores...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              {subscribers.length === 0 ? 'No hay suscriptores aún.' : 'Sin resultados.'}
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Fecha Registro</th>
                  <th>Estado</th>
                  <th className={styles.actionsHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className={styles.courseCell}>
                      <div className={styles.courseIcon}>
                        <Mail size={20} />
                      </div>
                      <span className={styles.courseTitle}>{s.email}</span>
                    </td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${s.active ? styles.publicado : styles.borrador}`}>
                        {s.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <button 
                          onClick={() => handleDelete(s.id)} 
                          className={styles.actionBtnAdmin}
                          style={{ color: '#ff4d4f', border: '1px solid #ff4d4f' }}
                        >
                          <Trash2 size={18} />
                          Eliminar
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
