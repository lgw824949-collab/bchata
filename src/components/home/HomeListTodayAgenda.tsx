import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_CARD_IMAGE, imgFallbackHandler } from '../../constants/imageAssets';
import {
  buildHomeAgendaMonthDays,
  formatAgendaDayLabel,
  formatAgendaMonthLabel,
  parseDateStrParts,
  shiftMonth,
  type HomeTodayAgendaItem,
} from '../../lib/buildHomeTodayAgenda';
import type { HomeDarkParty } from './types';

export type HomeListTodayAgendaRow = {
  id: string;
  kind: HomeTodayAgendaItem['kind'];
  kindLabel: string;
  genreLabel: string;
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
  parties: HomeDarkParty[] | null | undefined;
  bootcamps: Record<string, unknown>[] | null | undefined;
  festivals: Record<string, unknown>[] | null | undefined;
  venueLessons?: Record<string, unknown>[] | null | undefined;
  mapRows: (items: HomeTodayAgendaItem[]) => HomeListTodayAgendaRow[];
  onItemClick: (item: HomeTodayAgendaItem) => void;
  onOpenCalendar: () => void;
};

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function formatSelectedDateHeading(dateStr: string, isEn: boolean) {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = isEn ? WEEKDAYS_EN[date.getDay()] : WEEKDAYS_KO[date.getDay()];
  if (isEn) return `${month}/${day}/${year} (${weekday})`;
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

export default function HomeListTodayAgenda({
  isEn,
  todayStr,
  parties,
  bootcamps,
  festivals,
  venueLessons,
  mapRows,
  onItemClick,
  onOpenCalendar,
}: HomeListTodayAgendaProps) {
  const todayParts = useMemo(() => parseDateStrParts(todayStr), [todayStr]);
  const [viewYear, setViewYear] = useState(todayParts.year);
  const [viewMonth, setViewMonth] = useState(todayParts.month);
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const stripRef = useRef<HTMLDivElement>(null);
  const selectedChipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setViewYear(todayParts.year);
    setViewMonth(todayParts.month);
    setSelectedDateStr(todayStr);
  }, [todayParts.month, todayParts.year, todayStr]);

  useEffect(() => {
    selectedChipRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [selectedDateStr, viewMonth, viewYear]);

  const dayGroups = useMemo((): HomeListUpcomingAgendaDay[] => {
    const days = buildHomeAgendaMonthDays({
      year: viewYear,
      month: viewMonth,
      parties,
      bootcamps,
      festivals,
      venueLessons,
    });
    return days.map((day) => ({
      dateStr: day.dateStr,
      dateLabel: formatAgendaDayLabel(day.dateStr, todayStr, isEn),
      isToday: day.dateStr === todayStr,
      rows: mapRows(day.items),
    }));
  }, [
    viewYear,
    viewMonth,
    parties,
    bootcamps,
    festivals,
    venueLessons,
    todayStr,
    isEn,
    mapRows,
  ]);

  const canGoPrevMonth = viewYear > todayParts.year
    || (viewYear === todayParts.year && viewMonth > todayParts.month);

  /** 홈 일정 — 오늘 이전 날짜·지난 일정 미표시 */
  const stripDayGroups = useMemo(() => {
    if (viewYear < todayParts.year) return [];
    if (viewYear === todayParts.year && viewMonth < todayParts.month) return [];
    if (viewYear === todayParts.year && viewMonth === todayParts.month) {
      return dayGroups.filter((group) => group.dateStr >= todayStr);
    }
    return dayGroups;
  }, [dayGroups, todayParts.month, todayParts.year, todayStr, viewMonth, viewYear]);

  useEffect(() => {
    if (selectedDateStr >= todayStr) return;
    setSelectedDateStr(todayStr);
    setViewYear(todayParts.year);
    setViewMonth(todayParts.month);
  }, [selectedDateStr, todayParts.month, todayParts.year, todayStr]);

  const selectedGroup = useMemo(
    () => dayGroups.find((group) => group.dateStr === selectedDateStr) || null,
    [dayGroups, selectedDateStr],
  );

  const selectedCount = selectedGroup?.rows.length ?? 0;
  const monthLabel = formatAgendaMonthLabel(viewYear, viewMonth, isEn);

  const shiftViewMonth = useCallback((delta: number) => {
    if (delta < 0 && !canGoPrevMonth) return;

    const next = shiftMonth(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);

    const isCurrentMonth = next.year === todayParts.year && next.month === todayParts.month;
    if (isCurrentMonth) {
      setSelectedDateStr(todayStr);
      return;
    }

    if (delta > 0) {
      setSelectedDateStr(`${next.year}-${String(next.month).padStart(2, '0')}-01`);
    }
  }, [canGoPrevMonth, todayParts.month, todayParts.year, todayStr, viewMonth, viewYear]);

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

      <div className="home-list-gate__today-agenda-toolbar">
        <div className="home-list-gate__today-agenda-month-nav" aria-label={isEn ? 'Change month' : '월 이동'}>
          <button
            type="button"
            className="home-list-gate__today-agenda-month-btn"
            onClick={() => shiftViewMonth(-1)}
            disabled={!canGoPrevMonth}
            aria-label={isEn ? 'Previous month' : '이전 달'}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <span className="home-list-gate__today-agenda-month">{monthLabel}</span>
          <button
            type="button"
            className="home-list-gate__today-agenda-month-btn"
            onClick={() => shiftViewMonth(1)}
            aria-label={isEn ? 'Next month' : '다음 달'}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={stripRef}
        className="home-list-gate__date-strip"
        role="tablist"
        aria-label={isEn ? 'Pick a date' : '날짜 선택'}
      >
        {stripDayGroups.map((group) => {
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
          {formatSelectedDateHeading(selectedDateStr, isEn)}
        </p>
        <div className="home-list-gate__today-agenda-summary-actions">
          {selectedDateStr !== todayStr ? (
            <button
              type="button"
              className="home-list-gate__today-agenda-today-btn"
              onClick={() => {
                setViewYear(todayParts.year);
                setViewMonth(todayParts.month);
                setSelectedDateStr(todayStr);
              }}
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
                    {row.genreLabel ? (
                      <span className="home-list-gate__today-agenda-genre">{row.genreLabel}</span>
                    ) : null}
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
