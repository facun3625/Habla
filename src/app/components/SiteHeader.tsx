'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, ChevronDown, LayoutDashboard, LogOut, UserCircle, BookOpen } from 'lucide-react';
import styles from '../page.module.css';
import headerStyles from './SiteHeader.module.css';
import StudentAuthModal from './StudentAuthModal';

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function smoothScrollToId(id: string, duration = 900) {
  const startY = window.scrollY;
  let targetY = 0;
  if (id !== '__top__') {
    const target = document.getElementById(id);
    if (!target) return;
    const stickyEl = document.querySelector('[class*="stickyWrap"]') as HTMLElement | null;
    const headerOffset = stickyEl ? stickyEl.offsetHeight : 80;
    targetY = target.getBoundingClientRect().top + startY - headerOffset;
  }
  const distance = targetY - startY;
  let startTime: number | null = null;

  const step = (ts: number) => {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutQuart(progress));
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function switchLanguage(lang: 'es' | 'en') {
  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (!select) return;
  select.value = lang;
  select.dispatchEvent(new Event('change'));
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>('es');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [session, setSession] = useState<{ name?: string | null; role?: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('es-ES', options));

    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setSession(data))
      .catch(() => setSession(null));
  }, []);

  const handleAuthSuccess = async () => {
    setShowAuth(false);
    const me = await fetch('/api/auth/me').then(r => r.ok ? r.json() : null);
    setSession(me);
    if (me?.role === 'ADMIN') {
      window.location.href = '/admin/courses';
    } else {
      window.location.href = '/mi-cuenta';
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    setShowDropdown(false);
  };

  const authButton = session ? (
    <div className={headerStyles.userMenu} ref={dropdownRef}>
      <button className={`${styles.adminLink} ${headerStyles.userBtn}`} onClick={() => setShowDropdown(v => !v)}>
        <UserCircle size={16} />
        {session.name || 'Mi cuenta'}
        <ChevronDown size={14} className={showDropdown ? headerStyles.chevronOpen : ''} />
      </button>
      {showDropdown && (
        <div className={headerStyles.dropdown}>
          <div className={headerStyles.dropdownHeader}>
            <p className={headerStyles.dropdownName}>{session.name || 'Mi cuenta'}</p>
          </div>
          {session.role !== 'ADMIN' && (
            <Link href="/mi-cuenta" className={headerStyles.dropdownItem} onClick={() => setShowDropdown(false)}>
              <BookOpen size={15} />
              Mi cuenta
            </Link>
          )}
          {session.role === 'ADMIN' && (
            <Link href="/admin/courses" className={headerStyles.dropdownItem} onClick={() => setShowDropdown(false)}>
              <LayoutDashboard size={15} />
              Panel de administración
            </Link>
          )}
          <button className={`${headerStyles.dropdownItem} ${headerStyles.dropdownLogout}`} onClick={handleLogout}>
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  ) : (
    <button className={styles.adminLink} onClick={() => setShowAuth(true)}>
      Ingresar
    </button>
  );

  return (
    <>
      <div className={headerStyles.stickyWrap}>
      <div className={styles.topHeader}>
        <div className={styles.topHeaderInner}>
          <div className={styles.dateDisplay}>{currentDate}</div>
          <div className={styles.socialAndLang}>
            <div className={styles.socialIcons}>
              <a href="#" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            </div>
            <div className={`${styles.langSelector} notranslate`} translate="no">
              <span
                className={currentLang === 'es' ? styles.activeLang : styles.inactiveLang}
                onClick={() => { switchLanguage('es'); setCurrentLang('es'); }}
              >ES</span>
              <span className={styles.langDivider}>|</span>
              <span
                className={currentLang === 'en' ? styles.activeLang : styles.inactiveLang}
                onClick={() => { switchLanguage('en'); setCurrentLang('en'); }}
              >EN</span>
            </div>
          </div>
        </div>
      </div>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={`${styles.logo} notranslate`} translate="no">
            <Link href="/">
              <Image src="/logo.png" alt="Hablapraxia Logo" width={200} height={50} style={{ objectFit: 'contain' }} />
            </Link>
          </div>

          <button className={styles.mobileMenuBtn} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
            <a
              href="/"
              className={styles.navLink}
              onClick={(e) => {
                setIsMenuOpen(false);
                if (pathname === '/') {
                  e.preventDefault();
                  smoothScrollToId('__top__', 700);
                }
              }}
            >Inicio</a>
            {([
              { id: 'cursos',   label: 'Próximos Cursos' },
              { id: 'nosotras', label: 'Nosotras' },
              { id: 'contacto', label: 'Contacto' },
            ] as const).map(({ id, label }) => (
              <a
                key={id}
                href={`/#${id}`}
                className={styles.navLink}
                onClick={(e) => {
                  setIsMenuOpen(false);
                  if (pathname === '/') {
                    e.preventDefault();
                    smoothScrollToId(id);
                  }
                }}
              >
                {label}
              </a>
            ))}
            <Link href="/blog" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Blog</Link>
            <div className={styles.mobileActions}>
              <Link href="/cursos" className={styles.primaryButton} onClick={() => setIsMenuOpen(false)}><ShoppingCart size={18} />Ver Cursos</Link>
              {authButton}
            </div>
          </nav>

          <div className={styles.headerActions}>
            <Link href="/cursos" className={styles.primaryButton}><ShoppingCart size={18} />Ver Cursos</Link>
            {authButton}
          </div>
        </div>
      </header>
      </div>

      {showAuth && (
        <StudentAuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />
      )}
    </>
  );
}
