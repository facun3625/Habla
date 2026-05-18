'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { RefreshCw } from 'lucide-react';
import styles from './analytics.module.css';

type Stats = {
  total: number;
  last30: number;
  last7: number;
  today: number;
  byDay: { date: string; count: number }[];
  topPages: { path: string; count: number }[];
};

const PAGE_LABELS: Record<string, string> = {
  '/': 'Inicio',
  '/cursos': 'Cursos',
  '/blog': 'Blog',
  '/mi-cuenta': 'Mi Cuenta',
  '/mi-cuenta/cursos': 'Mis Cursos',
};

function fmtDate(iso: string) {
  const [, m, d] = iso.split('-');
  return `${parseInt(d)}/${parseInt(m)}`;
}

function fmtNum(n: number) {
  return n.toLocaleString('es-AR');
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/analytics')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxDay = stats ? Math.max(...stats.byDay.map(d => d.count), 1) : 1;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Estadísticas de Visitas</h2>
            <p className={styles.subtitle}>Visitas reales al sitio público, sin bots ni admin.</p>
          </div>
          <button className={styles.refreshBtn} onClick={load} disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>

        {loading && !stats ? (
          <p className={styles.empty}>Cargando estadísticas...</p>
        ) : !stats || stats.total === 0 ? (
          <p className={styles.empty}>Todavía no hay visitas registradas.</p>
        ) : (
          <>
            {/* Stat Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total histórico</span>
                <span className={styles.statValue}>{fmtNum(stats.total)}</span>
                <span className={styles.statSub}>visitas registradas</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Últimos 30 días</span>
                <span className={styles.statValue}>{fmtNum(stats.last30)}</span>
                <span className={styles.statSub}>visitas este mes</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Últimos 7 días</span>
                <span className={styles.statValue}>{fmtNum(stats.last7)}</span>
                <span className={styles.statSub}>visitas esta semana</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Hoy</span>
                <span className={styles.statValue}>{fmtNum(stats.today)}</span>
                <span className={styles.statSub}>visitas hoy</span>
              </div>
            </div>

            {/* Bar chart */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Visitas últimos 30 días</h3>
              <div className={styles.chartWrap}>
                <div className={styles.chart}>
                  {stats.byDay.map(d => (
                    <div key={d.date} className={styles.barCol} title={`${fmtDate(d.date)}: ${d.count} visitas`}>
                      <div
                        className={styles.bar}
                        style={{ height: `${Math.max((d.count / maxDay) * 120, d.count > 0 ? 4 : 0)}px` }}
                      />
                      <span className={styles.barLabel}>{fmtDate(d.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top pages */}
            <div className={styles.tableCard}>
              <h3 className={styles.tableTitle}>Páginas más visitadas</h3>
              {stats.topPages.length === 0 ? (
                <p className={styles.empty}>Sin datos</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Página</th>
                      <th>URL</th>
                      <th>Visitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPages.map((p, i) => (
                      <tr key={p.path}>
                        <td><span className={styles.rankNum}>{i + 1}</span></td>
                        <td>{PAGE_LABELS[p.path] ?? (p.path.split('/').filter(Boolean).join(' › ') || 'Inicio')}</td>
                        <td><span className={styles.pathCell}>{p.path}</span></td>
                        <td><span className={styles.countBadge}>{fmtNum(p.count)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AdminLayout>
  );
}
