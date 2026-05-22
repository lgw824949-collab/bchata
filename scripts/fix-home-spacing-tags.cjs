const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

const posterClose = '        </div>\n\n        {/* BAR 쉘: 지역 pill + 원형 그리드 */}';
const posterCloseFixed = '        </motion.div>\n\n        {/* BAR 쉘: 지역 pill + 원형 그리드 */}';
if (!s.includes(posterClose)) {
  console.error('poster close not found');
  process.exit(1);
}
s = s.replace(posterClose, posterCloseFixed);

const oldQuickScroll = `            style={{
              display: 'flex',
              gap: '8px',
              width: '100%',
              marginTop: 4,
              marginBottom: homeBlockSpace,
              padding: '8px 2px 12px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              gap: 12,
            }}`;

const newQuickScroll = `            style={{
              display: 'flex',
              width: '100%',
              marginTop: 0,
              marginBottom: homeSectionSpace,
              padding: '4px 2px 16px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              gap: 14,
            }}`;

if (!s.includes(oldQuickScroll)) {
  console.error('quick scroll block not found');
  process.exit(1);
}
s = s.replace(oldQuickScroll, newQuickScroll);

fs.writeFileSync(p, s);
console.log('patched');
