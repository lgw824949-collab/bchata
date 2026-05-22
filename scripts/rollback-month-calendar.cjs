const fs = require('fs');
const p = 'c:/dev/bchata/src/components/VenueDetailModal.jsx';
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  `/** BAR 상세 달력: 오늘부터 앞으로만 (6주, 과거·먼 미래 월 없음) */
const ROLLING_CALENDAR_WEEKS = 6;

`,
  ''
);

s = s.replace(
  `  const todayStr = getKSTTodayStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);`,
  `  const todayStr = getKSTTodayStr();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return { year: y, month: m };
  });
  const [selectedDate, setSelectedDate] = useState(todayStr);`
);

const rollingBlockStart = '  const rollingCalendarWeeks = useMemo(() => {';
const rollingBlockEnd = '  }, [venue?.id, venue?.name, detailTab, pickInitialSelectedDate]);\n\n  const setDetailNavHidden';
const i0 = s.indexOf(rollingBlockStart);
const i1 = s.indexOf(rollingBlockEnd);
if (i0 < 0 || i1 < 0) {
  console.error('logic block not found', i0, i1);
  process.exit(1);
}

const logicBlock = `  const pickInitialSelectedDate = useCallback(() => {
    if (isSocialTab) {
      const future = venueParties.find((p) => normDate(p.date) >= todayStr);
      if (future) return normDate(future.date);
      if (venueParties.length) return normDate(venueParties[venueParties.length - 1].date);
      return todayStr;
    }
    const dates = [...venueLessons.flatMap((l) => [...collectLessonCalendarDates(l, todayStr, 8)])].sort();
    const future = dates.find((d) => d >= todayStr);
    if (future) return future;
    if (dates.length) return dates[dates.length - 1];
    return todayStr;
  }, [isSocialTab, venueParties, venueLessons, todayStr]);

  const activeItems = isSocialTab ? venueParties : venueLessons;

  const datesWithEvents = useMemo(() => {
    const set = new Set();
    if (isSocialTab) {
      activeItems.forEach((p) => {
        const d = normDate(p.date);
        if (d) set.add(d);
      });
    } else {
      venueLessons.forEach((lesson) => {
        collectLessonCalendarDates(lesson, todayStr, 8).forEach((d) => set.add(d));
      });
    }
    return set;
  }, [activeItems, isSocialTab, venueLessons, todayStr]);

  useEffect(() => {
    const d = pickInitialSelectedDate();
    setSelectedDate(d);
    const [y, m] = d.split('-').map(Number);
    setCalendarMonth({ year: y, month: m });
  }, [venue?.id, venue?.name, detailTab, pickInitialSelectedDate]);

`;

s = s.slice(0, i0) + logicBlock + s.slice(i1 + rollingBlockEnd.length);

// Remove duplicate activeItems if left - the old block had isSocialTab then rolling stuff - we inserted activeItems in logicBlock but isSocialTab line remains before i0
// Check: before i0 we have "const isSocialTab = detailTab === 'social';\n\n" then rolling - good

s = s.replace(
  `        const dates = collectLessonCalendarDates(l, todayStr, ROLLING_CALENDAR_WEEKS);
        dates.forEach((date) => {
          if (date >= todayStr && rollingDateSet.has(date)) entries.push({ date, party: l });
        });`,
  `        const dates = collectLessonCalendarDates(l, todayStr, 8);
        dates.forEach((date) => {
          if (date >= todayStr) entries.push({ date, party: l });
        });`
);

s = s.replace(
  `          .filter(({ date }) => date && rollingDateSet.has(date))`,
  `          .filter(({ date }) => date)`
);

s = s.replace(
  `      if (!d || d < todayStr || !rollingDateSet.has(d)) return;`,
  `      if (!d) return;`
);

s = s.replace(
  `  }, [activeItems, isSocialTab, venueLessons, todayStr, rollingDateSet]);`,
  `  }, [activeItems, isSocialTab, venueLessons, todayStr]);`
);

const calStart = '        {/* 상단: 앞으로 6주만 (과거·월 이동 없음) */}';
const calEnd = '        {/* 본문: 카드 → 다른 행사 → SNS (한 스크롤) */}';
const c0 = s.indexOf(calStart);
const c1 = s.indexOf(calEnd);
if (c0 < 0 || c1 < 0) {
  console.error('calendar ui not found', c0, c1);
  process.exit(1);
}

