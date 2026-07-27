'use client';

import { useState } from 'react';
import { FolderOpen, FileText, ExternalLink, ChevronDown } from 'lucide-react';
import styles from '../../../account.module.css';

type Resource = {
  id: number;
  type: 'SECTION' | 'FILE';
  title: string;
  fileUrl: string | null;
  visible: boolean;
  order: number;
};
type Group = { section: Resource | null; files: Resource[] };

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

export default function ContentTab({ resources }: { resources: Resource[] }) {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  if (!resources || resources.length === 0) {
    return (
      <div className={styles.card}>
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>Este curso todavía no tiene materiales cargados.</p>
      </div>
    );
  }

  const toggle = (id: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.repoSection} style={{ marginTop: 0 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>
        Repositorio de materiales
      </h2>

      <div className={styles.repoGroups}>
        {groupResources(resources).map((group) => {
          const isOpen = group.section ? openIds.has(group.section.id) : true;
          return (
            <div key={group.section?.id ?? 'none'} className={styles.repoGroup}>
              {group.section && (
                <button
                  type="button"
                  className={styles.repoSectionHeader}
                  onClick={() => toggle(group.section!.id)}
                  style={{ width: '100%', border: 'none', cursor: 'pointer', font: 'inherit' }}
                >
                  <FolderOpen size={16} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{group.section.title}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
                    {group.files.length} archivo{group.files.length !== 1 ? 's' : ''}
                  </span>
                  <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              )}
              {isOpen && (
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
