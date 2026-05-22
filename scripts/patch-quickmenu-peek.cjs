const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('        <div\n          className="quick-menu-peek-wrap"');
const end = s.indexOf('        <hr style={{ ...homeSectionDividerStyle, margin: `${homeBlockSpace}px 0` }} aria-hidden />', start);
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const block = `        <div className="quick-menu-peek-wrap" style={{ marginBottom: homeBlockSpace }}>
          <div className="quick-menu-scroll">
            {quickMenuItems.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { triggerParticle(e, item.particles); item.action(); }}
                style={{
                  ...quickMenuTileStyle,
                  ...(item.registerHighlight ? quickMenuRegisterHighlightStyle : {}),
                }}
              >
                {item.textIcon ? (
                  <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px', fontSize: 18, fontWeight: 900, color: '#C9A84C', letterSpacing: '-0.8px' }}>{item.textIcon}</motion.div>
                ) : (
                  <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px' }}>{item.icon}</motion.div>
                )}
                <span style={{
                  ...quickMenuLabelStyle,
                  fontSize: '11px',
                  ...(item.registerHighlight ? { color: '#D4436E', fontWeight: 800 } : {}),
                }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

`;

s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(p, s);
console.log('patched quick menu peek');
