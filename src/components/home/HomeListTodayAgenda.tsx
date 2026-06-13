import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import { UPCOMING_AGENDA_PREVIEW_LIMIT } from '../../lib/buildHomeTodayAgenda';
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
  rows: HomeListTodayAgendaRow[];
};

type HomeListTodayAgendaProps = {
  isEn: boolean;
  dayCount: number;
  totalCount: number;
  dayGroups: HomeListUpcomingAgendaDay[];
  previewLimit?: number;
  onItemClick: (item: HomeTodayAgendaItem) => void;
  onOpenCalendar: () => void;
};

function sliceAgendaDayGroups(
  dayGroups: HomeListUpcomingAgendaDay[],
  limit: number,
) {
  let remaining = limit;
  const sliced: HomeListUpcomingAgendaDay[] = [];

  for (const group of dayGroups) {
    if (remaining <= 0) break;
    const rows = group.rows.slice(0, remaining);
    if (rows.length === 0) continue;
    remaining -= rows.length;
    sliced.push({ ...group, rows });
  }

  return sliced;
}

export default function HomeListTodayAgenda({
  isEn,
  dayCount,
  totalCount,
  dayGroups,
  previewLimit = UPCOMING_AGENDA_PREVIEW_LIMIT,
  onItemClick,
  onOpenCalendar,
}: HomeListTodayAgendaProps) {
  const [expanded, setExpanded] = useState(false);

  const hiddenCount = Math.max(0, totalCount - previewLimit);
  const visibleDayGroups = useMemo(
    () => (expanded || hiddenCount === 0
      ? dayGroups
      : sliceAgendaDayGroups(dayGroups, previewLimit)),
    [dayGroups, expanded, hiddenCount, previewLimit],
  );

  return (
    <section className="home-list-gate__today-agenda" aria-label={isEn ? 'Upcoming schedule' : '다가오는 일정'}>
      <div className="home-list-gate__today-agenda-head">
        <h2 className="home-list-gate__today-agenda-title">
          {isEn ? 'Upcoming' : '다가오는 일정'}
          {totalCount > 0 ? (
            <span className="home-list-gate__today-agenda-badge">{totalCount}</span>
          ) : null}
        </h2>
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
            ? `Nothing in the next ${dayCount} days.`
            : `앞으로 ${dayCount}일 일정 없음`}
        </div>
      ) : (
        <>
          <div className="home-list-gate__today-agenda-days">
            {visibleDayGroups.map((group) => (
              <section
                key={group.dateStr}
                className={`home-list-gate__today-agenda-day${group.isToday ? ' is-today' : ''}`}
              >
                <h3 className="home-list-gate__today-agenda-day-title">{group.dateLabel}</h3>
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

          {hiddenCount > 0 ? (
            <button
              type="button"
              className="home-list-gate__today-agenda-more"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  {isEn ? 'Less' : '접기'}
                  <ChevronUp size={16} aria-hidden />
                </>
              ) : (
                <>
                  {isEn ? `+${hiddenCount} more` : `더보기 ${hiddenCount}`}
                  <ChevronDown size={16} aria-hidden />
                </>
              )}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
