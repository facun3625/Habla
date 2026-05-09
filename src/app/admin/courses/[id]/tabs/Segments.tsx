'use client';

import { useState, useEffect } from 'react';
import { Plus, Target, Trash2 } from 'lucide-react';
import styles from '../courseAdmin.module.css';

type Segment = { id: number; name: string; _count: { enrollments: number } };

export default function Segments({ courseId }: { courseId: string }) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/segments`)
      .then((r) => r.json())
      .then(setSegments)
      .finally(() => setLoading(false));
  }, [courseId]);

  const addSegment = async () => {
    if (!newName.trim()) return;
    const res = await fetch(`/api/courses/${courseId}/segments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
    const s = await res.json();
    setSegments((prev) => [...prev, s]);
    setNewName('');
    setAdding(false);
  };

  const deleteSegment = async (id: number) => {
    await fetch(`/api/courses/${courseId}/segments/${id}`, { method: 'DELETE' });
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <p style={{ padding: '1rem', color: '#888' }}>Cargando...</p>;

  return (
    <div className={styles.segmentsTab}>
      <div className={styles.tabHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Segmentos y Perfiles</h3>
          <p className={styles.sectionDesc}>Definí categorías de alumnos para aplicar reglas de acceso y precios.</p>
        </div>
        <button className={styles.addBtnSmall} onClick={() => setAdding(true)}>
          <Plus size={18} /> Nuevo Segmento
        </button>
      </div>

      <div className={styles.listContainer}>
        {segments.map((s) => (
          <div key={s.id} className={styles.listItem}>
            <div className={styles.itemMain}>
              <div className={styles.segmentIcon}><Target size={20} /></div>
              <div className={styles.itemInfo}>
                <h4>{s.name}</h4>
                <p>{s._count.enrollments} inscriptos en este perfil</p>
              </div>
            </div>
            <div className={styles.itemActions}>
              <button title="Eliminar" className={styles.actionBtnDelete} onClick={() => deleteSegment(s.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}

        {adding ? (
          <div className={styles.listItem} style={{ gap: 8 }}>
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSegment()} className={styles.input} placeholder="Nombre del segmento" style={{ flex: 1 }} />
            <button className={styles.addBtnSmall} onClick={addSegment}>Crear</button>
            <button className={styles.actionBtn} onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        ) : (
          <button className={styles.addBtn} onClick={() => setAdding(true)}>
            <Plus size={20} /> Crear segmento personalizado
          </button>
        )}
      </div>
    </div>
  );
}
