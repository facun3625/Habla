'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, FileStack, Plus, QrCode, Search, Settings2 } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import styles from './talks.module.css';

type Talk = {
  id: number;
  title: string;
  active: boolean;
  publicPath: string;
  createdAt: string;
  _count: { items: number };
};

export default function TalksPage() {
  const router = useRouter();
  const [talks, setTalks] = useState<Talk[]>([]);
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/talks')
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then(setTalks)
      .catch(() => setError('No se pudieron cargar las charlas.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => talks.filter((talk) =>
    talk.title.toLowerCase().includes(search.toLowerCase())), [talks, search]);

  async function createTalk(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/talks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo crear la charla.');
      router.push(`/admin/charlas/${data.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la charla.');
      setCreating(false);
    }
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2>Charlas y códigos QR</h2>
            <p>Creá una página de materiales exclusiva para cada charla.</p>
          </div>
        </div>

        <form className={styles.createCard} onSubmit={createTalk}>
          <div className={styles.createIcon}><QrCode size={26} /></div>
          <div className={styles.createCopy}>
            <label htmlFor="talk-title">Nueva charla</label>
            <span>El nombre formará parte del enlace que abrirá el QR.</span>
          </div>
          <input
            id="talk-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Estrategias de intervención 2026"
            maxLength={140}
          />
          <button type="submit" disabled={creating || !title.trim()}>
            <Plus size={19} /> {creating ? 'Creando…' : 'Crear charla'}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.toolbar}>
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar charla…" />
        </div>

        <div className={styles.grid}>
          {loading ? (
            <div className={styles.empty}>Cargando charlas…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>Todavía no hay charlas creadas.</div>
          ) : filtered.map((talk) => (
            <article className={styles.card} key={talk.id}>
              <div className={styles.cardTop}>
                <div className={styles.cardIcon}><FileStack size={24} /></div>
                <span className={`${styles.status} ${talk.active ? styles.active : styles.inactive}`}>
                  {talk.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <h3>{talk.title}</h3>
              <p>{talk._count.items} {talk._count.items === 1 ? 'elemento cargado' : 'elementos cargados'}</p>
              <code>{talk.publicPath}</code>
              <div className={styles.actions}>
                {talk.active && (
                  <Link href={talk.publicPath} target="_blank"><Eye size={17} /> Ver página</Link>
                )}
                <Link className={styles.primaryAction} href={`/admin/charlas/${talk.id}`}>
                  <Settings2 size={17} /> Administrar
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
