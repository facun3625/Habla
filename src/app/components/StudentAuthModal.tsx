'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader, X, CheckCircle } from 'lucide-react';
import styles from '../admin/components/LoginModal.module.css';
import modalStyles from './StudentAuthModal.module.css';

const REMEMBER_KEY = 'hp_remember_email';

type View = 'login' | 'register' | 'forgot' | 'forgot-sent';
type Profile = { id: number; name: string; description: string | null };

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  returnTo?: string;
}

export default function StudentAuthModal({ onClose, onSuccess, returnTo }: Props) {
  const googleHref = `/api/auth/google${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profileId, setProfileId] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) { setEmail(saved); setRememberMe(true); }
    fetch('/api/profiles').then((r) => r.json()).then(setProfiles).catch(() => {});
  }, []);

  const reset = (v: View) => { setView(v); setError(''); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Email o contraseña incorrectos.'); return; }
    onSuccess();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, profileId: profileId ? Number(profileId) : null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Error al registrarse.'); return; }
    onSuccess();
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setView('forgot-sent');
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        <div className={styles.logo}>
          <Image src="/logo.png" alt="Hablapraxia" width={160} height={40} style={{ objectFit: 'contain' }} />
        </div>

        {/* Tabs */}
        {(view === 'login' || view === 'register') && (
          <div className={modalStyles.tabs}>
            <button className={`${modalStyles.tab} ${view === 'login' ? modalStyles.tabActive : ''}`} onClick={() => reset('login')}>
              Iniciar sesión
            </button>
            <button className={`${modalStyles.tab} ${view === 'register' ? modalStyles.tabActive : ''}`} onClick={() => reset('register')}>
              Registrarse
            </button>
          </div>
        )}

        {/* LOGIN */}
        {view === 'login' && (
          <>
            <a href={googleHref} className={modalStyles.googleBtn}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              Continuar con Google
            </a>

            <div className={modalStyles.divider}><span>o</span></div>

            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={18} />
                  <input type="email" className={styles.input} placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Contraseña</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={18} />
                  <input type={showPassword ? 'text' : 'password'} className={styles.input} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className={modalStyles.rememberRow}>
                <label className={modalStyles.rememberLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className={modalStyles.rememberCheck}
                  />
                  Recordar usuario
                </label>
                <button type="button" className={modalStyles.forgotLink} onClick={() => reset('forgot')}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? <><Loader size={18} className={styles.spinner} /> Ingresando...</> : <>Ingresar <ArrowRight size={18} /></>}
              </button>
            </form>
          </>
        )}

        {/* REGISTER */}
        {view === 'register' && (
          <>
            <a href={googleHref} className={modalStyles.googleBtn}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              Registrarse con Google
            </a>

            <div className={modalStyles.divider}><span>o</span></div>

            <form className={styles.form} onSubmit={handleRegister}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre completo</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={18} />
                  <input type="text" className={styles.input} placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={18} />
                  <input type="email" className={styles.input} placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Contraseña</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={18} />
                  <input type={showPassword ? 'text' : 'password'} className={styles.input} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {profiles.length > 0 && (
                <div className={styles.field}>
                  <label className={styles.label}>¿Cuál es tu perfil?</label>
                  <select
                    className={styles.input}
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    required
                  >
                    <option value="">Seleccioná tu perfil…</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.description ? ` — ${p.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? <><Loader size={18} className={styles.spinner} /> Creando cuenta...</> : <>Crear cuenta <ArrowRight size={18} /></>}
              </button>
            </form>
          </>
        )}

        {/* FORGOT */}
        {view === 'forgot' && (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Recuperar contraseña</h1>
              <p className={styles.subtitle}>Te enviamos un link por email</p>
            </div>
            <form className={styles.form} onSubmit={handleForgot}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={18} />
                  <input type="email" className={styles.input} placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                </div>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? <><Loader size={18} className={styles.spinner} /> Enviando...</> : <>Enviar link <ArrowRight size={18} /></>}
              </button>
              <button type="button" className={modalStyles.forgotLink} onClick={() => reset('login')}>
                ← Volver al inicio de sesión
              </button>
            </form>
          </>
        )}

        {/* FORGOT SENT */}
        {view === 'forgot-sent' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <CheckCircle size={48} color="#6c5ce7" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h2 className={styles.title}>¡Email enviado!</h2>
            <p className={styles.subtitle} style={{ marginTop: 8 }}>
              Revisá tu bandeja de entrada y seguí el link para restablecer tu contraseña.
            </p>
            <button type="button" className={modalStyles.forgotLink} style={{ marginTop: 24 }} onClick={() => reset('login')}>
              ← Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
