import React from 'react';

const inputStyle = {
  width: '100%',
  padding: '18px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#1A1A1A',
  fontSize: 15,
  color: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 900,
  color: '#C9A84C',
  marginBottom: 10,
  letterSpacing: '1.5px',
};

/**
 * 부트캠프·페스티벌 등록: 당일(1일) / 기간(1박2일 등) 날짜 입력
 */
export default function EventDateFields({
  isOneDay,
  onOneDayChange,
  start_date,
  end_date,
  onDatesChange,
  startLabel = '6. 시작일',
  endLabel = '7. 종료일',
  compact = false,
}) {
  const fieldStyle = { ...inputStyle, padding: compact ? '20px' : '18px' };
  const festivalLabel = compact
    ? { display: 'block', fontSize: '12px', fontWeight: 900, color: '#C9A84C', marginBottom: '12px', letterSpacing: '1.5px' }
    : labelStyle;

  const setOneDay = (oneDay) => {
    onOneDayChange(oneDay);
    if (oneDay && start_date) {
      onDatesChange({ start_date, end_date: start_date });
    }
  };

  const onSingleDate = (value) => {
    onDatesChange({ start_date: value, end_date: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 20 : 16 }}>
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {[
            [true, '당일 행사 (1일)'],
            [false, '기간 행사 (1박2일 등)'],
          ].map(([val, label]) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setOneDay(val)}
              style={{
                flex: 1,
                padding: compact ? '14px 10px' : '14px 8px',
                borderRadius: 14,
                fontWeight: 900,
                fontSize: compact ? 13 : 12,
                cursor: 'pointer',
                border: `1px solid ${isOneDay === val ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                background: isOneDay === val ? 'rgba(201,168,76,0.15)' : '#1A1A1A',
                color: isOneDay === val ? '#C9A84C' : '#8E8E93',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: '#8E8E93', lineHeight: 1.5 }}>
          {isOneDay
            ? '하루짜리 파티·워크숍은 날짜 하나만 선택하면 됩니다.'
            : '1박 2일·2박 3일 등은 시작일과 종료일을 각각 선택하세요.'}
        </p>
      </div>

      {isOneDay ? (
        <div>
          <label style={festivalLabel}>행사 날짜</label>
          <input
            type="date"
            required
            value={start_date}
            onChange={(e) => onSingleDate(e.target.value)}
            style={fieldStyle}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? 15 : 12 }}>
          <div>
            <label style={festivalLabel}>{startLabel}</label>
            <input
              type="date"
              required
              value={start_date}
              onChange={(e) => onDatesChange({ start_date: e.target.value, end_date })}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={festivalLabel}>{endLabel}</label>
            <input
              type="date"
              required
              value={end_date}
              min={start_date || undefined}
              onChange={(e) => onDatesChange({ start_date, end_date: e.target.value })}
              style={fieldStyle}
            />
          </div>
        </div>
      )}
    </div>
  );
}
