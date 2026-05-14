'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Plus, Edit3, Calendar, Search, FileText, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import styles from '../courses/courses.module.css';
import Link from 'next/link';

type Post = {
  id: number;
  title: string;
  published: boolean;
  createdAt: string;
  order: number;
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: number) => {
    setConfirmModal({
      message: '¿Estás seguro de eliminar esta noticia?',
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
        if (res.ok) setPosts(prev => prev.filter(p => p.id !== id));
      },
    });
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= posts.length) return;
    const next = [...posts];
    [next[index], next[target]] = [next[target], next[index]];
    const withOrder = next.map((p, i) => ({ ...p, order: i }));
    setPosts(withOrder);
    await fetch('/api/posts/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withOrder.map(p => ({ id: p.id, order: p.order }))),
    });
  };

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const isSearching = search.trim().length > 0;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Blog y Noticias</h2>
            <p className={styles.subtitle}>Gestioná las entradas de tu blog.</p>
          </div>
          <Link href="/admin/blog/new" className={styles.createButton}>
            <Plus size={20} />
            Nueva Entrada
          </Link>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar noticia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando entradas...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              {posts.length === 0 ? 'No hay noticias creadas aún.' : 'Sin resultados.'}
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  {!isSearching && <th style={{ width: 80 }}>Orden</th>}
                  <th>Noticia</th>
                  <th>Fecha de Creación</th>
                  <th>Estado</th>
                  <th className={styles.actionsHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post, idx) => (
                  <tr key={post.id}>
                    {!isSearching && (
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <button
                            onClick={() => move(idx, -1)}
                            disabled={idx === 0}
                            style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#ccc' : '#7c6fe0', padding: '2px' }}
                          >
                            <ChevronUp size={18} />
                          </button>
                          <button
                            onClick={() => move(idx, 1)}
                            disabled={idx === filtered.length - 1}
                            style={{ background: 'none', border: 'none', cursor: idx === filtered.length - 1 ? 'default' : 'pointer', color: idx === filtered.length - 1 ? '#ccc' : '#7c6fe0', padding: '2px' }}
                          >
                            <ChevronDown size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                    <td className={styles.courseCell}>
                      <div className={styles.courseIcon}>
                        <FileText size={20} />
                      </div>
                      <span className={styles.courseTitle}>{post.title}</span>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <Calendar size={14} />
                        {new Date(post.createdAt).toLocaleDateString('es-AR')}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${post.published ? styles.publicado : styles.borrador}`}>
                        {post.published ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <Link href={`/admin/blog/${post.id}`} className={styles.actionBtnAdmin}>
                          <Edit3 size={18} />
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
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
