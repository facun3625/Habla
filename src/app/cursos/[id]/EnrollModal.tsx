'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X, Upload, CheckCircle, Loader, GraduationCap,
  ArrowRight, CreditCard, Mail, Lock, User, Eye, EyeOff,
} from 'lucide-react';
import styles from './enroll.module.css';

type Profile = { id: number; name: string };
type CourseProfile = { profileId: number; requireCredential: boolean; profile: Profile; installmentsEnabled: boolean; maxInstallments: number };
type Price = { id: number; amount: number; currency: string; profile: Profile | null };
type Course = { id: number; title: string; courseProfiles: CourseProfile[]; prices: Price[] };
type Session = { userId?: number; profileId?: number | null; name?: string | null } | null;
type PublicSettings = {
  transfer_ar_enabled?: string;
  transfer_bank?: string; transfer_cbu?: string; transfer_alias?: string;
  transfer_holder?: string; transfer_reference_note?: string;
  transfer_ext_enabled?: string;
  transfer_ext_bank?: string; transfer_ext_cbu?: string;
  transfer_ext_alias?: string; transfer_ext_holder?: string;
  cuotas_ar_enabled?: string;
  cuotas_ext_enabled?: string;
  max_cuotas?: string;
  cuotas_due_day?: string;
};

type Step = 'auth' | 'profile' | 'credential' | 'payment' | 'done';
type AuthView = 'login' | 'register';
type TransferMethod = 'AR' | 'EXT' | null;

interface Props {
  course: Course;
  session: Session;
  onClose: () => void;
  onSuccess: (newSession?: Session) => void;
}

