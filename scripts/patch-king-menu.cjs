const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

const anchor = '        {/* BAR 쉘: 지역 pill + 원형 그리드 */}';
const anchorIdx = s.indexOf(anchor);
if (anchorIdx === -1) {
  console.error('anchor not found');
  process.exit(1);
}

const btnStart = s.indexOf(
  "          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>",
  anchorIdx
);
if (btnStart === -1) {
  console.error('button row not found');
  process.exit(1);
}

const regionPillsStart = s.indexOf(
  '          <motion.div style={{\n            display: \'flex\', overflowX: \'auto\'',
  btnStart
);
if (regionPillsStart === -1) {
  console.error('region pills not found');
  process.exit(1);
}

const kingBlock = `          <motion.div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowBarRegisterForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '8px 14px',
                  borderRadius: 100,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#334155',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                공간 등록
              </button>
              <button
                type="button"
                onClick={() => setKingMenuOpen((open) => !open)}
                aria-expanded={kingMenuOpen}
                aria-label={kingMenuOpen ? '퀵메뉴 닫기' : '퀵메뉴 열기'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: kingMenuOpen ? '1.5px solid #C9A84C' : '1px solid #E2E8F0',
                  background: kingMenuOpen ? '#FFFBF0' : '#F8FAFC',
                  color: kingMenuOpen ? '#B8860B' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus
                  size={18}
                  strokeWidth={2.5}
                  style={{ transition: 'transform 0.25s ease', transform: kingMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                />
              </button>
            </div>
            <AnimatePresence initial={false}>
              {kingMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ overflow: 'hidden', marginTop: 10 }}
                >
                  <motion.div
                    className="quick-menu-scroll"
                    style={{
                      display: 'flex',
                      gap: 8,
                      overflowX: 'auto',
                      scrollSnapType: 'x mandatory',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch',
                      paddingBottom: 2,
                    }}
                  >
                    {kingMenuItems.map((item, idx) => (
                      <motion.div
                        key={\`king-\${idx}\`}
                        whileTap={{ scale: 0.92 }}
                        onClick={(e) => {
                          triggerParticle(e, item.particles);
                          item.action();
                          setKingMenuOpen(false);
                        }}
                        style={{
                          ...quickMenuFloatStyle,
                          position: 'relative',
                          width: 'calc(22% - 6px)',
                          minWidth: 'calc(22% - 6px)',
                          flexShrink: 0,
                          scrollSnapAlign: 'start',
                          height: '86px',
                        }}
                      >
                        <motion.div style={{ ...quickMenuIconWrapStyle, width: '40px', height: '40px' }}>{item.icon}</motion.div>
                        <span style={{ ...quickMenuLabelStyle, fontSize: '10px' }}>{item.label}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
`;

s = s.slice(0, btnStart) + kingBlock + s.slice(regionPillsStart);
fs.writeFileSync(p, s);
console.log('patched king menu UI');
