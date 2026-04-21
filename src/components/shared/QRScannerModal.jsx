import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CloseIcon } from './Icons.jsx';

const hasBarcodeDetector = () => typeof window !== 'undefined' && 'BarcodeDetector' in window;
const hasJsQr = () => typeof window !== 'undefined' && typeof window.jsQR === 'function';

const getPreferredConstraints = () => ({
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
});

export default function QRScannerModal({ isOpen, onClose, onScanSuccess, scanBusy }) {
  const videoRef = useRef(null);
  const rafRef = useRef(0);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const jsQrWarnedRef = useRef(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');

  const detector = useMemo(() => {
    if (!isOpen) return null;
    if (!hasBarcodeDetector()) return null;
    try {
      return new window.BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      return null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };

    const start = async () => {
      setError('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia(getPreferredConstraints());
        streamRef.current = stream;
        const vid = videoRef.current;
        if (vid) {
          vid.srcObject = stream;
          await vid.play();
        }
      } catch (e) {
        setError(e?.message || 'Unable to access camera.');
        return;
      }

      if (!detector && !hasJsQr()) return;

      const tick = async () => {
        if (!isOpen || scanBusy) return;
        const vid = videoRef.current;
        if (!vid || vid.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const canvas = canvasRef.current || document.createElement('canvas');
        canvasRef.current = canvas;
        canvas.width = vid.videoWidth || 640;
        canvas.height = vid.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

        if (detector) {
          try {
            const codes = await detector.detect(canvas);
            if (codes && codes.length) {
              const raw = String(codes[0]?.rawValue || '').trim();
              if (raw) {
                onScanSuccess(raw);
                return;
              }
            }
          } catch {
            // ignore scan errors; keep trying
          }
        } else if (hasJsQr()) {
          try {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
            const raw = String(code?.data || '').trim();
            if (raw) {
              onScanSuccess(raw);
              return;
            }
          } catch {
            // ignore scan errors; keep trying
          }
        } else if (!jsQrWarnedRef.current) {
          // Camera is available but QR decoding library isn't loaded yet.
          jsQrWarnedRef.current = true;
          setError('QR scanner is loading… If it stays stuck, refresh the page and allow camera permissions.');
          // Clear the message shortly; keep the camera running.
          window.setTimeout(() => setError(''), 2200);
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    start();
    return () => stop();
  }, [detector, isOpen, onScanSuccess, scanBusy]);

  if (!isOpen) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Scan QR Code" onClick={(e) => {
      if (!(e.target instanceof Element)) return;
      const closeEl = e.target.closest('[data-close="true"]');
      if (closeEl) onClose();
    }}>
      <div className="modal__backdrop" data-close="true" />
      <div className="modal__panel" style={{ maxWidth: 560 }}>
        <div className="modal__head">
          <div className="modal__title">Scan QR Code</div>
          <button className="iconbtn iconbtn--dark" type="button" data-close="true" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="modal__body">
          {error ? (
            <div className="muted" style={{ color: '#5b6b85' }}>
              {error}
            </div>
          ) : (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(15,23,42,.10)' }}>
              <video ref={videoRef} style={{ width: '100%', display: 'block' }} playsInline muted />
            </div>
          )}

          {(!hasBarcodeDetector() && !hasJsQr()) && (
            <div style={{ marginTop: 12 }}>
              <div className="cellTitle">Manual QR data</div>
              <textarea
                className="input"
                style={{ minHeight: 90, resize: 'vertical' }}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Paste the QR payload here (JSON string)..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 10 }}>
                <button className="btn btn--dark btn--sm" type="button" onClick={() => onScanSuccess(String(manual || '').trim())} disabled={!manual.trim() || scanBusy}>
                  Use Data
                </button>
              </div>
            </div>
          )}

          {scanBusy && (
            <div style={{ marginTop: 12, color: '#5b6b85' }}>
              Processing…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
