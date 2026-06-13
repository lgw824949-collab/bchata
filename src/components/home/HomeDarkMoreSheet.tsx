import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Z } from '../../constants/zLayers';
import type { HomeDarkMoreAction } from './types';

type HomeDarkMoreSheetProps = {
  open: boolean;
  isEn: boolean;
  actions: HomeDarkMoreAction[];
  onClose: () => void;
};

export default function HomeDarkMoreSheet({
  open,
  isEn,
  actions,
  onClose,
}: HomeDarkMoreSheetProps) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const primary = actions.filter((a) => a.tier !== 'secondary');
  const secondary = actions.filter((a) => a.tier === 'secondary');

  const renderLinks = (items: HomeDarkMoreAction[]) => items.map((action) => (
    <button
      key={action.id}
      type="button"
      className="home-dark-more-sheet__link"
      onClick={() => {
        action.onClick();
        onClose();
      }}
    >
      <span className="home-dark-more-sheet__label">
        {isEn ? action.labelEn : action.labelKo}
      </span>
      {action.badge ? (
        <span className="home-dark-more-sheet__badge">{action.badge}</span>
      ) : null}
    </button>
  ));

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <div className="home-dark-more-sheet" style={{ zIndex: Z.modal }}>
          <motion.button
            type="button"
            className="home-dark-more-sheet__backdrop"
            aria-label={isEn ? 'Close menu' : '메뉴 닫기'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ zIndex: Z.modalBackdrop }}
          />
          <motion.aside
            className="home-dark-more-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? 'More actions' : '더보기 메뉴'}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 360 }}
            style={{ zIndex: Z.modal }}
          >
            <header className="home-dark-more-sheet__header">
              <p className="home-dark-more-sheet__eyebrow">
                {isEn ? 'Menu' : 'Menu'}
              </p>
              <button
                type="button"
                className="home-dark-more-sheet__close"
                aria-label={isEn ? 'Close' : '닫기'}
                onClick={onClose}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </header>

            <nav className="home-dark-more-sheet__nav" aria-label={isEn ? 'Shortcuts' : '바로가기'}>
              {renderLinks(primary)}
              {primary.length > 0 && secondary.length > 0 ? (
                <div className="home-dark-more-sheet__divider" aria-hidden />
              ) : null}
              {renderLinks(secondary)}
            </nav>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
