'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import styles from './PromoPopup.module.css';

type Settings = {
  popup_enabled?: string;
  popup_title?: string;
  popup_content?: string;
  popup_cta_text?: string;
  popup_cta_url?: string;
};

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const [cfg, setCfg] = useState<Settings>({});

  useEffect(() => {
    if (sessionStorage.getItem('promo_dismissed')) return;

    fetch('/api/settings?public=1')
      .then(r => r.json())
      .then((data: Settings) => {
        if (data.popup_enabled === 'true' && data.popup_content) {
          setCfg(data);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('promo_dismissed', '1');
  };

  if (!visible) return null;

  const isExternal = (url: string) => /^https?:\/\//.test(url);

  return (
    <div className={styles.overlay} onClick={dismiss}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={dismiss} aria-label="Cerrar">
          <X size={16} />
        </button>

        <div className={styles.badge}>Promo</div>

        {cfg.popup_title && <h2 className={styles.title}>{cfg.popup_title}</h2>}

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: cfg.popup_content ?? '' }}
        />

        <div className={styles.actions}>
          {cfg.popup_cta_text && cfg.popup_cta_url && (
            <a
              href={cfg.popup_cta_url}
              className={styles.cta}
              {...(isExternal(cfg.popup_cta_url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={dismiss}
            >
              {cfg.popup_cta_text}
            </a>
          )}
          <button className={styles.dismiss} onClick={dismiss}>
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );
}
