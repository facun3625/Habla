'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { BookOpen, Lock, Calendar, ArrowLeft, FolderOpen, FileText, Download, ExternalLink } from 'lucide-react';
import styles from '../../account.module.css';

type Profile = { id: number; name: string };
type ModuleAccess = { profile: Profile };
type Module = {
  id: number; name: string; order: number; date: string | null;
  accessAll: boolean; accessProfiles: ModuleAccess[];
};
type Resource = {
  id: number;
  type: 'SECTION' | 'FILE';
  title: string;
  fileUrl: string | null;
  visible: boolean;
  order: number;
};
type Group = { section: Resource | null; files: Resource[] };

type Course = {
  id: number; title: string; coverImage: string | null;
  startDate: string | null; endDate: string | null; schedule: string | null; modality: string;
  modules: Module[];
  resources: Resource[];
};

function groupResources(resources: Resource[]): Group[] {
  const groups: Group[] = [];
  let current: Group = { section: null, files: [] };
  for (const r of resources) {
    if (r.type === 'SECTION') {
      if (current.section !== null || current.files.length > 0) groups.push(current);
      current = { section: r, files: [] };
    } else {
      current.files.push(r);
    }
  }
  groups.push(current);
  return groups.filter(g => g.section !== null || g.files.length > 0);
}

export default function CourseModulesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${id}/public`).then((r) => r.ok ? r.json() : null),
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
    ]).then(([courseData, user]) => {
      if (!courseData) { setNotFound(true); }
      else { setCourse(courseData); }
      if (user?.profileId) setProfileId(user.profileId);
    }).finally(() => setLoading(false));
  }, [id]);

  const canAccess = (mod: Module) => {
    if (mod.accessAll) return true;
    if (!profileId) return false;
    return mod.accessProfiles.some((a) => a.profile.id === profileId);
  };

  if (loading) return <p style={{ color: '#94a3b8', padding: '40px 0' }}>Cargando…</p>;
  if (notFound || !course) return (
    <div className={styles.empty}>
      <p>Curso no encontrado.</p>
      <Link href="/mi-cuenta/cursos" style={{ color: '#6c5ce7', fontWeight: 700, textDecoration: 'none' }}>← Volver</Link>
    </div>
  );

  const accessibleCount = course.modules.filter(canAccess).length;

  return (
    <>
      <Link href="/mi-cuenta/cursos" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6c5ce7', fontWeight: 700, textDecoration: 'none', fontSize: '0.88rem', marginBottom: 24 }}>
        <ArrowLeft size={15} /> Mis cursos
      </Link>

      {/* Course header */}
      <div className={styles.courseHeader}>
        <div className={styles.courseHeaderImg} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
          {course.coverImage
            ? <img src={course.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <BookOpen size={36} />}
        </div>
        <div className={styles.courseHeaderInfo}>
          <h1 className={styles.courseHeaderTitle}>{course.title}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.85rem', color: '#64748b', marginTop: 8 }}>
            {course.startDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> {new Date(course.startDate).toLocaleDateString('es-AR')}
                {course.endDate && ` → ${new Date(course.endDate).toLocaleDateString('es-AR')}`}
              </span>
            )}
            {course.schedule && <span>🕐 {course.schedule}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <BookOpen size={14} /> {accessibleCount} de {course.modules.length} módulos disponibles
            </span>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className={styles.card}>
        <h2 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>
          Módulos del curso
        </h2>

        {course.modules.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>Este curso todavía no tiene módulos cargados.</p>
        ) : (
          <div className={styles.moduleList}>
            {course.modules.map((mod, i) => {
              const accessible = canAccess(mod);
              return (
                <div key={mod.id} className={`${styles.moduleItem} ${!accessible ? styles.moduleItemLocked : ''}`}>
                  <div className={`${styles.moduleNum} ${accessible ? styles.moduleNumActive : ''}`}>
                    {accessible ? i + 1 : <Lock size={13} />}
                  </div>
                  <span className={styles.moduleName}>{mod.name}</span>
                  {mod.date && <span className={styles.moduleDate}>📅 {mod.date}</span>}
                  {!accessible && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Sin acceso</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Repository */}
      {course.resources && course.resources.length > 0 && (
        <div className={styles.repoSection}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>
            Repositorio de materiales
          </h2>
          
          <div className={styles.repoGroups}>
            {groupResources(course.resources).map((group) => (
              <div key={group.section?.id ?? 'none'} className={styles.repoGroup}>
                {group.section && (
                  <div className={styles.repoSectionHeader}>
                    <FolderOpen size={16} />
                    <span>{group.section.title}</span>
                  </div>
                )}
                <div className={styles.repoFileList}>
                  {group.files.map((file) => (
                    <a 
                      key={file.id} 
                      href={file.fileUrl || '#'} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={styles.repoFileItem}
                    >
                      <div className={styles.repoFileInfo}>
                        <FileText size={18} color="#6c5ce7" />
                        <span className={styles.repoFileTitle}>{file.title}</span>
                      </div>
                      <span className={styles.repoFileLink}>
                        <ExternalLink size={14} /> Ver
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
