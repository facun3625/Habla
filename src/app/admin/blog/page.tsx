'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Plus, Edit3, Calendar, Search, FileText, Trash2 } from 'lucide-react';
import styles from '../courses/courses.module.css'; // Reusing courses styles
import Link from 'next/link';

type Post = {
  id: number;
  title: string;
  published: boolean;
  createdAt: string;
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta noticia?')) return;
    
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Error al eliminar');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

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
              {posts.length === 0 ? 'No hay noticias creadadas aún.' : 'Sin resultados.'}
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Noticia</th>
                  <th>Fecha de Creación</th>
                  <th>Estado</th>
                  <th className={styles.actionsHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id}>
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
    </AdminLayout>
  );
}
