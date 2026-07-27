'use client';

import { useState } from 'react';
import { Lock, ChevronDown } from 'lucide-react';
import styles from '../../../account.module.css';
import { canAccess, type Module } from '../courseAccess';

export default function ModulesTab({ modules, profileId }: { modules: Module[]; profileId: number | null }) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className={styles.card}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>
        Módulos del curso
      </h2>

      {modules.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>Este curso todavía no tiene módulos cargados.</p>
      ) : (
        <div className={styles.moduleList}>
          {modules.map((mod, i) => {
            const accessible = canAccess(mod, profileId);
            const hasTopics = accessible && mod.topics?.length > 0;
            const isOpen = openId === mod.id;
            return (
              <div key={mod.id} className={`${styles.moduleItem} ${!accessible ? styles.moduleItemLocked : ''}`}>
                <button
                  type="button"
                  className={styles.moduleItemHeader}
                  onClick={() => hasTopics && setOpenId(isOpen ? null : mod.id)}
                  style={{ cursor: hasTopics ? 'pointer' : 'default' }}
                >
                  <div className={`${styles.moduleNum} ${accessible ? styles.moduleNumActive : ''}`}>
                    {accessible ? i + 1 : <Lock size={13} />}
                  </div>
                  <span className={styles.moduleName}>{mod.name}</span>
                  {mod.date && <span className={styles.moduleDate}>{mod.date}</span>}
                  {!accessible && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Sin acceso</span>
                  )}
                  {hasTopics && (
                    <ChevronDown
                      size={18}
                      className={styles.moduleChevron}
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                    />
                  )}
                </button>
                {isOpen && hasTopics && (
                  <div className={styles.moduleTopics}>
                    {mod.topics.map((t, ti) => (
                      <div key={ti} className={styles.moduleTopicItem} dangerouslySetInnerHTML={{ __html: t }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
