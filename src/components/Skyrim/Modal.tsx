import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { useLatestRef } from '../../hooks/useLatestRef';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  children: React.ReactNode;
  /** Dim everything behind completely (used for immersive casts). */
  opaque?: boolean;
  className?: string;
}

/**
 * The one dialog primitive. Handles Escape, click-outside, focus, body
 * scroll locking and tells the game that a modal is open so global
 * shortcuts (Tab / Esc) do not fire underneath it.
 */
const Modal: React.FC<ModalProps> = ({ open, onClose, title, width = 520, children, opaque = false, className = '' }) => {
  const { bumpModal } = useGame();
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useLatestRef(onClose);

  useEffect(() => {
    if (!open) return;
    bumpModal(1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); }
    };
    window.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>('input, textarea, select, button');
      el?.focus();
    }, 50);
    return () => {
      bumpModal(-1);
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, bumpModal, onCloseRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`skyrim-modal-overlay ${opaque ? 'opaque' : ''}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`skyrim-modal-content ${className}`}
            style={{ width, maxWidth: 'calc(100vw - 2rem)' }}
            initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0.2, 1] }}
          >
            {title && <h2 className="skyrim-title">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
