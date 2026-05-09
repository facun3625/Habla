'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';

export default function NewCoursePage() {
  const router = useRouter();
  const created = useRef(false);

  useEffect(() => {
    if (created.current) return;
    created.current = true;

    fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nuevo Curso', status: 'BORRADOR' }),
    })
      .then((r) => r.json())
      .then((course) => router.replace(`/admin/courses/${course.id}`))
      .catch(() => router.replace('/admin/courses'));
  }, [router]);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e8e4ff', borderTopColor: '#6c5ce7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#7f8fa6', fontWeight: 600 }}>Creando curso...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AdminLayout>
  );
}
