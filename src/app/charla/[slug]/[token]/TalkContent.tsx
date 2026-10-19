'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BookOpen, ExternalLink, FileText, Film, LibraryBig, Play, X } from 'lucide-react';
import { driveEmbedUrl } from '@/lib/googleDrive';
import styles from './talk.module.css';

type ItemType = 'FILE' | 'VIDEO' | 'BIBLIOGRAPHY';
type TalkItem = { id: number; type: string; title: string; url: string | null; order: number };

const tabs: { id: ItemType; label: string; icon: typeof FileText }[] = [
  { id: 'FILE', label: 'Archivos', icon: FileText },
  { id: 'VIDEO', label: 'Videos', icon: Film },
  { id: 'BIBLIOGRAPHY', label: 'Bibliografía', icon: LibraryBig },
];

export default function TalkContent({ title, items }: { title: string; items: TalkItem[] }) {
  const firstAvailable = tabs.find((tab) => items.some((item) => item.type === tab.id))?.id || 'FILE';
  const [active, setActive] = useState<ItemType>(firstAvailable);
  const [playing, setPlaying] = useState<TalkItem | null>(null);
  const visibleItems = items.filter((item) => item.type === active);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPlaying(null); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [playing]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Image src="/logo.png" alt="Hablapraxia" width={176} height={52} className={styles.logo} priority />
          <nav aria-label="Contenido de la charla">
            {tabs.map((tab, index) => (
              <span key={tab.id} className={styles.navGroup}>
                {index > 0 && <span className={styles.divider}>|</span>}
                <button className={active === tab.id ? styles.navActive : ''} onClick={() => setActive(tab.id)}>{tab.label}</button>
              </span>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <span className={styles.kicker}>MATERIAL DE LA CHARLA</span>
            <h1>{title}</h1>
            <p>Encontrá aquí los archivos, videos y referencias compartidos durante el encuentro.</p>
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.mobileTabs} role="tablist" aria-label="Secciones">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return <button key={tab.id} role="tab" aria-selected={active === tab.id} className={active === tab.id ? styles.tabActive : ''} onClick={() => setActive(tab.id)}><Icon size={18} />{tab.label}</button>;
            })}
          </div>

          <div className={styles.sectionTitle}>
            {active === 'FILE' ? <FileText /> : active === 'VIDEO' ? <Film /> : <BookOpen />}
            <div><h2>{tabs.find((tab) => tab.id === active)?.label}</h2><p>{visibleItems.length} {visibleItems.length === 1 ? 'recurso disponible' : 'recursos disponibles'}</p></div>
          </div>

          {visibleItems.length === 0 ? (
            <div className={styles.empty}><span>Próximamente</span><p>Todavía no hay contenido publicado en esta sección.</p></div>
          ) : active === 'VIDEO' ? (
            <div className={styles.videoGrid}>
              {visibleItems.map((item) => (
                <article className={styles.videoCard} key={item.id}>
                  <button
                    type="button"
                    className={styles.videoPoster}
                    onClick={() => item.url && setPlaying(item)}
                    disabled={!item.url}
                    aria-label={`Reproducir ${item.title}`}
                  >
                    <Film size={28} />
                    <span className={styles.playBtn}><Play size={20} fill="currentColor" /></span>
                  </button>
                  <h3>{item.title}</h3>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.resourceList}>
              {visibleItems.map((item, index) => (
                <article className={styles.resource} key={item.id}>
                  <div className={styles.resourceNumber}>{String(index + 1).padStart(2, '0')}</div>
                  <div className={styles.resourceText}><h3>{item.title}</h3><span>{active === 'FILE' ? 'Documento PDF' : item.url ? 'Referencia con documento' : 'Referencia bibliográfica'}</span></div>
                  {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={17} /> Ver PDF</a>}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className={styles.footer}><Image src="/logo.png" alt="Hablapraxia" width={130} height={40} /><span>Material exclusivo para asistentes</span></footer>

      {playing && (() => {
        const embed = playing.url ? driveEmbedUrl(playing.url) : null;
        return (
          <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={playing.title} onClick={() => setPlaying(null)}>
            <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
              <div className={styles.lightboxHead}>
                <h3>{playing.title}</h3>
                <button type="button" onClick={() => setPlaying(null)} aria-label="Cerrar"><X size={20} /></button>
              </div>
              <div className={styles.lightboxFrame}>
                {embed ? (
                  <iframe src={embed} title={playing.title} allow="autoplay" sandbox="allow-scripts allow-same-origin allow-presentation" referrerPolicy="strict-origin-when-cross-origin" />
                ) : (
                  <p className={styles.lightboxError}>No se pudo cargar este video.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
