const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('        {renderHomeSectionHeader(\n          isEn ? \'Quick actions\' : \'빠른 메뉴\',');
const end = s.indexOf('        <hr style={{ ...homeSectionDividerStyle, margin: `${homeBlockSpace}px 0` }} aria-hidden />\n\n        {/* BAR 쉘:', start);
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const block = `        {renderHomeSectionHeader(
          isEn ? 'Quick actions' : '빠른 메뉴',
          isEn ? 'Top picks · swipe for more' : '자주 쓰는 메뉴 · 옆으로 밀면 더보기',
        )}
        <div style={{ marginBottom: homeBlockSpace }}>
          <div className="quick-menu-primary-row">
            {quickMenuPrimary.map((item) => renderQuickMenuCircle(item))}
          </div>
          {quickMenuMore.length > 0 && (
            <motion.div className="quick-menu-more-wrap">
              <p style={{ margin: '0 0 8px 4px', fontSize: 11, fontWeight: 600, color: HOME_TEXT_MUTED }}>
                {isEn ? 'More' : '더보기'}
              </p>
              <div className="quick-menu-more-scroll">
                {quickMenuMore.map((item) => renderQuickMenuCircle(item, { compact: true }))}
              </div>
            </motion.div>
          )}
        </motion.div>

`;

s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(p, s);
console.log('patched quick menu circles');
