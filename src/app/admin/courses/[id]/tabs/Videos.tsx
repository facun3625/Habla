'use client';

import { useState, useEffect } from 'react';
import {
  PlayCircle, Eye, EyeOff, Trash2, Plus,
  ChevronUp, ChevronDown, Loader, Edit2, Check, X, Info,
} from 'lucide-react';
import styles from '../courseAdmin.module.css';
import ConfirmModal from '../../../components/ConfirmModal';

type CourseVideo = {
  id: number;
  title: string;
  driveUrl: string;
  visible: boolean;
  order: number;
};

export default function Videos({ courseId }: { courseId: string }) {
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const reload = () =>
    fetch(`/api/courses/${courseId}/videos`)
      .then((r) => r.json())
      .then(setVideos);

  useEffect(() => {
    reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const toggleVisible = async (v: CourseVideo) => {
    await fetch(`/api/courses/${courseId}/videos/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !v.visible }),
    });
    setVideos((prev) => prev.map((x) => (x.id === v.id ? { ...x, visible: !v.visible } : x)));
  };

  const startEditTitle = (v: CourseVideo) => { setEditingId(v.id); setEditTitle(v.title); };
  const cancelEditTitle = () => { setEditingId(null); setEditTitle(''); };
  const saveTitle = async (id: number) => {
    if (!editTitle.trim()) return;
    await fetch(`/api/courses/${courseId}/videos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle.trim() }),
    });
    setVideos((prev) => prev.map((x) => (x.id === id ? { ...x, title: editTitle.trim() } : x)));
    setEditingId(null);
  };

  const deleteVideo = (id: number) => {
    setConfirmModal({
      message: '¿Eliminar este video?',
      onConfirm: async () => {
        setConfirmModal(null);
        await fetch(`/api/courses/${courseId}/videos/${id}`, { method: 'DELETE' });
        setVideos((prev) => prev.filter((x) => x.id !== id));
      },
    });
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= videos.length) return;
    const next = [...videos];
    [next[index], next[target]] = [next[target], next[index]];
    const updated = next.map((v, i) => ({ ...v, order: i }));
    setVideos(updated);
    await Promise.all(
      updated.map((v) =>
        fetch(`/api/courses/${courseId}/videos/${v.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: v.order }),
        })
      )
    );
  };

  const addVideo = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    setSaving(true); setError('');
    const res = await fetch(`/api/courses/${courseId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), driveUrl: newUrl.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      await reload();
      setNewTitle(''); setNewUrl(''); setShowAddForm(false);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Error al guardar.');
    }
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.repoTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Videos de clases dictadas</h3>
          <p className={styles.sectionDesc}>
            Solo lo ven alumnas con inscripción confirmada, adentro de la plataforma. Los ítems ocultos no son visibles para los alumnos.
          </p>
        </div>
        <button className={styles.repoAddBtnPrimary} onClick={() => setShowAddForm(true)}>
          <Plus size={15} /> Agregar video
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
        <Info size={17} color="#0284c7" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, color: '#075985', fontSize: '0.83rem', lineHeight: 1.6 }}>
          Los videos se suben a Google Drive y acá solo se pega el link para compartir. Para que nadie pueda descargarlos, en Drive
          andá a <strong>Compartir → Configuración (⚙️)</strong> del archivo y desactivá la opción <strong>&quot;Los lectores pueden descargar&quot;</strong>.
          La plataforma nunca muestra el link original ni un botón de descarga, solo reproduce el video dentro de la página.
        </p>
      </div>

      {showAddForm && (
        <div className={styles.repoAddForm}>
          <p className={styles.repoAddFormLabel}>🎬 Nuevo video</p>
          <input
            className={styles.input}
            placeholder="Título (ej: Módulo 1 - Clase del 15/03)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            style={{ marginBottom: 8 }}
          />
          <input
            className={styles.input}
            placeholder="Link para compartir de Google Drive"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          {error && <p className={styles.repoError}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className={styles.saveButton} onClick={addVideo} disabled={saving || !newTitle.trim() || !newUrl.trim()}>
              {saving ? <><Loader size={14} className={styles.spinner} /> Guardando...</> : 'Guardar'}
            </button>
            <button className={styles.repoAddBtn} onClick={() => { setShowAddForm(false); setNewTitle(''); setNewUrl(''); setError(''); }}>Cancelar</button>
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <div className={styles.repoEmpty}>
          <PlayCircle size={40} strokeWidth={1.2} />
          <p>No hay videos todavía.</p>
          <span>Agregá el primero para empezar.</span>
        </div>
      ) : (
        <div className={styles.repoGroupFiles}>
          {videos.map((v, i) => (
            <div key={v.id} className={`${styles.repoItem} ${!v.visible ? styles.repoItemHidden : ''}`}>
              <div className={styles.repoItemOrder}>
                <button onClick={() => moveItem(i, -1)} disabled={i === 0} className={styles.repoOrderBtn}><ChevronUp size={13} /></button>
                <button onClick={() => moveItem(i, 1)} disabled={i === videos.length - 1} className={styles.repoOrderBtn}><ChevronDown size={13} /></button>
              </div>
              <div className={styles.repoItemIcon}><PlayCircle size={16} /></div>
              <div className={styles.repoItemInfo}>
                {editingId === v.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      className={styles.input}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveTitle(v.id)}
                      style={{ flex: 1 }}
                    />
                    <button className={styles.iconBtnSuccess} onClick={() => saveTitle(v.id)}><Check size={14} /></button>
                    <button className={styles.actionBtn} onClick={cancelEditTitle}><X size={14} /></button>
                  </div>
                ) : (
                  <span className={styles.repoItemTitle}>{v.title}</span>
                )}
              </div>
              <div className={styles.repoItemActions}>
                {editingId !== v.id && (
                  <button className={styles.actionBtn} onClick={() => startEditTitle(v)}><Edit2 size={14} /></button>
                )}
                <button
                  className={`${styles.repoVisibleBtn} ${v.visible ? styles.repoVisibleOn : ''}`}
                  onClick={() => toggleVisible(v)}
                >
                  {v.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  <span>{v.visible ? 'Visible' : 'Oculto'}</span>
                </button>
                <button className={styles.actionBtnDelete} onClick={() => deleteVideo(v.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
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
