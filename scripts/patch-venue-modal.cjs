const fs = require('fs');
const p = 'c:/dev/bchata/src/components/VenueDetailModal.jsx';
let s = fs.readFileSync(p, 'utf8');
const x = '</motion.div>';
const x2 = '</' + 'div>';

const descBlock = [
  '          <div',
  '            style={{',
  '              marginTop: 12,',
  '              marginBottom: 16,',
  '              padding: 14,',
  '              borderRadius: 14,',
  '              border: `1px solid ${VD.borderAccent}`,',
  "              background: '#fff',",
  '            }}',
  '          >',
  "            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>",
  '              <span style={{ fontSize: 12, fontWeight: 800, color: VD.brand }}>상세 설명</span>',
  '              <span style={{ fontSize: 11, fontWeight: 600, color: VD.faint }}>{venueDescription.length}/{VENUE_DESC_MAX}</span>',
  '            ' + x2,
  '            <textarea',
  '              value={venueDescription}',
  '              onChange={(e) => setVenueDescription(e.target.value.slice(0, VENUE_DESC_MAX))}',
  '              rows={3}',
  '              maxLength={VENUE_DESC_MAX}',
  '              placeholder="운영 시간, 주차, 드레스코드 등"',
  '              style={{',
  "                width: '100%',",
  '                padding: 12,',
  '                borderRadius: 12,',
  '                border: `1px solid ${VD.border}`,',
  '                fontSize: 13,',
  '                lineHeight: 1.5,',
  '                color: VD.body,',
  "                resize: 'none',",
  "                boxSizing: 'border-box',",
  "                fontFamily: 'inherit',",
  '              }}',
  '            />',
  '            <button',
  '              type="button"',
  '              onClick={saveVenueDescription}',
  '              disabled={savingDescription}',
  '              style={{',
  '                marginTop: 8,',
  "                width: '100%',",
  '                padding: 9,',
  '                borderRadius: 10,',
  "                border: 'none',",
  '                background: VD.brand,',
  "                color: '#fff',",
  '                fontWeight: 800,',
  '                fontSize: 12,',
  '                cursor: savingDescription ? "not-allowed" : "pointer",',
  '                opacity: savingDescription ? 0.7 : 1,',
  '              }}',
  '            >',
  "              {savingDescription ? '저장 중…' : '저장'}",
  '            </button>',
  '          ' + x2,
].join('\n');

const scheduleBlock = [
  '          {schedulePosters.length > 0 && (',
  '            <div style={{ marginBottom: 16 }}>',
  '              <p style={{ fontSize: 12, fontWeight: 800, color: VD.brand, margin: "0 0 8px" }}>행사 일정</p>',
  "              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>",
  '                {schedulePosters.map(({ date, party: p }) => {',
  '                  const dt = new Date(date);',
  '                  return (',
  '                    <button',
  '                      key={`${p.id}-${date}`}',
  '                      type="button"',
  '                      onClick={() => setSelectedDate(date)}',
  '                      style={{',
  '                        flexShrink: 0,',
  '                        padding: 4,',
  '                        borderRadius: 10,',
  '                        border: selectedDate === date ? `2px solid ${VD.brand}` : `1px solid ${VD.border}`,',
  "                        background: '#fff',",
  "                        cursor: 'pointer',",
  '                      }}',
  '                    >',
  '                      {p.poster_url ? (',
  '                        <img src={p.poster_url} alt="" style={{ width: 64, height: 88, objectFit: "cover", borderRadius: 8, display: "block" }} />',
  '                      ) : (',
  '                        <motion.div style={{ width: 64, height: 88, background: "#F1F5F9", borderRadius: 8 }} />',
  '                      )}',
  '                      <span style={{ fontSize: 10, fontWeight: 800, color: VD.muted, display: "block", marginTop: 4, textAlign: "center" }}>',
  '                        {dt.getMonth() + 1}/{dt.getDate()}',
  '                      </span>',
  '                    </button>',
  '                  );',
  '                })}',
  '              ' + x2,
  '            ' + x2,
  '          )}',
].join('\n');

// fix motion.div placeholder in schedule
const scheduleFixed = scheduleBlock.replace(
  '<motion.div style={{ width: 64, height: 88, background: "#F1F5F9", borderRadius: 8 }} />',
  '<div style={{ width: 64, height: 88, background: "#F1F5F9", borderRadius: 8 }} />'
);

const oldStart = '          {otherDates.length > 0 && (';
const oldEnd = "          <div style={{ display: 'flex', gap: '10px', paddingTop: otherDates.length > 0 ? 0 : 4 }}>";
const i0 = s.indexOf(oldStart);
const i1 = s.indexOf(oldEnd);
if (i0 < 0 || i1 < 0) {
  console.error('block not found', i0, i1);
  process.exit(1);
}
const newEnd = "          <div style={{ display: 'flex', gap: '10px', paddingTop: 4 }}>";
s = s.slice(0, i0) + descBlock + '\n\n' + scheduleFixed + '\n\n' + newEnd + s.slice(i1 + oldEnd.length);

fs.writeFileSync(p, s);
console.log('patched');
