'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Edit2 } from 'lucide-react';
import styles from '../courseAdmin.module.css';
import ConfirmModal from '../../../components/ConfirmModal';
import { CERTIFICATE_VARIABLES, fillCertificateTemplate } from '@/lib/certificateVars';

type ModuleOpt = { id: number; name: string };
type Template = {
  id: number;
  moduleId: number | null;
  module: { id: number; name: string } | null;
  title: string;
  subtitle: string | null;
  bodyTemplate: string;
};

type FormState = { moduleId: string; title: string; subtitle: string; bodyTemplate: string };

const EMPTY_FORM: FormState = { moduleId: '', title: '', subtitle: '', bodyTemplate: '' };

const SAMPLE_VARS = {
  nombre: 'Nombre de Ejemplo',
  profesion: 'Fonoaudióloga',
  dni: '00.000.000',
  fecha: new Date().toLocaleDateString('es-AR'),
};

export default function Certificate({ courseId }: { courseId: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [modules, setModules] = useState<ModuleOpt[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [headerUrl, setHeaderUrl] = useState('');
  const [footerUrl, setFooterUrl] = useState('');
  const [signatures, setSignatures] = useState<{ name: string; imageUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // null = no hay formulario abierto; 'new' = creando; number = editando esa plantilla
  const [editing, setEditing] = useState<'new' | number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const reload = () =>
    fetch(`/api/courses/${courseId}/certificate`)
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data) ? data : []));

  useEffect(() => {
    Promise.all([
      reload(),
      fetch(`/api/courses/${courseId}/modules`).then((r) => r.json()).then((d) => setModules(Array.isArray(d) ? d : [])),
      fetch(`/api/courses/${courseId}`).then((r) => r.json()).then((d) => setCourseTitle(d?.title ?? '')),
      fetch('/api/settings').then((r) => r.json()).then((d) => {
        setHeaderUrl(d?.certificate_header_url ?? '');
        setFooterUrl(d?.certificate_footer_url ?? '');
        try { setSignatures(JSON.parse(d?.certificate_signatures || '[]')); } catch { setSignatures([]); }
      }),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const usedModuleIds = new Set(templates.map((t) => t.moduleId).filter((id): id is number => id !== null));
  const hasFullCourseTemplate = templates.some((t) => t.moduleId === null);
  const availableModules = modules.filter((m) => !usedModuleIds.has(m.id));

  const startNew = () => { setForm(EMPTY_FORM); setEditing('new'); setError(''); };
  const startEdit = (t: Template) => {
    setForm({ moduleId: t.moduleId ? String(t.moduleId) : '', title: t.title, subtitle: t.subtitle ?? '', bodyTemplate: t.bodyTemplate });
    setEditing(t.id);
    setError('');
  };
  const cancelForm = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); };

  const insertVar = (key: string) => {
    setForm((prev) => ({ ...prev, bodyTemplate: `${prev.bodyTemplate}${prev.bodyTemplate ? ' ' : ''}{${key}}` }));
  };

  const saveTemplate = async () => {
    if (!form.title.trim() || !form.bodyTemplate.trim()) return;
    setSaving(true); setError('');
    const isNew = editing === 'new';
    const url = isNew ? `/api/courses/${courseId}/certificate` : `/api/courses/${courseId}/certificate/${editing}`;
    const payload: Record<string, string> = { title: form.title, subtitle: form.subtitle, bodyTemplate: form.bodyTemplate };
    if (isNew) payload.moduleId = form.moduleId;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Error al guardar.');
      return;
    }
    await reload();
    cancelForm();
  };

  const deleteTemplate = (id: number) => {
    setConfirmModal({
      message: '¿Eliminar esta plantilla de certificado?',
      onConfirm: async () => {
        setConfirmModal(null);
        await fetch(`/api/courses/${courseId}/certificate/${id}`, { method: 'DELETE' });
        await reload();
      },
    });
  };

  const previewBody = (bodyTemplate: string, moduleName: string) =>
    fillCertificateTemplate(bodyTemplate, { ...SAMPLE_VARS, curso: courseTitle, modulo: moduleName });

  const editingModuleName = form.moduleId ? modules.find((m) => String(m.id) === form.moduleId)?.name ?? '' : '';

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.repoTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Certificado</h3>
          <p className={styles.sectionDesc}>
            El encabezado y el pie salen de Configuración → Certificados y se usan siempre. Acá armás el título y el texto de cada certificado (de curso completo y/o por módulo).
          </p>
        </div>
        {(hasFullCourseTemplate === false || availableModules.length > 0) && !editing && (
          <button className={styles.repoAddBtnPrimary} onClick={startNew}>
            <Plus size={15} /> Nueva plantilla
          </button>
        )}
      </div>

      {!headerUrl && !footerUrl && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: '0.83rem', color: '#9a3412' }}>
          Todavía no configuraste el encabezado ni el pie en Configuración → Certificados. Las plantillas se pueden armar igual, pero el PDF final va a salir sin esas imágenes hasta que los subas.
        </div>
      )}

      {editing !== null && (
        <div className={styles.repoAddForm} style={{ marginBottom: 24 }}>
          <p className={styles.repoAddFormLabel}>🎓 {editing === 'new' ? 'Nueva plantilla' : 'Editar plantilla'}</p>

          {editing === 'new' && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Alcance</label>
              <select
                className={styles.input}
                value={form.moduleId}
                onChange={(e) => setForm((prev) => ({ ...prev, moduleId: e.target.value }))}
              >
                {!hasFullCourseTemplate && <option value="">Curso completo</option>}
                {availableModules.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <input
            className={styles.input}
            placeholder="Título (ej: Curso de Apraxia del Habla Infantil)"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            style={{ marginBottom: 8 }}
          />
          <input
            className={styles.input}
            placeholder="Subtítulo (opcional)"
            value={form.subtitle}
            onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
            style={{ marginBottom: 8 }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {CERTIFICATE_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                title={v.label}
                onClick={() => insertVar(v.key)}
                style={{ background: '#f0eeff', color: '#6c5ce7', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {`{${v.key}}`}
              </button>
            ))}
          </div>

          <textarea
            className={styles.input}
            rows={4}
            placeholder="Certifica que {nombre}, de profesión {profesion}, completó..."
            value={form.bodyTemplate}
            onChange={(e) => setForm((prev) => ({ ...prev, bodyTemplate: e.target.value }))}
            style={{ resize: 'vertical', marginBottom: 12 }}
          />

          {/* Preview */}
          <div style={{ border: '1px solid #ede9fe', borderRadius: 14, overflow: 'hidden', marginBottom: 12, background: '#f5f3ef' }}>
            {headerUrl && <img src={headerUrl} alt="" style={{ width: '100%', display: 'block' }} />}
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: '#4c3fae' }}>{form.title || 'Título del certificado'}</p>
              {form.subtitle && <p style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 600, color: '#6c5ce7' }}>{form.subtitle}</p>}
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151', lineHeight: 1.6 }}>
                {previewBody(form.bodyTemplate, editingModuleName) || 'El texto del certificado aparece acá...'}
              </p>
            </div>
            {signatures.filter((s) => s.name.trim()).length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', padding: '0 24px 24px' }}>
                {signatures.filter((s) => s.name.trim()).map((sig, i) => (
                  <div key={i} style={{ textAlign: 'center', minWidth: 140 }}>
                    {sig.imageUrl && (
                      <img src={sig.imageUrl} alt="" style={{ height: 40, maxWidth: 150, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                    )}
                    <div style={{ borderTop: '2px solid #4c3fae', margin: '0 auto 6px', width: 150 }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{sig.name}</span>
                  </div>
                ))}
              </div>
            )}
            {footerUrl && <img src={footerUrl} alt="" style={{ width: '100%', display: 'block' }} />}
          </div>

          {error && <p className={styles.repoError}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={styles.saveButton} onClick={saveTemplate} disabled={saving || !form.title.trim() || !form.bodyTemplate.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button className={styles.repoAddBtn} onClick={cancelForm}>Cancelar</button>
          </div>
        </div>
      )}

      {templates.length === 0 && editing === null ? (
        <div className={styles.repoEmpty}>
          <Award size={40} strokeWidth={1.2} />
          <p>Todavía no hay plantillas de certificado.</p>
          <span>Creá la de &quot;Curso completo&quot; para empezar.</span>
        </div>
      ) : (
        <div className={styles.repoGroupFiles}>
          {templates.map((t) => (
            <div key={t.id} className={styles.repoItem}>
              <div className={styles.repoItemIcon}><Award size={16} /></div>
              <div className={styles.repoItemInfo}>
                <span className={styles.repoItemTitle}>{t.title}</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  {t.module ? `Módulo: ${t.module.name}` : 'Curso completo'}
                </span>
              </div>
              <div className={styles.repoItemActions}>
                <button className={styles.actionBtn} onClick={() => startEdit(t)}><Edit2 size={14} /></button>
                <button className={styles.actionBtnDelete} onClick={() => deleteTemplate(t.id)}><Trash2 size={14} /></button>
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
