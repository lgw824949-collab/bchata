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

  const renderGrid = (items: HomeDarkMoreAction[]) => (
    <div className="home-dark-more-sheet__grid">
      {items.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            className={`home-dark-more-sheet__item${action.tier === 'secondary' ? ' home-dark-more-sheet__item--secondary' : ''}`}
            onClick={() => {
              action.onClick();
              onClose();
            }}
          >
            <span className="home-dark-more-sheet__icon" aria-hidden>
              <Icon size={22} strokeWidth={1.75} />
              {action.badge ? (
                <span className="home-dark-more-sheet__badge">{action.badge}</span>
              ) : null}
            </span>
            <span className="home-dark-more-sheet__label">
              {isEn ? action.labelEn : action.labelKo}
            </span>
          </button>
        );
      })}
    </div>
  );

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
          <motion.div
            className="home-dark-more-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? 'More actions' : '더보기 메뉴'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{ zIndex: Z.modal }}
          >
            <div className="home-dark-more-sheet__handle" aria-hidden />
            <header className="home-dark-more-sheet__header">
              <h2 className="home-dark-more-sheet__title">
                {isEn ? 'More' : '더보기'}
              </h2>
              <button
                type="button"
                className="home-dark-more-sheet__close"
                aria-label={isEn ? 'Close' : '닫기'}
                onClick={onClose}
              >
                <X size={20} strokeWidth={2} />
              </button>
            </header>
            {primary.length > 0 ? (
              <section className="home-dark-more-sheet__section">
                <p className="home-dark-more-sheet__section-label">
                  {isEn ? 'Register & shortcuts' : '등록 · 바로가기'}
                </p>
                {renderGrid(primary)}
              </section>
            ) : null}
            {secondary.length > 0 ? (
              <section className="home-dark-more-sheet__section">
                <p className="home-dark-more-sheet__section-label">
                  {isEn ? 'Tools' : '기타'}
                </p>
                {renderGrid(secondary)}
              </section>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