const monthCal = `        {/* 상단: 달력 */}
        <div style={{ flexShrink: 0, padding: '12px 16px 10px', borderBottom: \`1px solid \${VD.border}\`, background: VD.bgCalendar }}>
          <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: VD.brand }}>{calendarMonth.month}월</span>
            <motion.div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth((m) => {
                    const nm = m.month > 1 ? m.month - 1 : 12;
                    const ny = m.month > 1 ? m.year : m.year - 1;
                    return { year: ny, month: nm };
                  })
                }
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth((m) => {
                    const nm = m.month < 12 ? m.month + 1 : 1;
                    const ny = m.month < 12 ? m.year : m.year + 1;
                    return { year: ny, month: nm };
                  })
                }
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff' }}
              >
                <ChevronRight size={16} />
              </button>
            </motion.div>
          </motion.div>
          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {DAYS_KOR.map((d) => (
              <motion.div key={d} style={{ fontSize: '10px', fontWeight: 700, color: d === '일' ? VD.accent : VD.faint, padding: '2px 0' }}>
                {d}
              </motion.div>
            ))}
            {calendarDays.map((day) => {
              if (day.empty) return <motion.div key={day.key} />;
              const isSelected = selectedDate === day.fullDate;
              const hasEvent = datesWithEvents.has(day.fullDate);
              const isPast = day.fullDate < todayStr;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDate(day.fullDate)}
                  style={{
                    border: 'none',
                    background: isSelected ? VD.brand : hasEvent ? 'rgba(212, 67, 110, 0.08)' : 'transparent',
                    borderRadius: 10,
                    padding: '6px 0',
                    cursor: 'pointer',
                    opacity: isPast && !hasEvent ? 0.35 : 1,
                  }}
                >
                  <motion.div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#fff' : hasEvent ? VD.brand : VD.title }}>{day.date}</motion.div>
                  <motion.div style={{ height: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {hasEvent && (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: isSelected ? '#fff' : VD.gold,
                        }}
                      />
                    )}
                  </motion.div>
                </button>
              );
            })}
          </motion.div>
        </motion.div>

`;

// fix motion.div -> div in monthCal
const monthCalFixed = monthCal.split('motion.div').join('div').split('</motion.div>').join('</motion.div>');
// that breaks framer-motion import usage elsewhere - only replace in this block carefully
let mc = monthCal;
mc = mc.replace(/<motion\.div/g, '<div').replace(/<\/motion\.motion\.p>/g, '</motion.p>');
mc = mc.replace(/<\/motion\.motion\.p>/g, '</motion.p>');
// simpler
mc = monthCal.replaceAll('<motion.div', '<motion.div').replaceAll('motion.div', 'div'); // wrong

// build with d only
const d = 'div';
mc = [
  '        {/* 상단: 달력 */}',
  `        <${d} style={{ flexShrink: 0, padding: '12px 16px 10px', borderBottom: \`1px solid \${VD.border}\`, background: VD.bgCalendar }}>`,
  `          <${d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>`,
  "            <span style={{ fontSize: '16px', fontWeight: 900, color: VD.brand }}>{calendarMonth.month}월</span>",
  `            <${d} style={{ display: 'flex', gap: '6px' }}>`,
  '              <button type="button" onClick={() => setCalendarMonth((m) => { const nm = m.month > 1 ? m.month - 1 : 12; const ny = m.month > 1 ? m.year : m.year - 1; return { year: ny, month: nm }; })} style={{ width: 32, height: 32, borderRadius: 8, border: \'1px solid #E2E8F0\', background: \'#fff\' }}><ChevronLeft size={16} /></button>',
  '              <button type="button" onClick={() => setCalendarMonth((m) => { const nm = m.month < 12 ? m.month + 1 : 1; const ny = m.month < 12 ? m.year : m.year + 1; return { year: ny, month: nm }; })} style={{ width: 32, height: 32, borderRadius: 8, border: \'1px solid #E2E8F0\', background: \'#fff\' }}><ChevronRight size={16} /></button>',
  `            </${d}>`,
  `          </${d}>`,
  `          <${d} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>`,
  '            {DAYS_KOR.map((d) => (',
  `              <${d} key={d} style={{ fontSize: '10px', fontWeight: 700, color: d === '일' ? VD.accent : VD.faint, padding: '2px 0' }}>{d}</${d}>`,
  '            ))}',
  '            {calendarDays.map((day) => {',
  '              if (day.empty) return <div key={day.key} />;',
  '              const isSelected = selectedDate === day.fullDate;',
  '              const hasEvent = datesWithEvents.has(day.fullDate);',
  '              const isPast = day.fullDate < todayStr;',
  '              return (',
  '                <button key={day.key} type="button" onClick={() => setSelectedDate(day.fullDate)} style={{ border: \'none\', background: isSelected ? VD.brand : hasEvent ? \'rgba(212, 67, 110, 0.08)\' : \'transparent\', borderRadius: 10, padding: \'6px 0\', cursor: \'pointer\', opacity: isPast && !hasEvent ? 0.35 : 1 }}>',
  '                  <div style={{ fontSize: \'13px\', fontWeight: 800, color: isSelected ? \'#fff\' : hasEvent ? VD.brand : VD.title }}>{day.date}</div>',
  '                  <div style={{ height: 4, display: \'flex\', justifyContent: \'center\', alignItems: \'center\' }}>{hasEvent && <span style={{ width: 5, height: 5, borderRadius: \'50%\', background: isSelected ? \'#fff\' : VD.gold }} />}</div>',
  '                </button>',
  '              );',
  '            })}',
  `          </${d}>`,
  `        </${d}>`,
  '',
].join('\n');

s = s.slice(0, c0) + mc + '\n' + s.slice(c1);

// add calendarDays before openKakao
if (!s.includes('const calendarDays = useMemo')) {
  s = s.replace(
    '  const openKakao = () => {',
    `  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ empty: true, key: \`e-\${i}\` });
    for (let d = 1; d <= lastDate; d++) {
      const fullDate = \`\${year}-\${String(month).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
      days.push({ empty: false, date: d, fullDate, key: fullDate });
    }
    return days;
  }, [calendarMonth]);

  const openKakao = () => {`
  );
}

fs.writeFileSync(p, s);
console.log('rollback month calendar ok');
