'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import styles from '../courseAdmin.module.css';

const DEFAULT_SUBJECT = 'Tu inscripción en {curso} fue confirmada';
const DEFAULT_BODY = `<p>Hola {nombre},</p>
<p>Tu inscripción en el curso <strong>{curso}</strong> ha sido <strong>confirmada</strong>.</p>
<p>Fecha de inicio: {fecha_inicio}</p>
<p>¡Te esperamos! Ante cualquier consulta respondé este email.</p>
<p>Equipo Hablapraxia</p>`;

export default function ConfirmationEmail({ courseId }: { courseId: string }) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then(r => r.json())
      .then(data => {
        if (data.confirmationEmailSubject) setSubject(data.confirmationEmailSubject);
        if (data.confirmationEmail) setBody(data.confirmationEmail);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationEmailSubject: subject, confirmationEmail: body }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Email de confirmación</h3>
          <p className={styles.sectionDesc}>Se envía automáticamente cuando confirmás una inscripción.</p>
        </div>
        <button className={styles.saveButton} onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : saved ? <><CheckCircle size={16} /> Guardado</> : <><Save size={16} /> Guardar</>}
        </button>
      </div>

      {/* Variables reference */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
          Variables disponibles
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['{nombre}', '{curso}', '{fecha_inicio}', '{perfil}'].map(v => (
            <code key={v} style={{ background: '#f0ebff', color: '#6c5ce7', borderRadius: 6, padding: '3px 8px', fontSize: '0.82rem', fontWeight: 700 }}>
              {v}
            </code>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div className={styles.fieldGroup}>
        <label>Asunto del email</label>
        <input
          type="text"
          className={styles.input}
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Tu inscripción en {curso} fue confirmada"
        />
      </div>

      {/* Body */}
      <div className={styles.fieldGroup}>
        <label>Cuerpo del email <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(HTML)</span></label>
        <textarea
          className={styles.input}
          rows={14}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={DEFAULT_BODY}
          style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical' }}
        />
      </div>

      {/* Preview */}
      {body && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Vista previa</p>
          <div
            style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', fontSize: '0.9rem', lineHeight: 1.8, color: '#2c3e50' }}
            dangerouslySetInnerHTML={{
              __html: `
                <div style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);padding:24px 32px;text-align:center;">
                  <img src="/logo.png" alt="Hablapraxia" style="height:44px;object-fit:contain;" />
                </div>
                <div style="padding:28px 32px;">
                  ${body
                    .replace(/\{nombre\}/g, 'María García')
                    .replace(/\{curso\}/g, 'Apraxia del Habla')
                    .replace(/\{fecha_inicio\}/g, '5 de mayo de 2025')
                    .replace(/\{perfil\}/g, 'Fonoaudióloga')}
                </div>
                <div style="background:#f8fafc;padding:14px 32px;text-align:center;font-size:0.78rem;color:#94a3b8;border-top:1px solid #e2e8f0;">
                  © ${new Date().getFullYear()} Hablapraxia · hablapraxia.com.ar
                </div>
              `,
            }}
          />
        </div>
      )}
    </div>
  );
}
