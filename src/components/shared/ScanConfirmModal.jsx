import React, { useEffect, useMemo, useRef } from 'react';

export default function ScanConfirmModal({ isOpen, title, subtitle, onClose, durationMs = 2000, variant = 'success' }) {
  const closeRef = useRef(onClose);
  const isError = String(variant || '').toLowerCase() === 'error';
  const icon = useMemo(() => (isError ? '!' : '✓'), [isError]);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const t = window.setTimeout(() => {
      if (typeof closeRef.current === 'function') closeRef.current();
    }, Math.max(250, Number(durationMs) || 2000));
    return () => window.clearTimeout(t);
  }, [isOpen, durationMs]);

  if (!isOpen) return null;

  return (
    <div
      className={`modal confirmModal ${isError ? 'confirmModal--error' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={isError ? 'Scan error' : 'Scan confirmation'}
      aria-live="polite"
    >
      <div className="modal__backdrop confirmModal__backdrop" />
      <div className="modal__panel confirmModal__panel" style={{ maxWidth: 420 }}>
        <div className="confirmModal__icon" aria-hidden="true">
          {icon}
        </div>
        <div className="confirmModal__title">{title || 'Recorded'}</div>
        {subtitle ? <div className="confirmModal__sub">{subtitle}</div> : null}
      </div>
    </div>
  );
}
