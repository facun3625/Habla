'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Send, Users, BookOpen, ClipboardList, CheckCircle, AlertCircle, Loader, Bold, Italic, Underline, List, Link, Type, Strikethrough } from 'lucide-react';
import styles from './marketing.module.css';

type RecipientType = 'all' | 'course' | 'custom';
type Course = { id: number; title: string };

const RECIPIENT_OPTIONS: { id: RecipientType; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todos los usuarios', desc: 'Todos los registrados en la plataforma', icon: <Users size={18} /> },
  { id: 'course', label: 'Alumnos de un curso', desc: 'Inscriptos confirmados o con comprobante', icon: <BookOpen size={18} /> },
  { id: 'custom', label: 'Lista propia', desc: 'Pegá emails separados por coma o salto de línea', icon: <ClipboardList size={18} /> },
];

const INITIAL_BODY = '<p>Hola,</p><p>Escribí el contenido de tu email acá.</p><p>Saludos,<br>El equipo de Hablapraxia</p>';

function buildEmailHtml(baseUrl: string, emailTitle: string, bodyHtml: string, ctaText: string, ctaUrl: string, footerText: string): string {
  const titleBlock = emailTitle.trim()
    ? `<h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#1e1b4b">${emailTitle}</h2>`
    : '';

  const ctaBlock = ctaText && ctaUrl
    ? `<div style="text-align:center;margin:32px 0">
        <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;background:#6c5ce7;color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">${ctaText}</a>
       </div>`
    : '';

  // Wrap editor HTML in a styled div so font/color apply to all children
  const styledBody = `<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#374151">${bodyHtml}</div>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>p{margin:0 0 14px}ul{margin:0 0 14px;padding-left:20px}li{margin-bottom:4px}</style>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr>
          <td style="background:#6c5ce7;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center">
            <img src="${baseUrl}/logo.png" alt="Hablapraxia" height="48" style="display:block;margin:0 auto 10px">
            <span style="color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.5px">hablapraxia.com.ar</span>
          </td>
        </tr>
        <tr>
          <td style="background:white;padding:36px 40px">
            ${titleBlock}
            ${styledBody}
            ${ctaBlock}
          </td>
        </tr>
        <tr>
          <td style="background:#f8f7ff;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">${footerText}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Rich text editor ────────────────────────────────────────────────
function RichEditor({ onChange }: { onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = INITIAL_BODY;
      onChange(INITIAL_BODY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    onChange(editorRef.current?.innerHTML ?? '');
  }, [onChange]);

  const insertLink = useCallback(() => {
    const url = prompt('URL del enlace:');
    if (url) exec('createLink', url);
  }, [exec]);

  const handleInput = () => onChange(editorRef.current?.innerHTML ?? '');

  // prevent toolbar buttons from stealing focus
  const tb = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); fn(); };

  const ToolBtn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button className={styles.toolBtn} onMouseDown={tb(onClick)} title={title} type="button">
      {children}
    </button>
  );

  return (
    <div className={styles.editorWrap}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <ToolBtn onClick={() => exec('bold')} title="Negrita"><Bold size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Cursiva"><Italic size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Subrayado"><Underline size={15} /></ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Tachado"><Strikethrough size={15} /></ToolBtn>

        <div className={styles.toolDivider} />

        <ToolBtn onClick={() => exec('fontSize', '2')} title="Texto pequeño">
          <Type size={12} />
        </ToolBtn>
        <ToolBtn onClick={() => exec('fontSize', '4')} title="Texto normal">
          <Type size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => exec('fontSize', '6')} title="Texto grande">
          <Type size={19} />
        </ToolBtn>

        <div className={styles.toolDivider} />

        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Lista"><List size={15} /></ToolBtn>
        <ToolBtn onClick={insertLink} title="Insertar enlace"><Link size={15} /></ToolBtn>

        <div className={styles.toolDivider} />

        <ToolBtn onClick={() => exec('removeFormat')} title="Limpiar formato">
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: -0.5 }}>Aa</span>
        </ToolBtn>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={styles.editor}
        onInput={handleInput}
        onBlur={handleInput}
      />
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [courseId, setCourseId] = useState('');
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [emailTitle, setEmailTitle] = useState('');
  const [bodyHtml, setBodyHtml] = useState(INITIAL_BODY);
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [footerText, setFooterText] = useState(`© ${new Date().getFullYear()} Hablapraxia · Para darte de baja respondé este email.`);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  useEffect(() => {
    fetch('/api/courses').then((r) => r.json()).then((d) => setCourses(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const previewHtml = useMemo(
    () => buildEmailHtml(baseUrl, emailTitle, bodyHtml, ctaText, ctaUrl, footerText),
    [baseUrl, emailTitle, bodyHtml, ctaText, ctaUrl, footerText]
  );

  const send = async () => {
    setError(''); setResult(null);
    if (!subject.trim()) { setError('El asunto es requerido.'); return; }
    if (!bodyHtml.trim()) { setError('El contenido es requerido.'); return; }
    if (recipientType === 'course' && !courseId) { setError('Seleccioná un curso.'); return; }

    setSending(true);
    try {
      const res = await fetch('/api/marketing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType,
          courseId: courseId ? Number(courseId) : undefined,
          customEmails,
          subject,
          html: buildEmailHtml(baseUrl, emailTitle, bodyHtml, ctaText, ctaUrl, footerText),
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Error al enviar.');
      else setResult(data);
    } catch {
      setError('Error de conexión.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Marketing</h2>
            <p className={styles.subtitle}>Enviá emails a tus usuarios y alumnos.</p>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.compose}>

            {/* Recipients */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Destinatarios</h3>
              <div className={styles.recipientOptions}>
                {RECIPIENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.recipientBtn} ${recipientType === opt.id ? styles.recipientBtnActive : ''}`}
                    onClick={() => setRecipientType(opt.id)}
                  >
                    <span className={styles.recipientIcon}>{opt.icon}</span>
                    <span className={styles.recipientLabel}>{opt.label}</span>
                    <span className={styles.recipientDesc}>{opt.desc}</span>
                  </button>
                ))}
              </div>
              {recipientType === 'course' && (
                <select className={styles.select} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">Seleccioná un curso…</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              )}
              {recipientType === 'custom' && (
                <textarea className={styles.textarea} rows={4} placeholder={'email1@ejemplo.com\nemail2@ejemplo.com'} value={customEmails} onChange={(e) => setCustomEmails(e.target.value)} />
              )}
            </div>

            {/* Subject */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Asunto</h3>
              <input type="text" className={styles.input} placeholder="Asunto del email…" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            {/* Composer */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Mensaje</h3>

              <div className={styles.emailHeaderPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Logo" className={styles.emailHeaderLogo} />
                <span className={styles.emailHeaderDomain}>hablapraxia.com.ar</span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Título <span className={styles.optional}>opcional</span></label>
                <input type="text" className={styles.input} placeholder="Ej: Nuevo curso disponible 🎉" value={emailTitle} onChange={(e) => setEmailTitle(e.target.value)} />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Cuerpo del mensaje</label>
                <RichEditor onChange={setBodyHtml} />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Botón <span className={styles.optional}>opcional</span></label>
                <div className={styles.ctaRow}>
                  <input type="text" className={styles.input} placeholder="Texto del botón" value={ctaText} onChange={(e) => setCtaText(e.target.value)} style={{ flex: 1 }} />
                  <input type="text" className={styles.input} placeholder="URL destino" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} style={{ flex: 2 }} />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Texto del pie</label>
                <input type="text" className={styles.input} value={footerText} onChange={(e) => setFooterText(e.target.value)} />
              </div>
            </div>

            {error && <div className={styles.errorBanner}><AlertCircle size={18} />{error}</div>}
            {result && (
              <div className={styles.successBanner}>
                <CheckCircle size={18} />
                Enviado: <strong>{result.sent}</strong> de <strong>{result.total}</strong>
                {result.failed > 0 && <span style={{ color: '#e74c3c' }}> · Fallidos: {result.failed}</span>}
              </div>
            )}

            <button className={styles.sendBtn} onClick={send} disabled={sending}>
              {sending ? <><Loader size={18} className={styles.spin} /> Enviando…</> : <><Send size={18} /> Enviar campaña</>}
            </button>
          </div>

          {/* Live preview */}
          <div className={styles.sidebar}>
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0eeff' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Preview</h3>
              </div>
              <iframe srcDoc={previewHtml} title="preview" style={{ width: '100%', border: 'none', height: 580, display: 'block' }} sandbox="allow-same-origin" />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
