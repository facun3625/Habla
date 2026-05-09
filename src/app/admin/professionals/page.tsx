'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Plus, Edit3, User, Search } from 'lucide-react';
import styles from '../courses/courses.module.css'; 
import Link from 'next/link';

type Professional = {
  id: number;
  name: string;
  role: string;
  active: boolean;
};

export default function ProfessionalsAdminPage() {
  const [pros, setPros] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/professionals')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPros(Array.isArray(data) ? data : []))
      .catch(() => setPros([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pros.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Nosotras (Profesionales)</h2>
            <p className={styles.subtitle}>Gestioná las profesionales que dictan los cursos.</p>
          </div>
          <Link href="/admin/professionals/new" className={styles.createButton}>
            <Plus size={20} />
            Nueva Profesional
          </Link>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando profesionales...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              {pros.length === 0 ? 'No hay profesionales creadas aún.' : 'Sin resultados.'}
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th className={styles.actionsHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pro) => (
                  <tr key={pro.id}>
                    <td className={styles.courseCell}>
                      <div className={styles.courseIcon}>
                        <User size={20} />
                      </div>
                      <span className={styles.courseTitle}>{pro.name}</span>
                    </td>
                    <td>{pro.role}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${pro.active ? styles.publicado : styles.borrador}`}>
                        {pro.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <Link href={`/admin/professionals/${pro.id}`} className={styles.actionBtnAdmin}>
                          <Edit3 size={18} />
                          Editar
                        </Link>
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
