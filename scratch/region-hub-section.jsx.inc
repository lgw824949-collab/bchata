      {/* 지역 pill + 일정 + 원형 파티 그리드 (RentalModal 레이아웃 참고) */}
      <section style={{ padding: '0 16px 20px', marginBottom: '8px' }}>
        <style>{`.region-pill-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div
          className="region-pill-scroll"
          style={{
            display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '14px',
            scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch',
          }}
        >
          {REGION_PILLS.map((pill) => {
            const isSelected = homeRegionPill === pill.value;
            const count =
              pill.value === '전체'
                ? (parties || []).filter((p) => p.date === selectedDate).length
                : (parties || []).filter((p) => p.date === selectedDate && matchRegionPill(p, pill.value)).length;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => handleRegionPillClick(pill.value)}
                style={{
                  flexShrink: 0, padding: '8px 16px', borderRadius: '100px',
                  border: isSelected ? 'none' : '1px solid #eee',
                  background: isSelected ? '#D4436E' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#64748B',
                  fontWeight: isSelected ? 900 : 700, fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <span>{pill.label}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '100px',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                  color: isSelected ? '#fff' : '#475569',
                }}>{count}</span>
              </button>
            );
          })}
        </motion.div>

        <button
          type="button"
          onClick={() => handleOpenModal(setShowFullCalendar, true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px 16px', marginBottom: '12px', borderRadius: '12px', border: '1px solid #E2E8F0',
            background: '#fff', color: '#1E293B', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <CalendarDays size={18} color="#D4436E" />
          {lang === 'ko' ? '전체일정 달력' : 'Full calendar'}
        </button>

        <motion.div
          className="region-pill-scroll"
          style={{
            display: 'flex', overflowX: 'auto', gap: '8px', padding: '4px 0 12px',
            msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          }}
        >
          {fourteenDays.map((item) => {
            const isSelected = selectedDate === item.fullDate;
            const isHoliday = item.dayOfWeek === 0 || (item.month === '5' && item.date === '5');
            const isSaturday = item.dayOfWeek === 6;
            const dayColor = isSelected ? '#fff' : (isHoliday ? '#FF1744' : (isSaturday ? '#FF1744' : '#94A3B8'));
            const labelColor = isSelected ? '#D4436E' : (isHoliday ? '#FF1744' : (isSaturday ? '#FF1744' : '#94A3B8'));
            const hasEvent = (parties || []).some(
              (p) => p.date === item.fullDate && matchRegionPill(p, homeRegionPill)
            );
            return (
              <motion.div
                key={item.fullDate}
                onClick={() => {
                  setSelectedDate(item.fullDate);
                  setActiveDateGenre('전체');
                  setIsFilterBarVisible(true);
                }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minWidth: '44px', cursor: 'pointer', position: 'relative', paddingBottom: '6px',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: labelColor, marginBottom: '2px' }}>{item.dayName}</span>
                <motion.div style={{
                  width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isSelected ? '#D4436E' : 'transparent',
                  border: item.isToday && !isSelected ? '1px solid #D4436E' : 'none',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#fff' : dayColor }}>{item.date}</span>
                </motion.div>
                <motion.div style={{ height: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 0 }}>
                  {hasEvent && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D4436E' }} />}
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          key={`${homeRegionPill}-${selectedDate}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px 8px',
            marginBottom: '16px', minHeight: regionHubDayParties.length ? 'auto' : '72px',
          }}
        >
          {regionHubDayParties.length > 0 ? (
            regionHubDayParties.map(renderRegionPartyCircle)
          ) : (
            <motion.div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px 8px', color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>
              {lang === 'ko' ? '선택한 지역·날짜에 예정된 파티가 없습니다.' : 'No parties for this region and date.'}
            </motion.div>
          )}
        </motion.div>

        <button
          type="button"
          onClick={() => setShowRentalModal(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px 16px', borderRadius: '14px', border: 'none', background: '#D4436E', color: '#fff',
            fontSize: '15px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(212, 67, 110, 0.35)',
          }}
        >
          <MapPin size={18} />
          {lang === 'ko' ? '대관문의' : 'Venue rental inquiry'}
        </button>
      </section>