export default function EnrollModal({ course, session: initialSession, onClose, onSuccess }: Props) {
  const [session, setSession] = useState<Session>(initialSession);
  const [step, setStep] = useState<Step>(() => {
    if (!initialSession) return 'auth';
    if (initialSession.profileId) {
      const cp = course.courseProfiles.find(c => c.profileId === initialSession.profileId);
      if (cp) return 'profile'; // still show profile step so user confirms
    }
    return 'profile';
  });

  // Auth state
  const [authView, setAuthView] = useState<AuthView>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Profile state — pre-select if session has matching profile
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(() => {
    if (initialSession?.profileId) return initialSession.profileId;
    return null;
  });

  // Derived: available profiles come from prices (same source as "Planes y precios")
  const profilesFromPrices: Profile[] = Array.from(
    new Map(
      course.prices.filter(p => p.profile).map(p => [p.profile!.id, p.profile!])
    ).values()
  );

  const selectedCp = course.courseProfiles.find(cp => cp.profileId === selectedProfileId) ?? null;

  // Credential state
  const [credentialUrl, setCredentialUrl] = useState<string | null>(null);

  // Payment state
  const [transferMethod, setTransferMethod] = useState<TransferMethod>(null);
  const [paymentMode, setPaymentMode] = useState<'single' | 'cuotas'>('single');
  const [selectedCuotas, setSelectedCuotas] = useState(2);

  // Get both ARS and USD prices for selected profile
  const priceARS = selectedProfileId
    ? (course.prices.find(p => p.profile?.id === selectedProfileId && p.currency === 'ARS') ?? null)
    : null;
  const priceUSD = selectedProfileId
    ? (course.prices.find(p => p.profile?.id === selectedProfileId && p.currency === 'USD') ?? null)
    : null;

  const formatPrice = (p: Price | null) =>
    p ? (p.amount === 0 ? 'Gratuito' : `${p.amount.toLocaleString('es-AR')} ${p.currency}`) : null;

  // Price to show depends on transfer method selected
  const activePrice = transferMethod === 'AR' ? priceARS : transferMethod === 'EXT' ? priceUSD : null;
  const priceLabel = activePrice
    ? formatPrice(activePrice)!
    : [formatPrice(priceARS), formatPrice(priceUSD)].filter(Boolean).join(' / ') || '—';
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cfg, setCfg] = useState<PublicSettings>({});
  const credentialRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings?public=1').then(r => r.json()).then(setCfg).catch(() => {});
  }, []);

  const arEnabled = cfg.transfer_ar_enabled === 'true';
  const extEnabled = cfg.transfer_ext_enabled === 'true';
  const cuotasArEnabled = cfg.cuotas_ar_enabled === 'true';
  const cuotasExtEnabled = cfg.cuotas_ext_enabled === 'true';
  const globalCuotasEnabled = transferMethod === 'AR' ? cuotasArEnabled : transferMethod === 'EXT' ? cuotasExtEnabled : false;
  const profileCuotas = selectedCp as (typeof selectedCp & { installmentsEnabled?: boolean }) | null;
  const cuotasEnabled = globalCuotasEnabled && (profileCuotas?.installmentsEnabled ?? false);
  const maxCuotas = parseInt(cfg.max_cuotas ?? '3');

  useEffect(() => {
    if (step === 'payment') {
      if (arEnabled && !extEnabled) setTransferMethod('AR');
      else if (!arEnabled && extEnabled) setTransferMethod('EXT');
    }
  }, [step, arEnabled, extEnabled]);

  const referenceNote = (cfg.transfer_reference_note ?? 'Nombre completo - Nombre del curso')
    .replace('Nombre completo', session?.name ?? 'Tu nombre')
    .replace('Nombre del curso', course.title);

  // ── Auth ───────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword }),
    });
    const data = await res.json();
    setAuthLoading(false);
    if (!res.ok) { setAuthError(data.error ?? 'Email o contraseña incorrectos.'); return; }
    const me = await fetch('/api/auth/me').then(r => r.ok ? r.json() : null);
    setSession(me);
    if (me?.profileId) setSelectedProfileId(me.profileId);
    setStep('profile');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }),
    });
    const data = await res.json();
    setAuthLoading(false);
    if (!res.ok) { setAuthError(data.error ?? 'Error al registrarse.'); return; }
    const me = await fetch('/api/auth/me').then(r => r.ok ? r.json() : null);
    setSession(me);
    setStep('profile');
  };

  // ── Profile → next ─────────────────────────────────────

  const handleProfileNext = () => {
    if (!selectedProfileId) return;
    setError('');
    if (selectedCp?.requireCredential) {
      setStep('credential');
    } else {
      setStep('payment');
    }
  };

  // ── File upload helper ──────────────────────────────────

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    return data.url ?? null;
  };

  const handleCredentialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    const url = await uploadFile(file);
    setUploading(false);
    if (url) setCredentialUrl(url);
    else setError('Error al subir el archivo. Intentá de nuevo.');
    e.target.value = '';
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !transferMethod) return;
    setUploading(true); setError('');
    const paymentMethod = transferMethod === 'AR' ? 'TRANSFERENCIA_AR' : 'TRANSFERENCIA_EXT';
    try {
      const isCuotas = paymentMode === 'cuotas' && cuotasEnabled;
      const cuotaAmount = activePrice ? activePrice.amount / (isCuotas ? selectedCuotas : 1) : 0;
      const enrollRes = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id, paymentMethod, credentialUrl, selectedProfileId,
          ...(isCuotas ? {
            numInstallments: selectedCuotas,
            amountPerInstallment: cuotaAmount,
            installmentCurrency: activePrice?.currency ?? 'ARS',
            cuotasDueDay: cfg.cuotas_due_day || null,
          } : {}),
        }),
      });
      const enrollData = await enrollRes.json();
      if (!enrollRes.ok) { setError(enrollData.error ?? 'Error al inscribirse.'); setUploading(false); e.target.value = ''; return; }

      const fd = new FormData();
      fd.append('file', file);
      await fetch(`/api/enrollments/${enrollData.id}/receipt`, { method: 'POST', body: fd });

      setUploading(false);
      setStep('done');
    } catch {
      setUploading(false);
      setError('Error de conexión. Intentá de nuevo.');
    }
    e.target.value = '';
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>

        <div className={styles.heading}>
          <CreditCard size={22} />
          <div>
            <h2>Inscribirse</h2>
            <p>{course.title}</p>
          </div>
        </div>

        {/* ── AUTH ─────────────────────────────────────────── */}
        {step === 'auth' && (
          <div className={styles.stepSection}>
            <div className={styles.authTabs}>
              <button
                className={`${styles.authTab} ${authView === 'login' ? styles.authTabActive : ''}`}
                onClick={() => { setAuthView('login'); setAuthError(''); }}
              >
                Iniciar sesión
              </button>
              <button
                className={`${styles.authTab} ${authView === 'register' ? styles.authTabActive : ''}`}
                onClick={() => { setAuthView('register'); setAuthError(''); }}
              >
                Registrarse
              </button>
            </div>

            <a
              href={`/api/auth/google?returnTo=/cursos/${course.id}?enroll=1`}
              className={styles.googleBtn}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {authView === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}
            </a>

            <div className={styles.authDivider}><span>o</span></div>

            {authView === 'login' ? (
              <form onSubmit={handleLogin} className={styles.authForm}>
                <div className={styles.authField}>
                  <Mail size={16} className={styles.authIcon} />
                  <input type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required className={styles.authInput} />
                </div>
                <div className={styles.authField}>
                  <Lock size={16} className={styles.authIcon} />
                  <input type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required className={styles.authInput} />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {authError && <p className={styles.error}>{authError}</p>}
                <button type="submit" className={styles.primaryBtn} disabled={authLoading} style={{ width: '100%' }}>
                  {authLoading ? <><Loader size={15} className={styles.spinner} /> Ingresando...</> : <>Ingresar <ArrowRight size={15} style={{ display: 'inline', verticalAlign: 'middle' }} /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className={styles.authForm}>
                <div className={styles.authField}>
                  <User size={16} className={styles.authIcon} />
                  <input type="text" placeholder="Nombre completo" value={authName} onChange={e => setAuthName(e.target.value)} required className={styles.authInput} />
                </div>
                <div className={styles.authField}>
                  <Mail size={16} className={styles.authIcon} />
                  <input type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required className={styles.authInput} />
                </div>
                <div className={styles.authField}>
                  <Lock size={16} className={styles.authIcon} />
                  <input type={showPass ? 'text' : 'password'} placeholder="Contraseña (mín. 6 caracteres)" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required minLength={6} className={styles.authInput} />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {authError && <p className={styles.error}>{authError}</p>}
                <button type="submit" className={styles.primaryBtn} disabled={authLoading} style={{ width: '100%' }}>
                  {authLoading ? <><Loader size={15} className={styles.spinner} /> Creando cuenta...</> : <>Crear cuenta <ArrowRight size={15} style={{ display: 'inline', verticalAlign: 'middle' }} /></>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── PROFILE ──────────────────────────────────────── */}
        {step === 'profile' && (
          <div className={styles.stepSection}>
            <p className={styles.stepLabel}>¿Cuál es tu perfil?</p>
            <div className={styles.profileGrid}>
              {profilesFromPrices.map(profile => (
                <button
                  key={profile.id}
                  className={`${styles.profileOption} ${selectedProfileId === profile.id ? styles.profileOptionActive : ''}`}
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  {profile.name}
                  {selectedProfileId === profile.id && <CheckCircle size={16} />}
                </button>
              ))}
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button
              className={styles.primaryBtn}
              onClick={handleProfileNext}
              disabled={!selectedProfileId}
              style={{ width: '100%', opacity: selectedProfileId ? 1 : 0.5 }}
            >
              Continuar <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>
        )}

        {/* ── CREDENTIAL ───────────────────────────────────── */}
        {step === 'credential' && (
          <div className={styles.stepSection}>
            <div className={styles.credentialInfo}>
              <GraduationCap size={20} />
              <div>
                <strong>Comprobante de título profesional</strong>
                <p>Este perfil requiere adjuntar una copia de tu título o matrícula.</p>
              </div>
            </div>
            {credentialUrl ? (
              <div className={styles.credentialDone}>
                <CheckCircle size={18} color="#16a34a" />
                <span>Archivo subido correctamente</span>
              </div>
            ) : (
              <div className={styles.uploadArea} onClick={() => credentialRef.current?.click()}>
                <Upload size={28} />
                <p>Subí tu comprobante de título</p>
                <span>JPG, PNG o PDF · Máx 5MB</span>
              </div>
            )}
            <input ref={credentialRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleCredentialUpload} />
            {uploading && <p className={styles.uploading}><Loader size={16} className={styles.spinner} /> Subiendo archivo…</p>}
            {error && <p className={styles.error}>{error}</p>}
            <button
              className={styles.primaryBtn}
              onClick={() => { setError(''); setStep('payment'); }}
              disabled={!credentialUrl}
              style={{ width: '100%', opacity: credentialUrl ? 1 : 0.5 }}
            >
              Continuar <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>
        )}

        {/* ── PAYMENT ──────────────────────────────────────── */}
        {step === 'payment' && (
          <div className={styles.stepSection}>
            <div className={styles.priceTag}>
              {priceLabel}
              {selectedProfileId && profilesFromPrices.find(p => p.id === selectedProfileId) && (
                <span> · {profilesFromPrices.find(p => p.id === selectedProfileId)!.name}</span>
              )}
            </div>

            {arEnabled && extEnabled && !transferMethod && (
              <>
                <p className={styles.stepLabel}>¿Desde dónde vas a transferir?</p>
                <div className={styles.methodGrid}>
                  <button className={styles.methodCard} onClick={() => setTransferMethod('AR')}>
                    <span className={styles.methodFlag}>🇦🇷</span>
                    <strong>Desde Argentina</strong>
                    <span>CBU / Alias</span>
                  </button>
                  <button className={styles.methodCard} onClick={() => setTransferMethod('EXT')}>
                    <span className={styles.methodFlag}>🌍</span>
                    <strong>Desde el exterior</strong>
                    <span>PayPal / SWIFT</span>
                  </button>
                </div>
              </>
            )}

            {transferMethod && (
              <>
                {/* Cuotas selector */}
                {cuotasEnabled && (
                  <div style={{ marginBottom: 16 }}>
                    <p className={styles.stepLabel} style={{ marginBottom: 10 }}>¿Cómo querés pagar?</p>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('single')}
                        style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${paymentMode === 'single' ? '#6c5ce7' : '#e2e8f0'}`, background: paymentMode === 'single' ? '#f5f3ff' : 'white', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', color: paymentMode === 'single' ? '#6c5ce7' : '#64748b' }}
                      >
                        Un solo pago
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('cuotas')}
                        style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${paymentMode === 'cuotas' ? '#6c5ce7' : '#e2e8f0'}`, background: paymentMode === 'cuotas' ? '#f5f3ff' : 'white', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', color: paymentMode === 'cuotas' ? '#6c5ce7' : '#64748b' }}
                      >
                        En cuotas
                      </button>
                    </div>
                    {paymentMode === 'cuotas' && (
                      <div style={{ background: '#faf9ff', border: '1.5px solid #e4dcff', borderRadius: 10, padding: '12px 14px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8 }}>
                          Cantidad de cuotas
                        </label>
                        <select
                          value={selectedCuotas}
                          onChange={e => setSelectedCuotas(Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit' }}
                        >
                          {Array.from({ length: maxCuotas - 1 }, (_, i) => i + 2).map(n => (
                            <option key={n} value={n}>{n} cuotas</option>
                          ))}
                        </select>
                        {activePrice && activePrice.amount > 0 && (
                          <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#6c5ce7', fontWeight: 700 }}>
                            {selectedCuotas} cuotas de {(activePrice.amount / selectedCuotas).toLocaleString('es-AR', { maximumFractionDigits: 0 })} {activePrice.currency}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.bankInfo}>
                  <h3>{transferMethod === 'AR' ? '🇦🇷 Transferencia desde Argentina' : '🌍 Transferencia desde el exterior'}</h3>
                  {transferMethod === 'AR' ? (
                    <>
                      {cfg.transfer_bank && <p>Banco: <strong>{cfg.transfer_bank}</strong></p>}
                      {cfg.transfer_holder && <p>Titular: <strong>{cfg.transfer_holder}</strong></p>}
                      {cfg.transfer_cbu && <p>CBU: <strong>{cfg.transfer_cbu}</strong></p>}
                      {cfg.transfer_alias && <p>Alias: <strong>{cfg.transfer_alias}</strong></p>}
                    </>
                  ) : (
                    <>
                      {cfg.transfer_ext_bank && <p>Entidad: <strong>{cfg.transfer_ext_bank}</strong></p>}
                      {cfg.transfer_ext_holder && <p>Titular: <strong>{cfg.transfer_ext_holder}</strong></p>}
                      {cfg.transfer_ext_cbu && <p>Cuenta / Email: <strong>{cfg.transfer_ext_cbu}</strong></p>}
                      {cfg.transfer_ext_alias && <p>Alias / PayPal.me: <strong>{cfg.transfer_ext_alias}</strong></p>}
                    </>
                  )}
                  <p>Referencia: <strong>{referenceNote}</strong></p>
                </div>
                {arEnabled && extEnabled && (
                  <button className={styles.changeMethod} onClick={() => setTransferMethod(null)}>← Cambiar método</button>
                )}
                <div className={styles.uploadArea} onClick={() => receiptRef.current?.click()}>
                  <Upload size={28} />
                  <p>Subí tu comprobante de transferencia</p>
                  <span>JPG, PNG o PDF · Máx 5MB — obligatorio</span>
                </div>
                <input ref={receiptRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleReceiptUpload} />
              </>
            )}

            {uploading && <p className={styles.uploading}><Loader size={16} className={styles.spinner} /> Procesando…</p>}
            {error && <p className={styles.error}>{error}</p>}
          </div>
        )}

        {/* ── DONE ─────────────────────────────────────────── */}
        {step === 'done' && (
          <div className={styles.doneSection}>
            <CheckCircle size={52} color="#6c5ce7" />
            <h3>¡Inscripción registrada!</h3>
            <p>Recibimos tu comprobante. Revisaremos el pago y te enviaremos un email de confirmación.</p>
            <button className={styles.primaryBtn} onClick={() => onSuccess(session)}>Listo</button>
          </div>
        )}
      </div>
    </div>
  );
}
