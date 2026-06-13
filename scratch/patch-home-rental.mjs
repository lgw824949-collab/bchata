import fs from 'fs';

const p = 'src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

const startMarker = '        {/* 전국 BAR · 대관 (RentalModal 인라인) */}';
const start = s.indexOf(startMarker);
const partnerIdx = s.indexOf('        <p style={homePartnerSectionTitleStyle}>파트너 & 강사</p>', start);
const sectionEnd = partnerIdx === -1 ? -1 : s.lastIndexOf('        </section>', partnerIdx);
if (start === -1 || sectionEnd === -1) {
  console.error('block markers not found', start, sectionEnd);
  process.exit(1);
}
const endIdx = sectionEnd + '        </section>'.length;

const newBlock = `        {/* RentalModal 인라인: 지역 pill + 원형 그리드 */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
          <motion.div style={{
            display: 'flex', overflowX: 'auto', gap: '8px', padding: '0 0 16px',
            borderBottom: '1px solid #F1F5F9', flexShrink: 0, scrollbarWidth: 'none'
          }}>
            {['전체', ...REGIONS_ORDER].map((tab) => {
              const isSelected = selectedRegionTab === tab;
              const count = tab === '전체' ? locations.length : locations.filter(b => b.region === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setSelectedRegionTab(tab)}
                  style={{
                    flexShrink: 0,
                    padding: '8px 16px',
                    background: isSelected ? '#FFF1F2' : '#F8FAFC',
                    color: isSelected ? '#E53935' : '#64748B',
                    border: isSelected ? '1px solid #FECDD3' : '1px solid #E2E8F0',
                    borderRadius: '100px',
                    fontWeight: isSelected ? 950 : 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{tab}</span>
                  <span style={{
                    fontSize: '10px',
                    background: isSelected ? '#E53935' : '#E2E8F0',
                    color: isSelected ? '#ffffff' : '#475569',
                    padding: '1px 6px',
                    borderRadius: '100px',
                    fontWeight: 800
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </motion.div>

          <motion.div style={{ padding: '20px 0', flex: 1 }}>
            {isLoading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                전국 BAR 정보를 정렬하는 중...
              </div>
            ) : (
              (() => {
                const filteredBars = selectedRegionTab === '전체'
                  ? locations
                  : locations.filter(bar => bar.region === selectedRegionTab);

                if (filteredBars.length === 0) {
                  return (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>
                      해당 지역에 등록된 제휴 공간이 없습니다.
                    </div>
                  );
                }

                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={selectedRegionTab}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '20px 8px'
                    }}
                  >
                    {filteredBars.map(renderBarCard)}
                  </motion.div>
                );
              })()
            )}
          </motion.div>
        </div>

`;

s = s.slice(0, start) + newBlock + s.slice(endIdx);

const popupStart = s.indexOf('      <AnimatePresence>\n        {rentalSelectedBar && (');
if (popupStart !== -1) {
  const popupEnd = s.indexOf('      </AnimatePresence>\n\n      {/* 기존 메인 가로 스크롤', popupStart);
  if (popupEnd !== -1) {
    s = s.slice(0, popupStart) + s.slice(popupEnd);
  }
}

fs.writeFileSync(p, s);
console.log('patched ok');
