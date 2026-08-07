'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { BookOpen, Calendar, ArrowLeft, Layers, Video, FolderOpen, PlayCircle, Award } from 'lucide-react';
import styles from '../../account.module.css';
import { canAccess, type Module } from './courseAccess';
import ModulesTab from './tabs/ModulesTab';
import ContentTab from './tabs/ContentTab';
import ConnectionTab from './tabs/ConnectionTab';
import VideosTab from './tabs/VideosTab';
import CertificateTab from './tabs/CertificateTab';

type Resource = {
  id: number;
  type: 'SECTION' | 'FILE';
  title: string;
  fileUrl: string | null;
  visible: boolean;
  order: number;
};

type Course = {
  id: number; title: string; coverImage: string | null;
  startDate: string | null; endDate: string | null; schedule: string | null; modality: string;
  modules: Module[];
  resources: Resource[];
};

type TabType = 'modules' | 'connection' | 'content' | 'videos' | 'certificate';

export default function CourseModulesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'modules');

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${id}/public`).then((r) => r.ok ? r.json() : null),
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
      fetch('/api/enrollments').then((r) => r.ok ? r.json() : []),
    ]).then(([courseData, user, enrollments]) => {
      if (!courseData) { setNotFound(true); }
      else { setCourse(courseData); }
      // El acceso a los módulos se define por el perfil con el que se inscribió a ESTE curso,
      // no por el perfil global del usuario (que suele quedar vacío en el registro).
      const enrollment = Array.isArray(enrollments)
        ? enrollments.find((e: { course: { id: number }; profile: { id: number } | null }) => e.course?.id === Number(id))
        : null;
      setProfileId(enrollment?.profile?.id ?? user?.profileId ?? null);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', tab);
    router.push(`/mi-cuenta/cursos/${id}?${newParams.toString()}`);
  };

  if (loading) return <p style={{ color: '#94a3b8', padding: '40px 0' }}>Cargando…</p>;
  if (notFound || !course) return (
    <div className={styles.empty}>
      <p>Curso no encontrado.</p>
      <Link href="/mi-cuenta/cursos" style={{ color: '#6c5ce7', fontWeight: 700, textDecoration: 'none' }}>← Volver</Link>
    </div>
  );

  const accessibleCount = course.modules.filter((m) => canAccess(m, profileId)).length;

  const tabs: { id: TabType; label: string; icon: typeof Layers }[] = [
    { id: 'modules', label: 'Módulos', icon: Layers },
    { id: 'connection', label: 'Links de conexión', icon: Video },
    { id: 'content', label: 'Material de Estudio', icon: FolderOpen },
    { id: 'videos', label: 'Videos de módulos dictados', icon: PlayCircle },
    { id: 'certificate', label: 'Certificado', icon: Award },
  ];

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

      <div className={styles.courseTabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.courseTab} ${activeTab === tab.id ? styles.courseTabActive : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'modules' && <ModulesTab modules={course.modules} profileId={profileId} />}
      {activeTab === 'connection' && <ConnectionTab courseId={id} profileId={profileId} />}
      {activeTab === 'content' && <ContentTab resources={course.resources} />}
      {activeTab === 'videos' && <VideosTab courseId={id} />}
      {activeTab === 'certificate' && <CertificateTab courseId={id} />}
    </>
  );
}
