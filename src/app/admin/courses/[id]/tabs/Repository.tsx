'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FolderOpen, FileText, Eye, EyeOff, Trash2, Plus,
  ChevronUp, ChevronDown, Upload, Loader, CheckCircle,
} from 'lucide-react';
import styles from '../courseAdmin.module.css';
import ConfirmModal from '../../components/ConfirmModal';

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

export default function Repository({ courseId }: { courseId: string }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // "Nueva sección" form
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // "Agregar archivo" form — keyed by sectionId (null = sin sección)
  const [addFileFor, setAddFileFor] = useState<number | 'none' | null>(null);
  const [newFileTitle, setNewFileTitle] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/resources`)
      .then(r => r.json())
      .then(setResources)
      .finally(() => setLoading(false));
  }, [courseId]);

  const reload = () =>
    fetch(`/api/courses/${courseId}/resources`)
      .then(r => r.json())
      .then(setResources);

  const toggleVisible = async (r: Resource) => {
    await fetch(`/api/courses/${courseId}/resources/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !r.visible }),
    });
    setResources(prev => prev.map(x => x.id === r.id ? { ...x, visible: !r.visible } : x));
  };

  const deleteResource = (id: number) => {
    setConfirmModal({
      message: '¿Eliminar este elemento?',
      onConfirm: async () => {
        setConfirmModal(null);
        await fetch(`/api/courses/${courseId}/resources/${id}`, { method: 'DELETE' });
        setResources(prev => prev.filter(x => x.id !== id));
      },
    });
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= resources.length) return;
    const next = [...resources];
    [next[index], next[target]] = [next[target], next[index]];
    const updated = next.map((r, i) => ({ ...r, order: i }));
    setResources(updated);
    await Promise.all(
      updated.map(r =>
        fetch(`/api/courses/${courseId}/resources/${r.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: r.order }),
        })
      )
    );
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    setUploading(true); setError('');
    const res = await fetch(`/api/courses/${courseId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'SECTION', title: newSectionTitle.trim() }),
    });
    setUploading(false);
    if (res.ok) { await reload(); setNewSectionTitle(''); setShowAddSection(false); }
    else setError('Error al guardar.');
  };

  const addFile = async (afterSectionId: number | 'none') => {
    if (!newFileTitle.trim() || !pendingFile) return;
    setUploading(true); setError('');

    const fd = new FormData();
    fd.append('file', pendingFile);
    const up = await fetch('/api/upload', { method: 'POST', body: fd });
    const upData = await up.json();
    if (!upData.url) { setError('Error al subir el archivo.'); setUploading(false); return; }

    // Insert right after the section (or its files)
    const groups = groupResources(resources);
    const group = groups.find(g =>
      afterSectionId === 'none' ? g.section === null : g.section?.id === afterSectionId
    );
    const lastInGroup = group?.files.at(-1) ?? group?.section ?? null;
    const insertAfterOrder = lastInGroup?.order ?? -1;

    // Shift all items with order > insertAfterOrder
    const shifted = resources.map(r =>
      r.order > insertAfterOrder ? { ...r, order: r.order + 1 } : r
    );

    const res = await fetch(`/api/courses/${courseId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'FILE', title: newFileTitle.trim(), fileUrl: upData.url }),
    });
    setUploading(false);
    if (!res.ok) { setError('Error al guardar.'); return; }

    // Fix orders on server for shifted items
    await Promise.all(
      shifted
        .filter((r, i) => r.order !== resources[i].order)
        .map(r =>
          fetch(`/api/courses/${courseId}/resources/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: r.order }),
          })
        )
    );

    await reload();
    setNewFileTitle(''); setPendingFile(null); setAddFileFor(null);
  };

  const cancelFileForm = () => { setAddFileFor(null); setNewFileTitle(''); setPendingFile(null); setError(''); };

  const groups = groupResources(resources);

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.repoTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Repositorio de materiales</h3>
          <p className={styles.sectionDesc}>
            Publicá archivos para los alumnos con inscripción confirmada. Los ítems ocultos no son visibles para los alumnos.
          </p>
        </div>
        <button className={styles.repoAddBtnPrimary} onClick={() => { setShowAddSection(true); }}>
          <Plus size={15} /> Nueva sección
        </button>
      </div>

      {/* Nueva sección form */}
      {showAddSection && (
        <div className={styles.repoAddForm}>
          <p className={styles.repoAddFormLabel}>📁 Nueva sección</p>
          <input
            className={styles.input}
            placeholder="Título de la sección"
            value={newSectionTitle}
            onChange={e => setNewSectionTitle(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && addSection()}
          />
          {error && <p className={styles.repoError}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={styles.saveButton} onClick={addSection} disabled={uploading || !newSectionTitle.trim()}>
              {uploading ? <><Loader size={14} className={styles.spinner} /> Guardando...</> : 'Guardar'}
            </button>
            <button className={styles.repoAddBtn} onClick={() => { setShowAddSection(false); setNewSectionTitle(''); }}>Cancelar</button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className={styles.repoEmpty}>
          <FolderOpen size={40} strokeWidth={1.2} />
          <p>No hay materiales todavía.</p>
          <span>Creá una sección para empezar.</span>
        </div>
      ) : (
        <div className={styles.repoGroups}>
          {groups.map((group, gi) => {
            const sectionIdx = group.section ? resources.findIndex(r => r.id === group.section!.id) : -1;
            const sectionKey = group.section?.id ?? 'none';
            return (
              <div key={sectionKey} className={styles.repoGroup}>
                {/* Section header */}
                {group.section && (
                  <div className={`${styles.repoItem} ${styles.repoItemSection} ${!group.section.visible ? styles.repoItemHidden : ''}`}>
                    <div className={styles.repoItemOrder}>
                      <button onClick={() => moveItem(sectionIdx, -1)} disabled={gi === 0} className={styles.repoOrderBtn}><ChevronUp size={13} /></button>
                      <button onClick={() => moveItem(sectionIdx, 1)} disabled={gi === groups.length - 1} className={styles.repoOrderBtn}><ChevronDown size={13} /></button>
                    </div>
                    <div className={styles.repoItemIcon}><FolderOpen size={16} /></div>
                    <div className={styles.repoItemInfo}>
                      <span className={styles.repoItemTitle}>{group.section.title}</span>
                    </div>
                    <div className={styles.repoItemActions}>
                      <button
                        className={`${styles.repoVisibleBtn} ${group.section.visible ? styles.repoVisibleOn : ''}`}
                        onClick={() => toggleVisible(group.section!)}
                      >
                        {group.section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                        <span>{group.section.visible ? 'Visible' : 'Oculto'}</span>
                      </button>
                      <button className={styles.actionBtnDelete} onClick={() => deleteResource(group.section!.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                )}

                {/* Files inside section */}
                <div className={styles.repoGroupFiles}>
                  {group.files.map((file, fi) => {
                    const fileIdx = resources.findIndex(r => r.id === file.id);
                    const canUp = fileIdx > 0 && resources[fileIdx - 1].type !== 'SECTION';
                    const canDown = fileIdx < resources.length - 1 && resources[fileIdx + 1].type !== 'SECTION';
                    return (
                      <div key={file.id} className={`${styles.repoItem} ${!file.visible ? styles.repoItemHidden : ''}`}>
                        <div className={styles.repoItemOrder}>
                          <button onClick={() => moveItem(fileIdx, -1)} disabled={!canUp} className={styles.repoOrderBtn}><ChevronUp size={13} /></button>
                          <button onClick={() => moveItem(fileIdx, 1)} disabled={!canDown} className={styles.repoOrderBtn}><ChevronDown size={13} /></button>
                        </div>
                        <div className={styles.repoItemIcon}><FileText size={16} /></div>
                        <div className={styles.repoItemInfo}>
                          <span className={styles.repoItemTitle}>{file.title}</span>
                          {file.fileUrl && (
                            <a href={file.fileUrl} target="_blank" rel="noreferrer" className={styles.repoItemLink}>Ver archivo</a>
                          )}
                        </div>
                        <div className={styles.repoItemActions}>
                          <button
                            className={`${styles.repoVisibleBtn} ${file.visible ? styles.repoVisibleOn : ''}`}
                            onClick={() => toggleVisible(file)}
                          >
                            {file.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                            <span>{file.visible ? 'Visible' : 'Oculto'}</span>
                          </button>
                          <button className={styles.actionBtnDelete} onClick={() => deleteResource(file.id)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add file form inside section */}
                  {addFileFor === sectionKey ? (
                    <div className={styles.repoAddFileForm}>
                      <input
                        className={styles.input}
                        placeholder="Nombre del archivo"
                        value={newFileTitle}
                        onChange={e => setNewFileTitle(e.target.value)}
                        autoFocus
                      />
                      <div className={styles.repoUploadArea} onClick={() => fileRef.current?.click()}>
                        {pendingFile
                          ? <span className={styles.repoFileName}><CheckCircle size={14} /> {pendingFile.name}</span>
                          : <><Upload size={16} /><span>Seleccioná el archivo</span></>
                        }
                      </div>
                      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setPendingFile(e.target.files?.[0] ?? null)} />
                      {error && <p className={styles.repoError}>{error}</p>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className={styles.saveButton}
                          onClick={() => addFile(sectionKey)}
                          disabled={uploading || !newFileTitle.trim() || !pendingFile}
                        >
                          {uploading ? <><Loader size={14} className={styles.spinner} /> Subiendo...</> : 'Guardar'}
                        </button>
                        <button className={styles.repoAddBtn} onClick={cancelFileForm}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className={styles.repoAddFileBtn}
                      onClick={() => { cancelFileForm(); setAddFileFor(sectionKey); }}
                    >
                      <Plus size={14} /> Agregar archivo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
