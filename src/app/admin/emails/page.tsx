'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import styles from './emails.module.css';

type EmailLog = {
  id: number;
  to: string;
  subject: string;
  status: 'SENT' | 'FAILED';
  error: string | null;
  type: string;
  createdAt: string;
};

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/logs?page=${p}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotalPages(data.pagination.pages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Mail size={24} className={styles.icon} />
          <div>
            <h1>Registro de Correos</h1>
            <p>Seguimiento de todos los emails enviados por el sistema</p>
          </div>
        </div>
      </header>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Destinatario</th>
                <th>Asunto</th>
                <th>Tipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className={styles.empty}>Cargando registros...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className={styles.empty}>No hay registros de correos.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.dateCell}>
                      <Clock size={14} />
                      {new Date(log.createdAt).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className={styles.emailCell}>{log.to}</td>
                    <td className={styles.subjectCell}>{log.subject}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`type_${log.type}`]}`}>
                        {log.type}
                      </span>
                    </td>
                    <td>
                      {log.status === 'SENT' ? (
                        <span className={styles.statusSent}>
                          <CheckCircle size={14} /> Enviado
                        </span>
                      ) : (
                        <div className={styles.statusError}>
                          <span className={styles.statusFailed}>
                            <XCircle size={14} /> Fallido
                          </span>
                          {log.error && <span className={styles.errorMessage}>{log.error}</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className={styles.pageBtn}
            >
              Anterior
            </button>
            <span className={styles.pageInfo}>Página {page} de {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className={styles.pageBtn}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
