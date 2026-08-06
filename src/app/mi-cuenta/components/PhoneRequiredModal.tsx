'use client';

import { useState } from 'react';
import { Phone, Loader } from 'lucide-react';
import styles from './PendingGateModal.module.css';
import loginStyles from '@/app/admin/components/LoginModal.module.css';

interface Props {
  onDone: () => void;
}

export default function PhoneRequiredModal({ onDone }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 6) {
      setError('Ingresá un número de teléfono válido.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await fetch('/api/mi-cuenta/update-phone', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Error al guardar el teléfono.');
      return;
    }
    onDone();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Phone size={22} />
          </div>
          <div>
            <p className={styles.title}>Completá tu número de teléfono</p>
            <p className={styles.subtitle}>
              Necesitamos tu teléfono para poder contactarte ante cualquier novedad sobre tus cursos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={loginStyles.field}>
            <label className={loginStyles.label}>Teléfono</label>
            <div className={loginStyles.inputWrapper}>
              <Phone className={loginStyles.inputIcon} size={18} />
              <input
                type="tel"
                className={loginStyles.input}
                placeholder="+54 9 11 1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          {error && <div className={loginStyles.error}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 16,
              width: '100%',
              background: '#6c5ce7',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '13px 20px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: loading ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</> : 'Guardar teléfono'}
          </button>
        </form>
      </div>
    </div>
  );
}
