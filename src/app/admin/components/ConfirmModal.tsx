'use client';

type Props = {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({ message, confirmLabel = 'Eliminar', onConfirm, onCancel }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,40,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onCancel}
    >
      <div
        style={{ background: 'white', borderRadius: 18, padding: '32px 32px 28px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ fontSize: '1rem', color: '#1e293b', marginBottom: 28, lineHeight: 1.65, fontWeight: 500 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 22px', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', background: 'white', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '10px 22px', border: 'none', borderRadius: 10, cursor: 'pointer', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
