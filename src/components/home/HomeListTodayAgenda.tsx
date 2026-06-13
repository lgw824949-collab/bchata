import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import type { HomeTodayAgendaItem } from '../../lib/buildHomeTodayAgenda';

export type HomeListTodayAgendaRow = {
  id: string;
  kind: HomeTodayAgendaItem['kind'];
  kindLabel: string;
  posterUrl: string;
  title: string;
  meta: string;
  item: HomeTodayAgendaItem;
};

type HomeListTodayAgendaProps = {
  isEn: boolean;
  dateLabel: string;
  totalCount: number;
  summaryLabel: string;
  rows: HomeListTodayAgendaRow[];
  onItemClick: (item: HomeTodayAgendaItem) => void;
  onOpenCalendar: () => void;
};

export default function HomeListTodayAgenda({
  isEn,
  dateLabel,
  totalCount,
  summaryLabel,
  rows,
  onItemClick,
  onOpenCalendar,
}: HomeListTodayAgendaProps) {
  return (
    <section className="home-list-gate__today-agenda" aria-label={isEn ? 'Today schedule' : '오늘 일정'}>
      <div className="home-list-gate__today-agenda-head">
        <div className="home-list-gate__today-agenda-head-copy">
          <p className="home-list-gate__section-caption">{isEn ? 'Today' : '오늘 일정'}</p>
          <h2 className="home-list-gate__today-agenda-title">
            {dateLabel}
            <span className="home-list-gate__today-agenda-count">
              {isEn ? `${totalCount} events` : `전체 ${totalCount}건`}
            </span>
          </h2>
          {summaryLabel ? (
            <p className="home-list-gate__today-agenda-summary">{summaryLabel}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="home-list-gate__today-agenda-calendar"
          onClick={onOpenCalendar}
        >
          {isEn ? 'Calendar' : '달력'}
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="home-list-gate__today-agenda-empty">
          {isEn
            ? 'Nothing scheduled for this day.'
            : '이 날 등록된 일정이 없어요.'}
        </div>
      ) : (
        <ul className="home-list-gate__today-agenda-list">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="home-list-gate__today-agenda-row"
                onClick={() => onItemClick(row.item)}
                aria-label={isEn ? `Open ${row.title}` : `${row.title} 보기`}
              >
                <span className="home-list-gate__today-agenda-thumb" aria-hidden>
                  <img
                    src={row.posterUrl || DEFAULT_CARD_IMAGE}
                    alt=""
                    className="home-list-gate__today-agenda-thumb-img"
                    loading="lazy"
                    decoding="async"
                    onError={imgFallbackHandler(DEFAULT_CARD_IMAGE)}
                  />
                </span>
                <span className="home-list-gate__today-agenda-body">
                  <span className={`home-list-gate__today-agenda-kind home-list-gate__today-agenda-kind--${row.kind}`}>
                    {row.kindLabel}
                  </span>
                  <span className="home-list-gate__today-agenda-row-title">{row.title}</span>
                  {row.meta ? (
                    <span className="home-list-gate__today-agenda-row-meta">{row.meta}</span>
                  ) : null}
                </span>
                <ChevronRight size={16} className="home-list-gate__today-agenda-chevron" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
