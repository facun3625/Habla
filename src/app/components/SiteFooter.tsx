'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Send } from 'lucide-react';
import styles from '../page.module.css';

export default function SiteFooter() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 5000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al suscribirse');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer id="contacto" className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerColumn}>
          <div className={styles.footerLogoContainer}>
            <Image src="/logo.png" alt="Hablapraxia" width={180} height={60} style={{ objectFit: 'contain' }} />
          </div>
          <p className={styles.footerText}>
            Ayudando a tu hijo/a a desarrollar su capacidad de habla y comunicación de manera efectiva y divertida.
          </p>
        </div>
        <div className={styles.footerColumn}>
          <h4 className={styles.footerTitle}>Enlaces Rápidos</h4>
          <Link href="/" className={styles.footerLink}>Inicio</Link>
          <Link href="/#nosotras" className={styles.footerLink}>Nosotras</Link>
          <Link href="/cursos" className={styles.footerLink}>Cursos</Link>
          <Link href="/blog" className={styles.footerLink}>Publicaciones</Link>
        </div>
        <div className={styles.footerColumn}>
          <h4 className={styles.footerTitle}>Contacto</h4>
          <p className={styles.footerText}>hola@hablapraxia.com</p>
          <div className={styles.footerSocials}>
            <a href="#" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
          </div>
        </div>
        <div className={styles.footerColumn}>
          <h4 className={styles.footerTitle}>Suscribite</h4>
          <p className={styles.footerText} style={{ marginBottom: '15px' }}>
            Recibí información sobre nuevos cursos y novedades.
          </p>
          {subscribed ? (
            <div style={{ background: 'rgba(0, 223, 130, 0.1)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(0, 223, 130, 0.3)' }}>
              <p style={{ color: 'rgb(0, 223, 130)', fontWeight: 600, margin: 0 }}>¡Gracias por suscribirte!</p>
            </div>
          ) : (
            <>
              <form className={styles.subscribeForm} onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="Tu email"
                  className={styles.subscribeInput}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
                <button type="submit" className={styles.subscribeBtn} disabled={submitting}>
                  {submitting ? '...' : <Send size={18} color="var(--primary)" />}
                </button>
              </form>
              {error && <p style={{ color: '#ff4d4f', fontSize: '13px', marginTop: '10px', fontWeight: 500 }}>{error}</p>}
            </>
          )}
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} Hablapraxia. Todos los derechos reservados.</p>
        <p className={styles.developer}>
          Desarrollado por <a href="https://kubbo.com.ar" target="_blank" rel="noopener noreferrer">Kubbo</a>
        </p>
      </div>
    </footer>
  );
}
