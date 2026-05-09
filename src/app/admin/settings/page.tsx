'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Save, Eye, EyeOff, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import styles from './settings.module.css';

type Settings = Record<string, string>;

const DEFAULTS: Settings = {
  // Mercado Pago
  mp_enabled: 'false',
  mp_access_token: '',
  mp_public_key: '',
  mp_mode: 'sandbox',
  // PayPal
  paypal_enabled: 'false',
  paypal_client_id: '',
  paypal_secret: '',
  paypal_mode: 'sandbox',
  // Transferencia Argentina (Mercado Pago)
  transfer_ar_enabled: 'false',
  transfer_bank: '',
  transfer_cbu: '',
  transfer_alias: '',
  transfer_holder: '',
  transfer_reference_note: 'Nombre completo - Nombre del curso',
  // Transferencia Exterior (PayPal)
  transfer_ext_enabled: 'false',
  transfer_ext_bank: '',
  transfer_ext_cbu: '',
  transfer_ext_alias: '',
  transfer_ext_holder: '',
  // SMTP
  smtp_host: '',
  smtp_port: '587',
  smtp_secure: 'false',
  smtp_user: '',
  smtp_pass: '',
  smtp_from_email: '',
  smtp_from_name: 'Hablapraxia',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setSettings({ ...DEFAULTS, ...data }))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setSettings((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const toggle = (key: string) =>
    setSettings((prev) => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }));

  const toggleShow = (key: string) => setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError('Error al guardar. Intentá de nuevo.');
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const SecretInput = ({ id, placeholder }: { id: string; placeholder?: string }) => (
    <div className={styles.secretWrapper}>
      <input
        type={showSecrets[id] ? 'text' : 'password'}
        className={styles.input}
        value={settings[id] ?? ''}
        onChange={set(id)}
        placeholder={placeholder ?? '••••••••••••'}
      />
      <button type="button" className={styles.eyeBtn} onClick={() => toggleShow(id)}>
        {showSecrets[id] ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  const Toggle = ({ id }: { id: string }) => {
    const on = settings[id] === 'true';
    return (
      <button
        type="button"
        className={`${styles.toggleBtn} ${on ? styles.toggleOn : ''}`}
        onClick={() => toggle(id)}
        aria-label={on ? 'Desactivar' : 'Activar'}
      >
        <span className={styles.toggleThumb} />
        <span className={styles.toggleLabel}>{on ? 'Activo' : 'Inactivo'}</span>
      </button>
    );
  };

  if (loading) return <AdminLayout><p style={{ padding: '2rem', color: '#888' }}>Cargando...</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Configuración</h2>
            <p className={styles.subtitle}>Medios de pago, transferencias y datos de email.</p>
          </div>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : saved ? <><CheckCircle size={18} /> Guardado</> : <><Save size={18} /> Guardar cambios</>}
          </button>
        </div>

        {/* ── MEDIOS DE PAGO ── */}
        <div className={styles.groupLabel}>Medios de Pago</div>

        {/* Mercado Pago */}
        <section className={`${styles.section} ${settings.mp_enabled !== 'true' ? styles.sectionOff : ''}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#e3f2fd' }}>
              <svg width="24" height="24" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="16" fill="#00b1ea"/>
                <text x="8" y="22" fontSize="13" fontWeight="bold" fill="white">MP</text>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h3>Mercado Pago</h3>
              <p>Pagos con tarjeta, débito y efectivo en Argentina.</p>
            </div>
            <Toggle id="mp_enabled" />
          </div>

          {settings.mp_enabled === 'true' && (
            <>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label>Access Token <span className={styles.badge}>Secreto</span></label>
                  <SecretInput id="mp_access_token" placeholder="APP_USR-..." />
                  <span className={styles.hint}>MP Developers → Tus credenciales → Access Token</span>
                </div>
                <div className={styles.field}>
                  <label>Public Key <span className={styles.badgePublic}>Público</span></label>
                  <input type="text" className={styles.input} value={settings.mp_public_key} onChange={set('mp_public_key')} placeholder="APP_USR-..." />
                  <span className={styles.hint}>MP Developers → Tus credenciales → Public Key</span>
                </div>
                <div className={styles.field}>
                  <label>Modo</label>
                  <select className={styles.input} value={settings.mp_mode} onChange={set('mp_mode')}>
                    <option value="sandbox">Sandbox (pruebas)</option>
                    <option value="production">Producción</option>
                  </select>
                </div>
              </div>
              <a href="https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/requirements" target="_blank" rel="noreferrer" className={styles.docsLink}>
                Ver documentación de MP →
              </a>
            </>
          )}
        </section>

        {/* PayPal */}
        <section className={`${styles.section} ${settings.paypal_enabled !== 'true' ? styles.sectionOff : ''}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#eef2ff' }}>
              <svg width="24" height="24" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="16" fill="#003087"/>
                <text x="6" y="22" fontSize="12" fontWeight="bold" fill="white">PP</text>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h3>PayPal</h3>
              <p>Pagos internacionales en USD.</p>
            </div>
            <Toggle id="paypal_enabled" />
          </div>

          {settings.paypal_enabled === 'true' && (
            <>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label>Client ID <span className={styles.badgePublic}>Público</span></label>
                  <input type="text" className={styles.input} value={settings.paypal_client_id} onChange={set('paypal_client_id')} placeholder="AXxx..." />
                  <span className={styles.hint}>developer.paypal.com → Apps → Tu app → Client ID</span>
                </div>
                <div className={styles.field}>
                  <label>Client Secret <span className={styles.badge}>Secreto</span></label>
                  <SecretInput id="paypal_secret" placeholder="EXxx..." />
                  <span className={styles.hint}>developer.paypal.com → Apps → Tu app → Secret</span>
                </div>
                <div className={styles.field}>
                  <label>Modo</label>
                  <select className={styles.input} value={settings.paypal_mode} onChange={set('paypal_mode')}>
                    <option value="sandbox">Sandbox (pruebas)</option>
                    <option value="live">Live (producción)</option>
                  </select>
                </div>
              </div>
              <a href="https://developer.paypal.com/studio/checkout/standard/integrate" target="_blank" rel="noreferrer" className={styles.docsLink}>
                Ver documentación de PayPal →
              </a>
            </>
          )}
        </section>

        {/* ── TRANSFERENCIAS ── */}
        <div className={styles.groupLabel}>Transferencias</div>

        {/* Transferencia Argentina → Mercado Pago */}
        <section className={`${styles.section} ${settings.transfer_ar_enabled !== 'true' ? styles.sectionOff : ''}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#e8f5e9' }}>
              <span style={{ fontSize: '1.5rem' }}>🇦🇷</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3>Transferencia desde Argentina</h3>
              <p>Depósito bancario vía CBU / Alias de Mercado Pago.</p>
            </div>
            <Toggle id="transfer_ar_enabled" />
          </div>

          {settings.transfer_ar_enabled === 'true' && (
            <div className={styles.fields}>
              <div className={styles.field}>
                <label>Banco</label>
                <input type="text" className={styles.input} value={settings.transfer_bank} onChange={set('transfer_bank')} placeholder="Banco Nación / Mercado Pago" />
              </div>
              <div className={styles.field}>
                <label>Titular</label>
                <input type="text" className={styles.input} value={settings.transfer_holder} onChange={set('transfer_holder')} placeholder="Nombre Apellido" />
              </div>
              <div className={styles.field}>
                <label>CBU</label>
                <input type="text" className={styles.input} value={settings.transfer_cbu} onChange={set('transfer_cbu')} placeholder="0110000000000000000000" />
              </div>
              <div className={styles.field}>
                <label>Alias</label>
                <input type="text" className={styles.input} value={settings.transfer_alias} onChange={set('transfer_alias')} placeholder="HABLAPRAXIA.MP" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Nota de referencia</label>
                <input type="text" className={styles.input} value={settings.transfer_reference_note} onChange={set('transfer_reference_note')} placeholder="Nombre completo - Nombre del curso" />
                <span className={styles.hint}>El alumno verá esta instrucción para identificar su pago.</span>
              </div>
            </div>
          )}
        </section>

        {/* Transferencia Exterior → PayPal */}
        <section className={`${styles.section} ${settings.transfer_ext_enabled !== 'true' ? styles.sectionOff : ''}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#eff6ff' }}>
              <span style={{ fontSize: '1.5rem' }}>🌍</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3>Transferencia desde el exterior</h3>
              <p>Depósito internacional vía cuenta PayPal / SWIFT.</p>
            </div>
            <Toggle id="transfer_ext_enabled" />
          </div>

          {settings.transfer_ext_enabled === 'true' && (
            <div className={styles.fields}>
              <div className={styles.field}>
                <label>Banco / Entidad</label>
                <input type="text" className={styles.input} value={settings.transfer_ext_bank} onChange={set('transfer_ext_bank')} placeholder="PayPal / Wise / etc." />
              </div>
              <div className={styles.field}>
                <label>Titular</label>
                <input type="text" className={styles.input} value={settings.transfer_ext_holder} onChange={set('transfer_ext_holder')} placeholder="Nombre Apellido" />
              </div>
              <div className={styles.field}>
                <label>CBU / Cuenta / Email PayPal</label>
                <input type="text" className={styles.input} value={settings.transfer_ext_cbu} onChange={set('transfer_ext_cbu')} placeholder="pagos@hablapraxia.com" />
              </div>
              <div className={styles.field}>
                <label>Alias / PayPal.me</label>
                <input type="text" className={styles.input} value={settings.transfer_ext_alias} onChange={set('transfer_ext_alias')} placeholder="paypal.me/hablapraxia" />
              </div>
            </div>
          )}
        </section>

        {/* ── EMAIL ── */}
        <div className={styles.groupLabel}>Email</div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#f0f9ff' }}>
              <Mail size={22} color="#0284c7" />
            </div>
            <div style={{ flex: 1 }}>
              <h3>Servidor de Email (SMTP)</h3>
              <p>Para notificaciones, recuperación de contraseña y marketing.</p>
            </div>
            <div className={styles.modeToggle}>
              <label>SSL/TLS:</label>
              <select className={styles.selectSmall} value={settings.smtp_secure} onChange={set('smtp_secure')}>
                <option value="false">No (puerto 587)</option>
                <option value="true">Sí (puerto 465)</option>
              </select>
            </div>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label>Host SMTP</label>
              <input type="text" className={styles.input} value={settings.smtp_host} onChange={set('smtp_host')} placeholder="smtp.tudominio.com" />
            </div>
            <div className={styles.field}>
              <label>Puerto</label>
              <input type="text" className={styles.input} value={settings.smtp_port} onChange={set('smtp_port')} placeholder="587" />
            </div>
            <div className={styles.field}>
              <label>Usuario <span className={styles.badge}>Secreto</span></label>
              <input type="text" className={styles.input} value={settings.smtp_user} onChange={set('smtp_user')} placeholder="correo@tudominio.com" />
            </div>
            <div className={styles.field}>
              <label>Contraseña <span className={styles.badge}>Secreto</span></label>
              <SecretInput id="smtp_pass" />
            </div>
            <div className={styles.field}>
              <label>Email remitente <span className={styles.badgePublic}>Público</span></label>
              <input type="text" className={styles.input} value={settings.smtp_from_email} onChange={set('smtp_from_email')} placeholder="noreply@tudominio.com" />
            </div>
            <div className={styles.field}>
              <label>Nombre remitente <span className={styles.badgePublic}>Público</span></label>
              <input type="text" className={styles.input} value={settings.smtp_from_name} onChange={set('smtp_from_name')} placeholder="Hablapraxia" />
            </div>
          </div>

          <span className={styles.hint}>
            Si usás Gmail: activá &quot;Contraseñas de aplicaciones&quot; y usá esa como contraseña.
          </span>
        </section>

        <div className={styles.footer}>
          {saved && (
            <div className={styles.toastSuccess}>
              <CheckCircle size={16} /> Configuración guardada
            </div>
          )}
          {error && (
            <div className={styles.toastError}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : saved ? <><CheckCircle size={18} /> Guardado</> : <><Save size={18} /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
