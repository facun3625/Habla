'use client';

import { FormEvent, use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  ArrowLeft, BookOpen, Copy, Download, ExternalLink, FileText, Film,
  Link2, LoaderCircle, Pencil, Plus, RefreshCw, Save, Trash2,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import styles from './editor.module.css';

type ItemType = 'FILE' | 'VIDEO' | 'BIBLIOGRAPHY';
type TalkItem = { id: number; type: ItemType; title: string; url: string | null; order: number };
type Talk = { id: number; title: string; active: boolean; publicPath: string; items: TalkItem[] };

const sectionCopy: Record<ItemType, { title: string; subtitle: string }> = {
  FILE: { title: 'Archivos', subtitle: 'PDF disponibles para las personas asistentes.' },
  VIDEO: { title: 'Videos', subtitle: 'Enlaces de Google Drive reproducidos dentro de la página.' },
  BIBLIOGRAPHY: { title: 'Bibliografía', subtitle: 'Referencias con PDF opcional.' },
};

export default function TalkEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [talk, setTalk] = useState<Talk | null>(null);
  const [title, setTitle] = useState('');
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadTalk() {
    const response = await fetch(`/api/talks/${id}`);
    if (!response.ok) throw new Error('No se pudo cargar la charla.');
    const data = await response.json();
    setTalk(data);
    setTitle(data.title);
  }

  useEffect(() => {
    loadTalk().catch((reason) => setError(reason.message)).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const publicUrl = useMemo(() => {
    if (!talk || typeof window === 'undefined') return '';
    return `${window.location.origin}${talk.publicPath}`;
  }, [talk]);

  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(publicUrl, { width: 720, margin: 2, color: { dark: '#1f1b3d', light: '#ffffff' } })
      .then(setQrData)
      .catch(() => setError('No se pudo generar la imagen del QR.'));
  }, [publicUrl]);

  function notify(text: string) {
    setMessage(text);
    setError('');
    window.setTimeout(() => setMessage(''), 3000);
  }

  async function updateTalk(data: { title?: string; active?: boolean }) {
    setBusy('talk');
    setError('');
    try {
      const response = await fetch(`/api/talks/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar.');
      setTalk((current) => current ? { ...current, ...result } : current);
      setTitle(result.title);
      notify('Cambios guardados.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar.');
    } finally { setBusy(''); }
  }

  async function regenerateAccess() {
    if (!window.confirm('El QR y el enlace anteriores dejarán de funcionar. ¿Querés continuar?')) return;
    setBusy('regenerate');
    const response = await fetch(`/api/talks/${id}/regenerate`, { method: 'POST' });
    const result = await response.json();
    if (response.ok) {
      setTalk((current) => current ? { ...current, ...result } : current);
      notify('Se creó un nuevo enlace y un nuevo QR.');
    } else setError(result.error || 'No se pudo regenerar el acceso.');
    setBusy('');
  }

  async function deleteTalk() {
    if (!window.confirm('Esta acción elimina la página y todo su contenido. No se puede deshacer.')) return;
    const confirmation = window.prompt('Escribí ELIMINAR para confirmar:');
    if (confirmation !== 'ELIMINAR') return;
    setBusy('delete-talk');
    const response = await fetch(`/api/talks/${id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: confirmation }),
    });
    if (response.ok) router.push('/admin/charlas');
    else {
      const result = await response.json();
      setError(result.error || 'No se pudo eliminar la charla.');
      setBusy('');
    }
  }

  async function deleteItem(itemId: number) {
    if (!window.confirm('¿Eliminar este elemento?')) return;
    const response = await fetch(`/api/talks/${id}/items/${itemId}`, { method: 'DELETE' });
    if (response.ok) {
      setTalk((current) => current ? { ...current, items: current.items.filter((item) => item.id !== itemId) } : current);
      notify('Elemento eliminado.');
    } else setError('No se pudo eliminar el elemento.');
  }

  async function renameItem(item: TalkItem) {
    const nextTitle = window.prompt('Nuevo título:', item.title)?.trim();
    if (!nextTitle || nextTitle === item.title) return;
    const response = await fetch(`/api/talks/${id}/items/${item.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: nextTitle }),
    });
    if (response.ok) {
      setTalk((current) => current ? {
        ...current, items: current.items.map((entry) => entry.id === item.id ? { ...entry, title: nextTitle } : entry),
      } : current);
      notify('Título actualizado.');
    } else setError('No se pudo cambiar el título.');
  }

  if (loading) return <AdminLayout><div className={styles.loading}><LoaderCircle className={styles.spin} /> Cargando…</div></AdminLayout>;
  if (!talk) return <AdminLayout><div className={styles.loading}>{error || 'Charla no encontrada.'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Link href="/admin/charlas" className={styles.back}><ArrowLeft size={17} /> Volver a charlas</Link>

        <div className={styles.heading}>
          <div>
            <span className={styles.eyebrow}>PÁGINA PARA QR</span>
            <h2>{talk.title}</h2>
            <p>Administrá el enlace y los materiales que verá el público.</p>
          </div>
          <button className={`${styles.statusButton} ${talk.active ? styles.isActive : styles.isInactive}`} onClick={() => updateTalk({ active: !talk.active })} disabled={busy === 'talk'}>
            <span /> {talk.active ? 'Página activa' : 'Página inactiva'}
          </button>
        </div>

        {message && <div className={styles.success}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.accessGrid}>
          <div className={styles.settingsCard}>
            <h3>Datos y enlace</h3>
            <label htmlFor="talk-name">Título de la charla</label>
            <div className={styles.inputAction}>
              <input id="talk-name" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} />
              <button onClick={() => updateTalk({ title })} disabled={busy === 'talk' || !title.trim()}><Save size={18} /> Guardar</button>
            </div>
            <label>Enlace público</label>
            <div className={styles.urlBox}>
              <span>{publicUrl}</span>
              <button title="Copiar enlace" onClick={() => { navigator.clipboard.writeText(publicUrl); notify('Enlace copiado.'); }}><Copy size={18} /></button>
              {talk.active && <Link title="Abrir página" href={talk.publicPath} target="_blank"><ExternalLink size={18} /></Link>}
            </div>
            <p className={styles.hint}>Solo quien tenga este enlace o el QR podrá llegar a la página. No aparece en el menú del sitio.</p>
            <button className={styles.regenerate} onClick={regenerateAccess} disabled={busy === 'regenerate'}>
              <RefreshCw size={17} className={busy === 'regenerate' ? styles.spin : ''} /> Generar otro enlace y QR
            </button>
          </div>

          <div className={styles.qrCard}>
            <div className={styles.qrImage}>{qrData ? <img src={qrData} alt={`Código QR de ${talk.title}`} /> : <LoaderCircle className={styles.spin} />}</div>
            <strong>Código QR</strong>
            <span>Listo para imprimir o compartir</span>
            <a className={styles.download} href={qrData} download={`qr-${talk.title.toLowerCase().replace(/\s+/g, '-')}.png`}><Download size={18} /> Descargar PNG</a>
          </div>
        </section>

        <div className={styles.sections}>
          {(['FILE', 'VIDEO', 'BIBLIOGRAPHY'] as ItemType[]).map((type) => (
            <ContentSection key={type} type={type} talkId={id} items={talk.items.filter((item) => item.type === type)} onCreated={(item) => setTalk((current) => current ? { ...current, items: [...current.items, item] } : current)} onDelete={deleteItem} onRename={renameItem} onError={setError} />
          ))}
        </div>

        <section className={styles.dangerZone}>
          <div><h3>Eliminar esta página</h3><p>El QR dejará de funcionar y se borrarán todos los materiales.</p></div>
          <button onClick={deleteTalk} disabled={busy === 'delete-talk'}><Trash2 size={17} /> Eliminar definitivamente</button>
        </section>
      </div>
    </AdminLayout>
  );
}

function ContentSection({ type, talkId, items, onCreated, onDelete, onRename, onError }: {
  type: ItemType; talkId: string; items: TalkItem[];
  onCreated: (item: TalkItem) => void; onDelete: (id: number) => void; onRename: (item: TalkItem) => void; onError: (error: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const Icon = type === 'FILE' ? FileText : type === 'VIDEO' ? Film : BookOpen;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    onError('');
    try {
      let finalUrl = url.trim();
      if (file) {
        const form = new FormData();
        form.append('file', file);
        const upload = await fetch(`/api/talks/${talkId}/upload`, { method: 'POST', body: form });
        const uploaded = await upload.json();
        if (!upload.ok) throw new Error(uploaded.error || 'No se pudo subir el PDF.');
        finalUrl = uploaded.url;
      }
      const response = await fetch(`/api/talks/${talkId}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, title, url: finalUrl }),
      });
      const item = await response.json();
      if (!response.ok) throw new Error(item.error || 'No se pudo agregar el elemento.');
      onCreated(item);
      setTitle(''); setUrl(''); setFile(null);
      const input = document.getElementById(`file-${type}`) as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (reason) { onError(reason instanceof Error ? reason.message : 'No se pudo guardar.'); }
    finally { setSaving(false); }
  }

  return (
    <section className={styles.contentCard}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionIcon}><Icon size={22} /></div>
        <div><h3>{sectionCopy[type].title}</h3><p>{sectionCopy[type].subtitle}</p></div>
      </div>
      <div className={styles.itemList}>
        {items.length === 0 ? <p className={styles.noItems}>Todavía no agregaste contenido.</p> : items.map((item) => (
          <div className={styles.item} key={item.id}>
            <Icon size={18} /><span>{item.title}</span>{item.url && <Link2 size={14} className={styles.hasLink} />}
            <button title="Cambiar título" onClick={() => onRename(item)}><Pencil size={16} /></button>
            <button title="Eliminar" className={styles.deleteItem} onClick={() => onDelete(item.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <form className={styles.addForm} onSubmit={submit}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === 'BIBLIOGRAPHY' ? 'Título o referencia bibliográfica' : 'Título'} />
        {type === 'VIDEO' ? (
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Enlace del video en Google Drive" type="url" required />
        ) : (
          <label className={styles.filePicker} htmlFor={`file-${type}`}>
            <input id={`file-${type}`} type="file" accept="application/pdf,.pdf" required={type === 'FILE'} onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <span>{file ? file.name : type === 'FILE' ? 'Elegir PDF' : 'Adjuntar PDF (opcional)'}</span>
          </label>
        )}
        <button disabled={saving || !title.trim()}><Plus size={17} /> {saving ? 'Agregando…' : 'Agregar'}</button>
      </form>
    </section>
  );
}
