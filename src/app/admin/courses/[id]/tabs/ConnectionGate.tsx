'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import styles from '../courseAdmin.module.css';
import RichEditor from '@/app/components/RichEditor';

export default function ConnectionGate({ courseId }: { courseId: string }) {
  const [step1Content, setStep1Content] = useState('');
  const [term1Title, setTerm1Title] = useState('');
  const [term1Body, setTerm1Body] = useState('');
  const [term2Title, setTerm2Title] = useState('');
  const [term2Body, setTerm2Body] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        setStep1Content(data.gateStep1Content ?? '');
        setTerm1Title(data.gateTerm1Title ?? '');
        setTerm1Body(data.gateTerm1Body ?? '');
        setTerm2Title(data.gateTerm2Title ?? '');
        setTerm2Body(data.gateTerm2Body ?? '');
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gateStep1Content: step1Content,
        gateTerm1Title: term1Title,
        gateTerm1Body: term1Body,
        gateTerm2Title: term2Title,
        gateTerm2Body: term2Body,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760 }}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Acceso a Clases</h3>
          <p className={styles.sectionDesc}>
            Antes de ver los links de conexión por primera vez, el alumno debe leer este contenido y aceptar los dos términos, en orden.
          </p>
        </div>
        <button className={styles.saveButton} onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : saved ? <><CheckCircle size={16} /> Guardado</> : <><Save size={16} /> Guardar</>}
        </button>
      </div>

      <div className={styles.fieldGroup}>
        <label>Paso 1 — Contenido a leer</label>
        <RichEditor
          value={step1Content}
          onChange={setStep1Content}
          placeholder="Texto que el alumno debe leer antes de continuar (sin necesidad de aceptar nada)..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <label>Paso 2 — Título del Término y Condición 1</label>
        <input
          type="text"
          className={styles.input}
          value={term1Title}
          onChange={(e) => setTerm1Title(e.target.value)}
          placeholder="Ej: Uso de los links de conexión"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label>Paso 2 — Cuerpo del Término y Condición 1</label>
        <RichEditor
          value={term1Body}
          onChange={setTerm1Body}
          placeholder="Texto del primer término que el alumno debe leer y aceptar..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <label>Paso 3 — Título del Término y Condición 2</label>
        <input
          type="text"
          className={styles.input}
          value={term2Title}
          onChange={(e) => setTerm2Title(e.target.value)}
          placeholder="Ej: Confidencialidad del material"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label>Paso 3 — Cuerpo del Término y Condición 2</label>
        <RichEditor
          value={term2Body}
          onChange={setTerm2Body}
          placeholder="Texto del segundo término que el alumno debe leer y aceptar..."
        />
      </div>
    </div>
  );
}
