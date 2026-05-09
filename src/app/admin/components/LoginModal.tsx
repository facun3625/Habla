'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader, X } from 'lucide-react';
import styles from './LoginModal.module.css';

type User = { email: string; name?: string };

interface Props {
  onSuccess: (user: User) => void;
}

export default function LoginModal({ onSuccess }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Error al iniciar sesión.');
      return;
    }

    onSuccess({ email: data.email, name: data.name });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={() => router.push('/')} aria-label="Cerrar">
          <X size={20} />
        </button>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="Hablapraxia" width={160} height={40} style={{ objectFit: 'contain' }} />
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.subtitle}>Ingresá tus credenciales de administrador</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="modal-email">Email</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={18} />
              <input
                id="modal-email"
                type="email"
                className={styles.input}
                placeholder="admin@hablapraxia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="modal-password">Contraseña</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input
                id="modal-password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar/ocultar contraseña"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error} role="alert">{error}</div>
          )}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? (
              <><Loader size={18} className={styles.spinner} /> Ingresando...</>
            ) : (
              <>Ingresar <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
