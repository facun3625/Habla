'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader } from 'lucide-react';
import styles from './login.module.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Email o contraseña incorrectos.');
        setLoading(false);
        return;
      }
      const meRes = await fetch('/api/auth/me');
      const me = await meRes.json();
      if (me?.role !== 'ADMIN') {
        setError('No tenés permisos de administrador.');
        await fetch('/api/auth/logout', { method: 'POST' });
        setLoading(false);
        return;
      }
      window.location.href = '/admin/courses';
    } catch {
      setError('Error de conexión.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left decorative panel */}
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.logo}>
            <Image src="/logo.png" alt="Hablapraxia" width={220} height={55} style={{ objectFit: 'contain' }} />
          </div>
          <h2 className={styles.panelTitle}>Panel de Administración</h2>
          <p className={styles.panelDesc}>
            Gestioná tu curso, contenidos, alumnas y más desde un solo lugar.
          </p>
          <div className={styles.blobs}>
            <div className={styles.blob1} />
            <div className={styles.blob2} />
            <div className={styles.blob3} />
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Iniciar sesión</h1>
            <p className={styles.formSubtitle}>Ingresá tus credenciales de administrador</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={18} />
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="admin@hablapraxia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Contraseña</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input
                  id="password"
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
              <div className={styles.errorMsg} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
              id="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader size={18} className={styles.spinner} />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className={styles.backLink}>
            <a href="/">← Volver al sitio</a>
          </p>
        </div>
      </div>
    </div>
  );
}
