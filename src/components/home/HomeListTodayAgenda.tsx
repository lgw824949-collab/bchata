import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  liveLabel?: string | null;
  liveCount?: number | null;
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
  todayStr: string;
  dayGroups: HomeListUpcomingAgendaDay[];
  onItemClick: (item: HomeTodayAgendaItem) => void;
  onOpenCalendar: () => void;
};

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function formatSelectedDateHeading(dateStr: string, todayStr: string, isEn: boolean) {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = isEn ? WEEKDAYS_EN[date.getDay()] : WEEKDAYS_KO[date.getDay()];
  if (isEn) return `${month}/${day}/${year} (${weekday})`;
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

function formatStripMonthLabel(dateStr: string, isEn: boolean) {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return isEn ? `${month}/${year}` : `${year}. ${month}.`;
}

export default function HomeListTodayAgenda({
  isEn,
  todayStr,
  dayGroups,
  onItemClick,
  onOpenCalendar,
}: HomeListTodayAgendaProps) {
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const stripRef = useRef<HTMLDivElement>(null);
  const selectedChipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSelectedDateStr(todayStr);
  }, [todayStr]);

  useEffect(() => {
    selectedChipRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [selectedDateStr]);

  const selectedGroup = useMemo(
    () => dayGroups.find((group) => group.dateStr === selectedDateStr) || null,
    [dayGroups, selectedDateStr],
  );

  const selectedCount = selectedGroup?.rows.length ?? 0;
  const monthLabel = formatStripMonthLabel(selectedDateStr, isEn);

  return (
    <section className="home-list-gate__today-agenda" aria-label={isEn ? 'Schedule by date' : '날짜별 일정'}>
      <div className="home-list-gate__today-agenda-head">
        <h2 className="home-list-gate__today-agenda-title">
          {isEn ? 'Schedule' : '일정'}
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

      {monthLabel ? (
        <p className="home-list-gate__today-agenda-month" aria-hidden>
          {monthLabel}
        </p>
      ) : null}

      <div
        ref={stripRef}
        className="home-list-gate__date-strip"
        role="tablist"
        aria-label={isEn ? 'Pick a date' : '날짜 선택'}
      >
        {dayGroups.map((group) => {
          const date = new Date(`${group.dateStr}T12:00:00`);
          const weekday = Number.isNaN(date.getTime())
            ? ''
            : (isEn ? WEEKDAYS_EN[date.getDay()] : WEEKDAYS_KO[date.getDay()]);
          const dayNum = Number.isNaN(date.getTime()) ? group.dateStr.slice(8, 10) : String(date.getDate());
          const isSelected = group.dateStr === selectedDateStr;
          const count = group.rows.length;

          return (
            <button
              key={group.dateStr}
              ref={isSelected ? selectedChipRef : undefined}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`home-list-gate__date-strip-chip${isSelected ? ' is-selected' : ''}${group.isToday ? ' is-today' : ''}`}
              onClick={() => setSelectedDateStr(group.dateStr)}
            >
              <span className="home-list-gate__date-strip-weekday">{weekday}</span>
              <span className="home-list-gate__date-strip-day">{dayNum}</span>
              {count > 0 ? (
                <span className="home-list-gate__date-strip-count" aria-hidden>
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="home-list-gate__today-agenda-summary">
        <p className="home-list-gate__today-agenda-selected-label">
          {formatSelectedDateHeading(selectedDateStr, todayStr, isEn)}
        </p>
        <div className="home-list-gate__today-agenda-summary-actions">
          {selectedDateStr !== todayStr ? (
            <button
              type="button"
              className="home-list-gate__today-agenda-today-btn"
              onClick={() => setSelectedDateStr(todayStr)}
            >
              {isEn ? 'Today' : '오늘'}
            </button>
          ) : null}
          <span
            className="home-list-gate__today-agenda-badge"
            aria-label={isEn ? `${selectedCount} events` : `일정 ${selectedCount}건`}
          >
            {selectedCount}
            <span className="home-list-gate__count-unit">{isEn ? '' : '건'}</span>
          </span>
        </div>
      </div>

      {selectedCount === 0 ? (
        <div className="home-list-gate__today-agenda-empty">
          {isEn
            ? 'No events on this date.'
            : '이 날짜에 등록된 일정이 없어요.'}
        </div>
      ) : (
        <ul className="home-list-gate__today-agenda-list">
          {selectedGroup?.rows.map((row) => (
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
                  <span className="home-list-gate__today-agenda-tags">
                    <span className={`home-list-gate__today-agenda-kind home-list-gate__today-agenda-kind--${row.kind}`}>
                      {row.kindLabel}
                    </span>
                    {row.liveLabel ? (
                      <span
                        className="home-list-gate__today-agenda-live"
                        aria-label={isEn ? `Live ${row.liveCount ?? 0} people` : `실시간 ${row.liveCount ?? 0}명`}
                      >
                        {row.liveLabel}
                      </span>
                    ) : null}
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
