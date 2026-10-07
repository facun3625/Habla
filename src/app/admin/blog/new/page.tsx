'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { ArrowLeft, FileCode2, Save, Upload, X } from 'lucide-react';
import styles from '../../courses/courses.module.css';
import Link from 'next/link';
import RichEditor from '@/app/components/RichEditor';
import { POST_CATEGORIES, type PostCategory, type PostContentFormat } from '@/lib/postOptions';

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'BLOG' as PostCategory,
    contentFormat: 'RICH_TEXT' as PostContentFormat,
    coverImage: '',
    videoUrl: '',
    showCoverImage: true,
    published: false,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) setFormData((prev) => ({ ...prev, coverImage: data.url }));
    setUploading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleHtmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setFormData((prev) => ({ ...prev, content, contentFormat: 'HTML' }));
    e.target.value = '';
  };

  const handleQuillChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push('/admin/blog');
      } else {
        alert('Error al crear la noticia');
      }
    } catch (error) {
      console.error(error);
      alert('Error al crear la noticia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Link href="/admin/blog" className={styles.backLink} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', marginBottom: '10px', textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Volver a Novedades
            </Link>
            <h2 className={styles.title}>Nueva Noticia</h2>
          </div>
          <button onClick={handleSubmit} disabled={loading} className={styles.createButton}>
            <Save size={20} />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        <div className={styles.tableCard} style={{ padding: '30px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Título *</label>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="category" style={{ fontWeight: 600 }}>Categoría *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', background: '#fff' }}
              >
                {Object.entries(POST_CATEGORIES).map(([value, item]) => (
                  <option key={value} value={value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Resumen (Excerpt)</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={3}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Formato del contenido *</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, contentFormat: 'RICH_TEXT' }))}
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cfc8ff', cursor: 'pointer', fontWeight: 700, background: formData.contentFormat === 'RICH_TEXT' ? '#6c5ce7' : '#fff', color: formData.contentFormat === 'RICH_TEXT' ? '#fff' : '#5f4ed1' }}
                >
                  Editor visual
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, contentFormat: 'HTML' }))}
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cfc8ff', cursor: 'pointer', fontWeight: 700, background: formData.contentFormat === 'HTML' ? '#6c5ce7' : '#fff', color: formData.contentFormat === 'HTML' ? '#fff' : '#5f4ed1' }}
                >
                  HTML completo
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Contenido principal *</label>
              {formData.contentFormat === 'HTML' ? (
                <>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    Pegá el documento HTML completo o cargá un archivo. Se mostrará aislado del diseño del sitio y sin ejecutar scripts.
                  </p>
                  <label style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: 8, padding: '9px 13px', border: '1px dashed #8b7ee8', borderRadius: 8, color: '#5f4ed1', cursor: 'pointer', fontWeight: 700 }}>
                    <FileCode2 size={18} /> Cargar archivo .html
                    <input type="file" accept=".html,.htm,text/html" onChange={handleHtmlUpload} style={{ display: 'none' }} />
                  </label>
                  <textarea
                    required
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={24}
                    spellCheck={false}
                    placeholder="<!doctype html>\n<html>\n  ...\n</html>"
                    style={{ padding: 14, borderRadius: 8, border: '1px solid #d1d5db', font: '13px/1.55 monospace', resize: 'vertical' }}
                  />
                </>
              ) : (
                <RichEditor
                  value={formData.content}
                  onChange={handleQuillChange}
                  placeholder="Escribí el contenido del artículo..."
                />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              <label style={{ fontWeight: 600 }}>Imagen Destacada</label>
              {formData.coverImage ? (
                <div style={{ position: 'relative', width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', border: '1px solid #eee' }}>
                  <img src={formData.coverImage} alt="Portada" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, coverImage: '' }))}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'white', display: 'flex' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, height: 160, border: '2px dashed #d0c9ff', borderRadius: 12, cursor: 'pointer', color: '#7c6fe0', fontWeight: 600, background: '#faf9ff' }}>
                  <Upload size={28} />
                  {uploading ? 'Subiendo...' : 'Hacé clic para subir imagen'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <label style={{ fontWeight: 600 }}>Video (YouTube o Vimeo) <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.85rem' }}>opcional</span></label>
              <input
                type="text"
                name="videoUrl"
                placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                value={formData.videoUrl}
                onChange={handleChange}
                style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input
                type="checkbox"
                name="showCoverImage"
                id="showCoverImage"
                checked={formData.showCoverImage}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="showCoverImage" style={{ fontWeight: 600, cursor: 'pointer' }}>Mostrar imagen destacada en la noticia</label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input
                type="checkbox"
                name="published"
                id="published"
                checked={formData.published}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="published" style={{ fontWeight: 600, cursor: 'pointer' }}>Publicar inmediatamente</label>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
