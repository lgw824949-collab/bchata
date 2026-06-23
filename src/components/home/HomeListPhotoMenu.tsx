import React, { useEffect, useMemo, useState } from 'react';
import { homeListPhotoMenuAriaLabel, HOME_EXPLORE_MENU_EMOJIS, type HomeListPhotoMenuItem } from '../../lib/homeListPhotoMenu';

type HomeListPhotoMenuProps = {
  isEn: boolean;
  items: HomeListPhotoMenuItem[];
  eventsLoading?: boolean;
  remountKey?: number;
};

export default function HomeListPhotoMenu({
  items,
  eventsLoading = false,
  remountKey = 0,
}: HomeListPhotoMenuProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="home-list-gate__panel home-list-gate__quick-panel"
      aria-label="Explore categories"
    >
      <div className="home-list-gate__quick-panel-head">
        <h2 className="home-list-gate__section-title home-list-gate__quick-panel-title">
          Explore
        </h2>
      </div>
      <div className="home-list-gate__quick-menu-grid" role="list">
        {items.map((item) => (
          <PhotoMenuButton
            key={`${item.id}-${remountKey}`}
            item={item}
            eventsLoading={eventsLoading}
          />
        ))}
      </div>
    </section>
  );
}

function PhotoMenuButton({
  item,
  eventsLoading,
}: {
  item: HomeListPhotoMenuItem;
  eventsLoading: boolean;
}) {
  const candidates = useMemo(
    () => (item.photoCandidates?.length ? item.photoCandidates : (item.photoUrl ? [item.photoUrl] : [])),
    [item.photoCandidates, item.photoUrl],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setImageBroken(false);
  }, [item.id, candidates.join('|')]);

  const activeUrl = candidates[candidateIndex] ?? null;
  const badgeLabel = item.count > 99 ? '99+' : String(item.count);
  const showPoster = Boolean(activeUrl) && !eventsLoading && !imageBroken;

  return (
    <button
      type="button"
      role="listitem"
      className={`home-list-gate__quick-menu-btn home-list-gate__quick-menu-btn--${item.id}`}
      aria-label={homeListPhotoMenuAriaLabel(item, true)}
      onClick={item.onClick}
    >
      <span className="home-list-gate__quick-menu-thumb-wrap" aria-hidden>
        <span className="home-list-gate__quick-menu-thumb">
          {showPoster ? (
            <img
              key={`${item.id}-${activeUrl}`}
              src={activeUrl!}
              alt=""
              className="home-list-gate__quick-menu-thumb-img"
              loading="eager"
              decoding="async"
              onError={() => {
                if (candidateIndex < candidates.length - 1) {
                  setCandidateIndex((index) => index + 1);
                  return;
                }
                setImageBroken(true);
              }}
            />
          ) : (
            <span
              className={`home-list-gate__quick-menu-thumb-placeholder${
                eventsLoading ? ' home-list-gate__quick-menu-thumb-placeholder--loading' : ''
              }`}
            >
              {!eventsLoading && (
                <span className="home-list-gate__quick-menu-emoji">
                  {HOME_EXPLORE_MENU_EMOJIS[item.id]}
                </span>
              )}
            </span>
          )}
        </span>
        {item.count > 0 ? (
          <span className="home-list-gate__quick-menu-badge">{badgeLabel}</span>
        ) : null}
      </span>
      <span className="home-list-gate__quick-menu-label">{item.label}</span>
    </button>
  );
}
