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

export type HomeListUpcomingAgendaDay = {
  dateStr: string;
  dateLabel: string;
  isToday: boolean;
  count: number;
  summaryLabel: string;
  rows: HomeListTodayAgendaRow[];
};

type HomeListTodayAgendaProps = {
  isEn: boolean;
  dayCount: number;
  totalCount: number;
  summaryLabel: string;
  dayGroups: HomeListUpcomingAgendaDay[];
  onItemClick: (item: HomeTodayAgendaItem) => void;
  onOpenCalendar: () => void;
};

export default function HomeListTodayAgenda({
  isEn,
  dayCount,
  totalCount,
  summaryLabel,
  dayGroups,
  onItemClick,
  onOpenCalendar,
}: HomeListTodayAgendaProps) {
  return (
    <section className="home-list-gate__today-agenda" aria-label={isEn ? 'Upcoming schedule' : '다가오는 일정'}>
      <div className="home-list-gate__today-agenda-head">
        <div className="home-list-gate__today-agenda-head-copy">
          <p className="home-list-gate__section-caption">{isEn ? 'Upcoming' : '다가오는 일정'}</p>
          <h2 className="home-list-gate__today-agenda-title">
            {isEn ? `Next ${dayCount} days` : `${dayCount}일`}
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

      {dayGroups.length === 0 ? (
        <div className="home-list-gate__today-agenda-empty">
          {isEn
            ? `No posters in the next ${dayCount} days.`
            : `앞으로 ${dayCount}일 등록된 일정이 없어요.`}
        </div>
      ) : (
        <div className="home-list-gate__today-agenda-days">
          {dayGroups.map((group) => (
            <section
              key={group.dateStr}
              className={`home-list-gate__today-agenda-day${group.isToday ? ' is-today' : ''}`}
            >
              <div className="home-list-gate__today-agenda-day-head">
                <h3 className="home-list-gate__today-agenda-day-title">
                  {group.dateLabel}
                  <span className="home-list-gate__today-agenda-day-count">
                    {isEn ? `${group.count} events` : `${group.count}건`}
                  </span>
                </h3>
                {group.summaryLabel ? (
                  <p className="home-list-gate__today-agenda-day-summary">{group.summaryLabel}</p>
                ) : null}
              </div>
              <ul className="home-list-gate__today-agenda-list">
                {group.rows.map((row) => (
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
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
