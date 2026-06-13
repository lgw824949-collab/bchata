import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import { Z } from '../../constants/zLayers';
import { formatAgendaDayLabel } from '../../lib/buildHomeTodayAgenda';
import { filterHomePartySearchItems } from '../../lib/buildHomePartySearchItems';
import type { HomeTodayAgendaItem } from '../../lib/buildHomeTodayAgenda';

type HomePartySearchSheetProps = {
  open: boolean;
  isEn: boolean;
  todayStr: string;
  items: HomeTodayAgendaItem[];
  onClose: () => void;
  onItemClick: (item: HomeTodayAgendaItem) => void;
};

export default function HomePartySearchSheet({
  open,
  isEn,
  todayStr,
  items,
  onClose,
  onItemClick,
}: HomePartySearchSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(
    () => filterHomePartySearchItems(items, query),
    [items, query],
  );

  const handleSelect = (item: HomeTodayAgendaItem) => {
    onItemClick(item);
    onClose();
  };

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <div className="home-party-search-sheet" style={{ zIndex: Z.modal }}>
          <motion.button
            type="button"
            className="home-party-search-sheet__backdrop"
            aria-label={isEn ? 'Close search' : '검색 닫기'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="home-party-search-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? 'Search parties and events' : '파티·행사 검색'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="home-party-search-sheet__head">
              <div className="home-party-search-sheet__input-wrap">
                <Search size={18} aria-hidden />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="home-party-search-sheet__input"
                  placeholder={isEn ? 'BAR, party, festival…' : 'BAR·파티·페스·부트캠프 검색'}
                  enterKeyHint="search"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className="home-party-search-sheet__close"
                aria-label={isEn ? 'Close' : '닫기'}
                onClick={onClose}
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="home-party-search-sheet__body">
              {!query.trim() ? (
                <p className="home-party-search-sheet__hint">
                  {isEn
                    ? 'Search upcoming posters by name, venue, or type.'
                    : '앞으로 60일 일정에서 이름·장소·종류로 찾을 수 있어요.'}
                </p>
              ) : results.length === 0 ? (
                <p className="home-party-search-sheet__empty">
                  {isEn ? 'No matches found.' : '검색 결과가 없어요.'}
                </p>
              ) : (
                <ul className="home-party-search-sheet__list">
                  {results.map((item) => (
                    <li key={`${item.dateStr}-${item.id}`}>
                      <button
                        type="button"
                        className="home-party-search-sheet__row"
                        onClick={() => handleSelect(item)}
                      >
                        <span className="home-party-search-sheet__thumb" aria-hidden>
                          <img
                            src={item.posterUrl || DEFAULT_CARD_IMAGE}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
                          />
                        </span>
                        <span className="home-party-search-sheet__copy">
                          <span className="home-party-search-sheet__meta">
                            {formatAgendaDayLabel(item.dateStr, todayStr, isEn)}
                            {' · '}
                            {isEn ? item.kindLabelEn : item.kindLabelKo}
                          </span>
                          <span className="home-party-search-sheet__title">{item.title}</span>
                          {item.venue ? (
                            <span className="home-party-search-sheet__venue">{item.venue}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
