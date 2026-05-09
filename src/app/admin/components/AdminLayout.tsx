'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  ChevronRight,
  FileText,
  ExternalLink,
  Megaphone
} from 'lucide-react';
import Image from 'next/image';
import styles from './AdminLayout.module.css';
import LoginModal from './LoginModal';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';
type User = { email: string; name?: string };

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error('unauthorized');
      })
      .then((data) => {
        setUser(data);
        setAuthState('authenticated');
      })
      .catch(() => setAuthState('unauthenticated'));
  }, []);

  const handleLoginSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setAuthState('authenticated');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setAuthState('unauthenticated');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Cursos', href: '/admin/courses', icon: BookOpen },
    { name: 'Perfiles', href: '/admin/profiles', icon: Users },
    { name: 'Nosotras', href: '/admin/professionals', icon: Users },
    { name: 'Blog', href: '/admin/blog', icon: FileText },
    { name: 'Suscriptores', href: '/admin/subscribers', icon: Bell },
    { name: 'Usuarios', href: '/admin/users', icon: Users },
    { name: 'Marketing', href: '/admin/marketing', icon: Megaphone },
    { name: 'Configuración', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className={styles.container}>
      {/* Auth overlay */}
      {authState === 'checking' && <div className={styles.authChecking} />}
      {authState === 'unauthenticated' && <LoginModal onSuccess={handleLoginSuccess} />}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <Image src="/logo.png" alt="Hablapraxia" width={160} height={40} style={{ objectFit: 'contain' }} />
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
                {isActive && <ChevronRight size={16} className={styles.activeChevron} />}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.logoutButton} style={{ textDecoration: 'none', color: 'var(--text-light)' }}>
            <ExternalLink size={20} />
            <span>Volver al sitio</span>
          </Link>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <button className={styles.mobileMenuBtn}>
              <Menu size={24} />
            </button>
            <h1>Administración</h1>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.searchBar}>
              <Search size={18} />
              <input type="text" placeholder="Buscar..." />
            </div>
            <button className={styles.iconButton}>
              <Bell size={20} />
              <span className={styles.notificationBadge} />
            </button>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name ?? 'Administrador'}</span>
                <span className={styles.userRole}>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <section className={styles.content}>
          {children}
        </section>
      </main>
    </div>
  );
}
