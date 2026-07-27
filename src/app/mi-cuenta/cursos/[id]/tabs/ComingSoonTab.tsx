'use client';

import styles from '../../../account.module.css';

export default function ComingSoonTab({ message }: { message: string }) {
  return (
    <div className={styles.card}>
      <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>{message}</p>
    </div>
  );
}
