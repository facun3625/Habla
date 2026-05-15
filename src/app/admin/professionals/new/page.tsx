'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import styles from '../../courses/courses.module.css'; 
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function NewProfessionalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    cvContent: '',
    imageUrl: '',
    instagram: '',
    active: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        alert('Error al subir imagen');
      }
    } catch (error) {
      console.error(error);
      alert('Error al subir imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin/professionals');
      } else {
        alert('Error al guardar');
      }
    } catch (error) {
      console.error(error);
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Link href="/admin/professionals" className={styles.backLink} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', marginBottom: '10px', textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Volver
            </Link>
            <h2 className={styles.title}>Nueva Profesional</h2>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className={styles.createButton}
          >
            <Save size={20} />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        <div className={styles.tableCard} style={{ padding: '30px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Nombre *</label>
              <input 
                required
                type="text" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Rol (ej: Fonoaudióloga) *</label>
              <input 
                required
                type="text" 
                name="role" 
                value={formData.role}
                onChange={handleChange}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Biografía corta</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Instagram <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.85rem' }}>opcional</span></label>
              <input
                type="text"
                name="instagram"
                placeholder="https://www.instagram.com/usuario"
                value={formData.instagram}
                onChange={handleChange}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>CV Completo (Se mostrará en modal)</label>
              <div className="quill-wrapper" style={{ minHeight: '300px' }}>
                <ReactQuill 
                  theme="snow"
                  value={formData.cvContent}
                  onChange={(content) => setFormData(prev => ({ ...prev, cvContent: content }))}
                  style={{ height: '250px', marginBottom: '40px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Foto</label>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '15px', 
                  backgroundColor: '#f0f0f0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '2px dashed #ddd',
                  position: 'relative'
                }}>
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Preview" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        style={{ 
                          position: 'absolute', 
                          top: '5px', 
                          right: '5px', 
                          background: 'rgba(0,0,0,0.5)', 
                          color: 'white', 
                          borderRadius: '50%', 
                          padding: '2px',
                          display: 'flex'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <Upload size={30} color="#999" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    id="file-upload"
                    style={{ display: 'none' }} 
                  />
                  <label 
                    htmlFor="file-upload"
                    style={{ 
                      padding: '10px 20px', 
                      backgroundColor: 'var(--primary)', 
                      color: 'white', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'inline-block',
                      marginBottom: '10px'
                    }}
                  >
                    Subir Foto
                  </label>
                  <p style={{ fontSize: '13px', color: '#888' }}>
                    O pegá el link directamente:
                  </p>
                  <input 
                    type="text" 
                    name="imageUrl" 
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%', marginTop: '5px' }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input 
                type="checkbox" 
                name="active" 
                id="active"
                checked={formData.active}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="active" style={{ fontWeight: 600, cursor: 'pointer' }}>Activa</label>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
