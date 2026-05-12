'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
  Plus,
  Eye,
  Edit3,
  Settings2,
  Calendar,
  Users as UsersIcon,
  Filter,
  Search,
  Trash2
} from 'lucide-react';
import styles from './courses.module.css';
import Link from 'next/link';

type Course = {
  id: number;
  title: string;
  coverImage: string | null;
  startDate: string | null;
  modality: string;
  capacity: number;
  status: string;
  _count: { enrollments: number };
};

const STATUS_LABEL: Record<string, string> = {
  PUBLICADO: 'Publicado',
  BORRADOR: 'Borrador',
  CERRADO: 'Cerrado',
};

const MODALITY_LABEL: Record<string, string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const deleteCourse = async (id: number, title: string) => {
    if (!confirm(`¿Eliminar el curso "${title}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    if (res.ok) setCourses((prev) => prev.filter((c) => c.id !== id));
    else alert('Error al eliminar el curso.');
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Cursos</h2>
            <p className={styles.subtitle}>Gestioná tu oferta académica y el contenido de cada curso.</p>
          </div>
          <Link href="/admin/courses/new" className={styles.createButton}>
            <Plus size={20} />
            Crear Nuevo Curso
          </Link>
        </div>

        {/* Filters bar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.filterButton}>
            <Filter size={18} />
            Filtrar
          </button>
        </div>

        {/* Courses Table */}
        <div className={styles.tableCard}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando cursos...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
              {courses.length === 0 ? 'No hay cursos creados aún.' : 'Sin resultados.'}
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Inicio</th>
                  <th>Modalidad</th>
                  <th>Cupo</th>
                  <th>Inscriptos</th>
                  <th>Estado</th>
                  <th className={styles.actionsHeader}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) => (
                  <tr key={course.id}>
                    <td className={styles.courseCell}>
                      <div className={styles.courseIcon}>
                        <BookOpen size={20} />
                      </div>
                      <span className={styles.courseTitle}>{course.title}</span>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <Calendar size={14} />
                        {course.startDate
                          ? new Date(course.startDate.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('es-AR')
                          : '—'}
                      </div>
                    </td>
                    <td>
                      <span className={styles.badge}>
                        {MODALITY_LABEL[course.modality] ?? course.modality}
                      </span>
                    </td>
                    <td>{course.capacity}</td>
                    <td>
                      <div className={styles.enrollmentCell}>
                        <UsersIcon size={14} />
                        <span>{course._count.enrollments} / {course.capacity}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[course.status.toLowerCase()]}`}>
                        {STATUS_LABEL[course.status] ?? course.status}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <Link title="Ver curso público" href={`/cursos/${course.id}`} target="_blank" className={styles.actionBtn}><Eye size={18} /></Link>
                        <Link title="Editar curso" href={`/admin/courses/${course.id}`} className={styles.actionBtn}><Edit3 size={18} /></Link>
                        <Link
                          title="Administrar curso"
                          href={`/admin/courses/${course.id}`}
                          className={styles.actionBtnAdmin}
                        >
                          <Settings2 size={18} />
                          Administrar
                        </Link>
                        <button
                          title="Eliminar curso"
                          className={styles.actionBtnDelete}
                          onClick={() => deleteCourse(course.id, course.title)}
                        >
                          <Trash2 size={18} />
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

function BookOpen({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h9z" />
    </svg>
  );
}
