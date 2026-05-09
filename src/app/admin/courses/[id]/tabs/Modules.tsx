'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, GripVertical, Edit2, Trash2, Calendar, Check, X, Lock, Globe } from 'lucide-react';
import styles from '../courseAdmin.module.css';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const QUILL_MODULES = {
  toolbar: [
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'bullet' }],
    ['clean'],
  ],
};
const QUILL_FORMATS = ['size', 'bold', 'italic', 'underline', 'list'];

type Profile = { id: number; name: string };
type ModuleAccess = { profileId: number; profile: Profile };
type Module = {
  id: number;
  name: string;
  order: number;
  date: string | null;
  accessAll: boolean;
  accessProfiles: ModuleAccess[];
  topics: string[];
};

export default function Modules({ courseId }: { courseId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [courseProfiles, setCourseProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAccessAll, setEditAccessAll] = useState(true);
  const [editProfileIds, setEditProfileIds] = useState<number[]>([]);
  const [editTopics, setEditTopics] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${courseId}/modules`).then((r) => r.json()),
      fetch(`/api/courses/${courseId}`).then((r) => r.json()),
      fetch('/api/profiles').then((r) => r.json()),
    ]).then(([mods, course, allProfiles]) => {
      setModules(mods);
      const targetNames = (course.targetAudience ?? '')
        .split(',').map((s: string) => s.trim()).filter(Boolean);
      const filtered = Array.isArray(allProfiles)
        ? allProfiles.filter((p: Profile) => targetNames.includes(p.name))
        : [];
      setCourseProfiles(filtered);
    }).finally(() => setLoading(false));
  }, [courseId]);

  const addModule = async () => {
    const res = await fetch(`/api/courses/${courseId}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nuevo Módulo' }),
    });
    const m = await res.json();
    setModules((prev) => [...prev, m]);
    startEdit(m);
  };

  const startEdit = (m: Module) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditDate(m.date ?? '');
    setEditAccessAll(m.accessAll);
    setEditProfileIds((m.accessProfiles ?? []).map((a) => a.profileId));
    setEditTopics(m.topics?.length ? [...m.topics] : ['']);
  };

  const saveEdit = async (id: number) => {
    const res = await fetch(`/api/courses/${courseId}/modules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        date: editDate,
        accessAll: editAccessAll,
        profileIds: editAccessAll ? [] : editProfileIds,
        topics: editTopics,
      }),
    });
    const updated = await res.json();
    setModules((prev) => prev.map((m) => m.id === id ? updated : m));
    setEditingId(null);
  };

  const updateTopic = (i: number, value: string) => {
    setEditTopics((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const removeTopic = (i: number) => {
    setEditTopics((prev) => prev.filter((_, idx) => idx !== i));
  };

  const deleteModule = async (id: number) => {
    await fetch(`/api/courses/${courseId}/modules/${id}`, { method: 'DELETE' });
    setModules((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleProfileId = (pid: number) => {
    setEditProfileIds((prev) =>
      prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
    );
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.modulesTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Estructura del Curso</h3>
          <p className={styles.sectionDesc}>Organizá el contenido en módulos. Podés restringir el acceso por perfil.</p>
        </div>
        <button className={styles.addBtnSmall} onClick={addModule}>
          <Plus size={18} /> Nuevo Módulo
        </button>
      </div>

      <div className={styles.listContainer}>
        {modules.length === 0 && (
          <p style={{ padding: '1rem', color: '#aaa', textAlign: 'center' }}>No hay módulos. Agregá el primero.</p>
        )}
        {modules.map((m) => (
          <div key={m.id} className={styles.listItem}>
            {editingId === m.id ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className={styles.input} placeholder="Nombre del módulo" style={{ flex: 1 }} />
                  <input value={editDate} onChange={(e) => setEditDate(e.target.value)} className={styles.input} placeholder="Ej: Mayo 2025" style={{ width: 140 }} />
                </div>

                {/* Access control */}
                <div className={styles.accessRow}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Acceso:</span>
                  <button
                    className={`${styles.accessToggleBtn} ${editAccessAll ? styles.accessToggleActive : ''}`}
                    onClick={() => setEditAccessAll(true)}
                    type="button"
                  >
                    <Globe size={14} /> Todos
                  </button>
                  <button
                    className={`${styles.accessToggleBtn} ${!editAccessAll ? styles.accessToggleActive : ''}`}
                    onClick={() => setEditAccessAll(false)}
                    type="button"
                  >
                    <Lock size={14} /> Restringido
                  </button>
                </div>

                {!editAccessAll && courseProfiles.length > 0 && (
                  <div className={styles.profileCheckboxes}>
                    {courseProfiles.map((p) => (
                      <label key={p.id} className={styles.profileCheckbox}>
                        <input
                          type="checkbox"
                          checked={editProfileIds.includes(p.id)}
                          onChange={() => toggleProfileId(p.id)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                )}

                {/* Topics */}
                <div className={styles.topicsSection}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Temas del módulo:</span>
                  <div className={styles.topicsList}>
                    {editTopics.map((t, i) => (
                      <div key={i} className={styles.topicRow}>
                        <div style={{ flex: 1 }}>
                          <ReactQuill
                            theme="snow"
                            value={t}
                            onChange={(val) => updateTopic(i, val)}
                            modules={QUILL_MODULES}
                            formats={QUILL_FORMATS}
                            placeholder={`Tema ${i + 1}`}
                            style={{ borderRadius: 8, overflow: 'hidden' }}
                          />
                        </div>
                        <button type="button" className={styles.actionBtn} onClick={() => removeTopic(i)} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button type="button" className={styles.addBtnSmall} onClick={() => setEditTopics(prev => [...prev, ''])} style={{ marginTop: 6 }}>
                      <Plus size={14} /> Agregar tema
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={styles.iconBtnSuccess} onClick={() => saveEdit(m.id)}><Check size={16} /></button>
                  <button className={styles.actionBtn} onClick={() => setEditingId(null)}><X size={16} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.itemMain}>
                  <div className={styles.dragHandle}><GripVertical size={20} /></div>
                  <div className={styles.itemInfo}>
                    <h4>{m.name}</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                      {m.date && (
                        <div className={styles.itemMeta}><Calendar size={14} /><span>{m.date}</span></div>
                      )}
                      <div className={styles.itemMeta}>
                        {m.accessAll ? (
                          <><Globe size={14} /><span>{courseProfiles.length > 0 ? courseProfiles.map(p => p.name).join(', ') : 'Todos'}</span></>
                        ) : (
                          <><Lock size={14} /><span>{m.accessProfiles.map((a) => a.profile.name).join(', ') || 'Sin perfiles'}</span></>
                        )}
                      </div>
                    </div>
                    {m.topics?.length > 0 && (
                      <div className={styles.topicsPreview}>
                        {m.topics.map((t, i) => (
                          <div key={i} dangerouslySetInnerHTML={{ __html: t }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button title="Editar" className={styles.actionBtn} onClick={() => startEdit(m)}><Edit2 size={16} /></button>
                  <button title="Eliminar" className={styles.actionBtnDelete} onClick={() => deleteModule(m.id)}><Trash2 size={16} /></button>
                </div>
              </>
            )}
          </div>
        ))}
        <button className={styles.addBtn} onClick={addModule}>
          <Plus size={20} /> Añadir otro módulo
        </button>
      </div>
    </div>
  );
}
