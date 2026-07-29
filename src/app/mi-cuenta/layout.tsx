'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BookOpen, UserCircle, LogOut, ArrowLeft, Eye } from 'lucide-react';
import styles from './account.module.css';
import QuestionnaireModal from '@/app/components/QuestionnaireModal';
import PendingGateModal from './components/PendingGateModal';
import InstallmentsGateModal from './components/InstallmentsGateModal';
import InstallmentsUploadButton from './components/InstallmentsUploadButton';

type User = {
  id: number; name: string | null; email: string;
  profile: { name: string } | null;
  questionnaireCompleted: boolean;
  impersonating?: boolean;
};

const NAV = [
  { href: '/mi-cuenta', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/mi-cuenta/cursos', label: 'Mis Cursos', icon: BookOpen, exact: false },
  { href: '/mi-cuenta/perfil', label: 'Mi Perfil', icon: UserCircle, exact: false },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [pendingInstallments, setPendingInstallments] = useState<{ courseId: number; title: string }[]>([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) router.push('/');
        else { setUser(d); if (!d.questionnaireCompleted) setShowQuestionnaire(true); }
      });
    fetch('/api/mi-cuenta/installments-gate')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (Array.isArray(d?.courses)) setPendingInstallments(d.courses); })
      .catch(() => {});
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const stopImpersonating = async () => {
    await fetch('/api/auth/stop-impersonation', { method: 'POST' });
    window.location.href = '/admin/users';
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (!user) return null;

  return (
    <div className={styles.shell} style={user.impersonating ? { paddingTop: 44 } : undefined}>
      {user.impersonating && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
            background: '#1e1b4b', color: 'white', padding: '10px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: '0.85rem', fontWeight: 600,
          }}
        >
          <Eye size={16} />
          Estás viendo la cuenta de {user.name ?? user.email} como administrador.
          <button
            onClick={stopImpersonating}
            style={{ background: '#6c5ce7', border: 'none', color: 'white', borderRadius: 8, padding: '5px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Volver a admin
          </button>
        </div>
      )}
      {showQuestionnaire && (
        <QuestionnaireModal
          initialName={user.name}
          onDone={(updatedName) => { setUser(u => u ? { ...u, name: updatedName, questionnaireCompleted: true } : u); setShowQuestionnaire(false); }}
          onClose={() => setShowQuestionnaire(false)}
        />
      )}
      {!showQuestionnaire && <InstallmentsGateModal />}
      {!showQuestionnaire && <PendingGateModal />}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.avatar}>{initials}</div>
          <p className={styles.sidebarName}>{user.name ?? user.email}</p>
          {user.profile && <span className={styles.sidebarProfile}>{user.profile.name}</span>}
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive(href, exact) ? styles.navItemActive : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          {pendingInstallments.length > 0 && (
            <InstallmentsUploadButton courses={pendingInstallments} className={styles.navItemAlert} />
          )}
        </nav>

        <div className={styles.navFooter}>
          <Link href="/" className={styles.navFooterLink}>
            <ArrowLeft size={16} /> Volver al sitio
          </Link>
          <button className={styles.navFooterLink} onClick={logout} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
