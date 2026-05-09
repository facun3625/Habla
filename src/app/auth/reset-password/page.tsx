'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';
import styles from '../../admin/components/LoginModal.module.css';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) router.replace('/');
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setDone(true);
    setTimeout(() => router.push('/'), 2000);
  };

  return (
    <div className={styles.overlay} style={{ position: 'fixed' }}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="Hablapraxia" width={160} height={40} style={{ objectFit: 'contain' }} />
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} color="#6c5ce7" style={{ margin: '0 auto 16px' }} />
            <h2 className={styles.title}>¡Contraseña actualizada!</h2>
            <p className={styles.subtitle}>Redirigiendo...</p>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Nueva contraseña</h1>
              <p className={styles.subtitle}>Ingresá tu nueva contraseña</p>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Nueva contraseña</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={18} />
                  <input
                    type={show ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className={styles.eyeButton} onClick={() => setShow(!show)}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Confirmar contraseña</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={18} />
                  <input
                    type={show ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Repetí la contraseña"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? <><Loader size={18} className={styles.spinner} /> Guardando...</> : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
