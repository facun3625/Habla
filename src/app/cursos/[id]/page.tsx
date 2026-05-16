'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import EnrollModal from './EnrollModal';
import { Calendar, Clock, Users, Globe, Lock, CheckCircle, ChevronDown, FolderOpen, FileText, Download } from 'lucide-react';
import styles from './course.module.css';

type Profile = { id: number; name: string };
type Price = { id: number; name: string; amount: number; currency: string; profile: Profile | null };
type ModuleAccess = { profileId: number; profile: Profile };
type Module = { id: number; name: string; order: number; date: string | null; accessAll: boolean; accessProfiles: ModuleAccess[]; topics: string[] };
type CourseProfile = { profileId: number; capacity: number; requireCredential: boolean; profile: Profile };
type Course = {
  id: number;
  title: string;
  description: string | null;
  coverImage: string | null;
  startDate: string | null;
  endDate: string | null;
  modality: string;
  schedule: string | null;
  targetAudience: string | null;
  status: string;
  objectives: string | null;
  modules: Module[];
  prices: Price[];
  courseProfiles: CourseProfile[];
};

const MODALITY: Record<string, string> = { VIRTUAL: 'Virtual', PRESENCIAL: 'Presencial', HIBRIDO: 'Híbrido' };

function cleanHtml(html: string): string {
  return html
    .replace(/\u200B/g, '').replace(/&#8203;/g, '').replace(/&ZeroWidthSpace;/g, '')
    .replace(/\u00AD/g, '').replace(/&#173;/g, '').replace(/&shy;/g, '')
    .replace(/\uFEFF/g, '').replace(/&#65279;/g, '')
    .replace(/\u200C/g, '').replace(/&#8204;/g, '')
    .replace(/\u200D/g, '').replace(/&#8205;/g, '')
    .replace(/<wbr\s*\/?>/gi, '')
    .replace(/<span[^>]*class="ql-cursor"[^>]*>.*?<\/span>/gi, '');
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [session, setSession] = useState<{ userId?: number; profileId?: number | null; name?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());
  const [resources, setResources] = useState<{ id: number; type: string; title: string; fileUrl: string | null }[] | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([
      fetch(`/api/courses/${id}/public`).then((r) => r.ok ? r.json() : null),
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
    ]).then(([c, s]) => {
      setCourse(c);
      setSession(s);
      if (searchParams.get('enroll') === '1' && s) setShowEnroll(true);
      if (s) {
        fetch(`/api/courses/${id}/resources/student`)
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) setResources(data); });
      }
    }).finally(() => setLoading(false));
  }, [id, searchParams]);

  const toggleModule = (mid: number) =>
    setOpenModules(prev => { const n = new Set(prev); n.has(mid) ? n.delete(mid) : n.add(mid); return n; });

  const handleInscribirse = () => setShowEnroll(true);

  if (loading) return (
    <><SiteHeader />
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Cargando...</div>
    <SiteFooter /></>
  );

  if (!course) return (
    <><SiteHeader />
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Curso no encontrado.</div>
    <SiteFooter /></>
  );

  const userProfileId = session?.profileId ?? null;

  const pricesByProfile = course.prices
    .filter(p => p.profile)
    .reduce<Record<number, { profile: Profile; ARS: Price | null; USD: Price | null }>>((acc, p) => {
      const pid = p.profile!.id;
      if (!acc[pid]) acc[pid] = { profile: p.profile!, ARS: null, USD: null };
      if (p.currency === 'ARS') acc[pid].ARS = p;
      else if (p.currency === 'USD') acc[pid].USD = p;
      return acc;
    }, {});
  const profileGroups = Object.values(pricesByProfile);

  const myPriceARS = course.prices.find(p => p.profile?.id === userProfileId && p.currency === 'ARS') ?? null;
  const myPriceUSD = course.prices.find(p => p.profile?.id === userProfileId && p.currency === 'USD') ?? null;
  const myPriceLabel = [
    myPriceARS ? `${myPriceARS.amount.toLocaleString('es-AR')} ARS` : null,
    myPriceUSD ? `${myPriceUSD.amount.toLocaleString('es-AR')} USD` : null,
  ].filter(Boolean).join(' / ');

  const requireCredential = userProfileId
    ? (course.courseProfiles.find(cp => cp.profileId === userProfileId)?.requireCredential ?? false)
    : false;

  const profileNamesFromPrices = [...new Set(course.prices.filter(p => p.profile).map(p => p.profile!.name))];

  const modulesForProfile = (profileId: number) =>
    course.modules.filter(m => m.accessAll || m.accessProfiles.some(a => a.profileId === profileId));

  return (
    <>
      <SiteHeader />
      <main className={styles.main}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroLeft}>
              <span className={styles.heroTag}>{MODALITY[course.modality] ?? course.modality}</span>
              <h1 className={styles.heroTitle}>{course.title}</h1>
              {course.description && <p className={styles.heroDesc}>{course.description}</p>}
              <div className={styles.heroMeta}>
                {course.startDate && (
                  <span><Calendar size={15} /> {new Date(course.startDate.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                )}
                {course.schedule && <span><Clock size={15} /> {course.schedule}</span>}
                {profileNamesFromPrices.length > 0 && (
                  <span><Users size={15} /> {profileNamesFromPrices.join(', ')}</span>
                )}
              </div>
            </div>
            <div className={styles.heroRight}>
              {enrolled ? (
                <div className={styles.enrolledBadge}><CheckCircle size={22} /> ¡Inscripta!</div>
              ) : course.status === 'PUBLICADO' ? (
                <>
                  {myPriceLabel && userProfileId && (
                    <div className={styles.heroPrice}>{myPriceLabel}</div>
                  )}
                  <button className={styles.enrollBtn} onClick={handleInscribirse}>
                    Inscribirme
                  </button>
                </>
              ) : (
                <button className={styles.enrollBtn} disabled>
                  {course.status === 'CERRADO' ? 'Inscripciones cerradas' : 'Próximamente'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.body}>

          {/* Planes y precios */}
          {profileGroups.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Planes y precios</h2>
              <div className={styles.plansGrid}>
                {profileGroups.map(({ profile, ARS, USD }) => {
                  const cp = course.courseProfiles.find(c => c.profileId === profile.id);
                  const mods = modulesForProfile(profile.id);
                  const isMe = userProfileId === profile.id;
                  return (
                    <div key={profile.id} className={`${styles.planCard} ${isMe ? styles.planCardMe : ''}`}>
                      <div className={styles.planHeader}>
                        <span className={styles.planName}>{profile.name}</span>
                        {cp && cp.capacity > 0 && <span className={styles.planCupos}>{cp.capacity} cupos</span>}
                      </div>
                      <div className={styles.planModules}>
                        <p className={styles.planModulesLabel}>
                          {mods.length === course.modules.length
                            ? `Acceso completo — ${mods.length} módulo${mods.length !== 1 ? 's' : ''}`
                            : `${mods.length} de ${course.modules.length} módulo${course.modules.length !== 1 ? 's' : ''}`
                          }
                        </p>
                        <ul className={styles.planModuleList}>
                          {mods.map(m => (
                            <li key={m.id}>
                              <CheckCircle size={13} />
                              <span>{m.name}{m.date ? <em> · {m.date}</em> : ''}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className={styles.planPrice}>
                        {ARS && <div>{ARS.amount.toLocaleString('es-AR')} <span style={{ fontSize: '0.7em', fontWeight: 600 }}>ARS</span></div>}
                        {USD && <div style={{ fontSize: ARS ? '0.75em' : '1em', color: ARS ? 'var(--text-light)' : 'var(--primary)', marginTop: ARS ? 2 : 0 }}>{USD.amount.toLocaleString('es-AR')} <span style={{ fontSize: '0.85em', fontWeight: 600 }}>USD</span></div>}
                        {!ARS && !USD && 'Gratuito'}
                      </div>
                      {course.status === 'PUBLICADO' && !enrolled && (
                        <button className={`${styles.planBtn} ${isMe ? styles.planBtnMe : ''}`} onClick={handleInscribirse}>
                          Inscribirme
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Objetivos del curso */}
          {course.objectives && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Objetivos del curso</h2>
              <div className={styles.objectivesContent} dangerouslySetInnerHTML={{ __html: course.objectives }} />
            </section>
          )}

          {/* Programa del curso */}
          {course.modules.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Programa del curso</h2>
              <div className={styles.moduleList}>
                {course.modules.map((m, i) => {
                  const open = openModules.has(m.id);
                  const accessLabel = m.accessAll
                    ? (profileNamesFromPrices.length > 0 ? profileNamesFromPrices.join(', ') : 'Todos')
                    : m.accessProfiles.map(a => a.profile.name).join(', ') || 'Sin perfiles';
                  return (
                    <div key={m.id} className={styles.moduleItem}>
                      <button className={styles.moduleHeader} onClick={() => toggleModule(m.id)}>
                        <div className={styles.moduleNum}>{i + 1}</div>
                        <div className={styles.moduleInfo}>
                          <span className={styles.moduleName}>{m.name}</span>
                          <div className={styles.moduleMeta}>
                            {m.date && <span className={styles.moduleDate}><Calendar size={12} /> {m.date}</span>}
                            <span className={styles.moduleAccess}>
                              {m.accessAll ? <Globe size={12} /> : <Lock size={12} />}
                              {accessLabel}
                            </span>
                          </div>
                        </div>
                        <ChevronDown size={18} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
                      </button>
                      {open && m.topics?.length > 0 && (
                        <div className={styles.moduleTopics}>
                          {m.topics.map((t, ti) => (
                            <div
                              key={ti}
                              className={styles.topicItem}
                              dangerouslySetInnerHTML={{ __html: cleanHtml(t) }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Materiales del curso */}
          {resources && resources.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Materiales del curso</h2>
              <div className={styles.resourceList}>
                {resources.map(r => (
                  r.type === 'SECTION' ? (
                    <div key={r.id} className={styles.resourceSection}>
                      <FolderOpen size={15} />
                      <span>{r.title}</span>
                    </div>
                  ) : (
                    <a key={r.id} href={r.fileUrl!} target="_blank" rel="noreferrer" download className={styles.resourceFile}>
                      <FileText size={15} />
                      <span>{r.title}</span>
                      <Download size={14} className={styles.resourceDownloadIcon} />
                    </a>
                  )
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      {showEnroll && (
        <EnrollModal
          course={course}
          session={session}
          onClose={() => setShowEnroll(false)}
          onSuccess={(newSession) => { if (newSession) setSession(newSession); setEnrolled(true); setShowEnroll(false); }}
        />
      )}
      <SiteFooter />
    </>
  );
}
