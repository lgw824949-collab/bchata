import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { flushSync } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Z } from '../../constants/zLayers';
import type { HomeDarkMoreAction } from './types';

type HomeDarkMoreSheetProps = {
  open: boolean;
  isEn: boolean;
  actions: HomeDarkMoreAction[];
  onClose: () => void;
};

const BODY_MENU_CLASS = 'home-more-menu-open';

export default function HomeDarkMoreSheet({
  open,
  isEn,
  actions,
  onClose,
}: HomeDarkMoreSheetProps) {
  const [quickClose, setQuickClose] = useState(false);
  const [onHomePath, setOnHomePath] = useState(() => window.location.pathname === '/');

  useEffect(() => {
    if (open) setQuickClose(false);
  }, [open]);

  useEffect(() => {
    const syncPath = () => {
      const home = window.location.pathname === '/';
      setOnHomePath(home);
      if (!home) onClose();
    };
    syncPath();
    window.addEventListener('bamppa-navigate', syncPath);
    window.addEventListener('popstate', syncPath);
    return () => {
      window.removeEventListener('bamppa-navigate', syncPath);
      window.removeEventListener('popstate', syncPath);
    };
  }, [onClose]);

  useEffect(() => {
    document.body.classList.toggle(BODY_MENU_CLASS, open && onHomePath);
    return () => document.body.classList.remove(BODY_MENU_CLASS);
  }, [open, onHomePath]);

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

  const runAction = (action: HomeDarkMoreAction) => {
    action.onClick();
    flushSync(() => {
      setQuickClose(true);
      onClose();
    });
  };

  const renderSection = (label: string, items: HomeDarkMoreAction[]) => {
    if (items.length === 0) return null;
    return (
      <>
        <p className="home-dark-more-sheet__section-label">{label}</p>
        <div className="home-dark-more-sheet__cards">
          {items.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                className="home-dark-more-sheet__card"
                onClick={() => runAction(action)}
              >
                <span className="home-dark-more-sheet__card-icon" aria-hidden>
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <span className="home-dark-more-sheet__label">
                  {isEn ? action.labelEn : action.labelKo}
                </span>
                {action.badge ? (
                  <span className="home-dark-more-sheet__badge">{action.badge}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  return createPortal(
    <AnimatePresence initial={false}>
      {open && onHomePath ? (
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
            exit={{
              x: '100%',
              transition: quickClose
                ? { duration: 0 }
                : { type: 'spring', damping: 32, stiffness: 360 },
            }}
            transition={{ type: 'spring', damping: 32, stiffness: 360 }}
            style={{ zIndex: Z.modal }}
          >
            <header className="home-dark-more-sheet__header">
              <motion.button
                type="button"
                className="home-dark-more-sheet__close"
                aria-label={isEn ? 'Close' : '닫기'}
                onClick={onClose}
                whileTap={{ scale: 0.92 }}
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </motion.button>
            </header>

            <nav className="home-dark-more-sheet__nav" aria-label={isEn ? 'Shortcuts' : '바로가기'}>
              {renderSection(isEn ? 'EXPLORE · REGISTER' : '탐색 · 등록', primary)}
              {primary.length > 0 && secondary.length > 0 ? (
                <div className="home-dark-more-sheet__divider" aria-hidden />
              ) : null}
              {renderSection(isEn ? 'TOOLS' : '기타', secondary)}
            </nav>

            <p className="home-dark-more-sheet__footer">© 2026 BAMPPA</p>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
