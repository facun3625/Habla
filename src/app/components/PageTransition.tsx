'use client';

import { usePathname } from 'next/navigation';
import { useRef, useEffect } from 'react';
import styles from './PageTransition.module.css';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clear = () => {
      el.style.animation = 'none';
      el.style.transform = 'none';
      el.style.opacity = '1';
    };
    el.addEventListener('animationend', clear, { once: true });
    return () => el.removeEventListener('animationend', clear);
  }, [pathname]);

  return (
    <div key={pathname} ref={ref} className={styles.wrap}>
      {children}
    </div>
  );
}
