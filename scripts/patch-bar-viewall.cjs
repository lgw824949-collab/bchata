const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

const newBlock = `                const previewBars = getBarPreviewList(filteredBars);
                const showExpandToggle = filteredBars.length > previewBars.length;
                const remainingBarCount = filteredBars.length - previewBars.length;

                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={selectedRegionTab}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <motion.div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        padding: '2px 0 4px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      {previewBars.map((bar) => renderBarCard(bar, { carousel: true }))}
                      {showExpandToggle && (
                        <button
                          type="button"
                          onClick={() => setBarListExpanded((v) => !v)}
                          style={{
                            width: '72px',
                            flexShrink: 0,
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              background: barListExpanded ? '#FFF1F2' : '#F8FAFC',
                              border: barListExpanded ? '1.5px solid #FECDD3' : '1.5px dashed #CBD5E1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '6px',
                              color: barListExpanded ? '#E53935' : '#64748B',
                              fontSize: '13px',
                              fontWeight: 900,
                            }}
                          >
                            {barListExpanded ? (
                              <ChevronRight size={18} style={{ transform: 'rotate(-90deg)' }} />
                            ) : (
                              \`+\${remainingBarCount}\`
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              color: barListExpanded ? '#E53935' : '#64748B',
                              textAlign: 'center',
                              lineHeight: 1.25,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {barListExpanded ? (isEn ? 'Close' : '접기') : (isEn ? 'View all' : '전체 보기')}
                          </span>
                        </button>
                      )}
                    </motion.div>

                    `;

const start = s.indexOf('                const previewBars = getBarPreviewList(filteredBars);');
const marker = s.indexOf('                    {barListExpanded && (', start);
if (start < 0 || marker < 0) {
  console.error('markers not found', start, marker);
  process.exit(1);
}

s = s.slice(0, start) + newBlock + s.slice(marker);
fs.writeFileSync(p, s);
console.log('patched');
