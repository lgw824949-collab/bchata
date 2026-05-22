const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

s = s.replace(/\n  const \[kingMenuOpen, setKingMenuOpen\] = useState\(false\);\n/, '\n');
s = s.replace(/\n  const kingMenuItems = \[[\s\S]*?\];\n\n  const homePartySectionTitleStyle/, '\n\n  const homePartySectionTitleStyle');

const quickMenuBlock = `          <motion.div
            className="quick-menu-scroll"
            style={{
              display: 'flex',
              gap: '8px',
              width: '100%',
              marginBottom: '16px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {[
              { icon: <Calendar size={32} strokeWidth={1.2} color="#D4436E" />, label: '행사달력', particles: '📅', action: () => setShowFullCalendar(true) },
              { icon: <MapPin size={32} strokeWidth={1.2} color="#D4436E" />, label: '위치·대관', particles: '📍', action: () => setShowRentalModal(true) },
              { icon: <Users size={32} strokeWidth={1.2} color="#C9A84C" />, label: '파트너', particles: '💑', action: () => { window.history.pushState({}, '', '#partner'); setActiveTab('partner'); } },
              { icon: <Users size={32} strokeWidth={1.2} color="#C9A84C" />, label: '강사찾기', particles: '🕺', action: () => { localStorage.setItem('instructor_target_genre', '전체'); setView('instructors'); window.history.pushState({}, '', '/instructors'); window.dispatchEvent(new PopStateEvent('popstate')); setTimeout(() => { window.dispatchEvent(new CustomEvent('apply-instructor-filter')); }, 300); } },
              { textIcon: '1:1', label: '채팅문의', particles: '💬', action: () => window.open('https://open.kakao.com/o/gP43rNri', '_blank') },
              { icon: <MessageSquare size={32} strokeWidth={1.2} color="#C9A84C" />, label: '컨시어지', particles: '✨', action: () => window.dispatchEvent(new CustomEvent('open-chatbot')) },
              { icon: <Star size={32} strokeWidth={1.2} color="#C9A84C" />, label: '운명의좌표', particles: '🌟', action: () => { window.history.pushState({}, '', '#saju'); setShowSaju(true); } },
              { icon: <Heart size={32} strokeWidth={1.2} color="#C9A84C" />, label: '찜하기', particles: '❤️', action: () => { window.history.pushState({}, '', '#wishlist'); setShowWishlist(true); } },
              { icon: <Utensils size={32} strokeWidth={1.2} color="#C9A84C" />, label: '맛집뒷풀이', particles: '🍽', action: () => { window.history.pushState({}, '', '#restaurant'); setView('restaurant'); } },
              { icon: <Camera size={32} strokeWidth={1.2} color="#C9A84C" />, label: '라이브픽', particles: '📸', action: () => { window.history.pushState({}, '', '#community'); setView('community'); } },
              { icon: <CloudSun size={32} strokeWidth={1.2} color="#C9A84C" />, label: '오늘날씨', particles: '☀️', action: () => { window.history.pushState({}, '', '#weather'); setShowWeather(true); } },
              { icon: <Navigation size={32} strokeWidth={1.2} color="#C9A84C" />, label: '지능형경로', particles: '🧭', action: () => { window.history.pushState({}, '', '#route'); openAnalysis(false); } },
            ].map((item, idx) => (
              <motion.div
                key={\`quick-\${idx}\`}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { triggerParticle(e, item.particles); item.action(); }}
                style={{ ...quickMenuFloatStyle, position: 'relative', width: 'calc(22% - 6px)', minWidth: 'calc(22% - 6px)', flexShrink: 0, scrollSnapAlign: 'start' }}
              >
                {item.textIcon ? (
                  <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px', fontSize: 18, fontWeight: 900, color: '#C9A84C', letterSpacing: '-0.8px' }}>{item.textIcon}</motion.div>
                ) : (
                  <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px' }}>{item.icon}</motion.div>
                )}
                <span style={{ ...quickMenuLabelStyle, fontSize: '11px' }}>{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
`;

const marker = `          </motion.div>
          <motion.div style={{
            display: 'flex', overflowX: 'auto', gap: '8px', padding: '0 0 16px',
            borderBottom: '1px solid #F1F5F9', flexShrink: 0, scrollbarWidth: 'none'
          }}>`;

// Find marker only in BAR section (after 공간 등록)
const barAnchor = s.indexOf('공간 등록');
const idx = s.indexOf(marker, barAnchor);
if (idx === -1) {
  // try with </motion.div> -> actually it's </div>
  const marker2 = `          </div>
          <motion.div style={{
            display: 'flex', overflowX: 'auto', gap: '8px', padding: '0 0 16px',
            borderBottom: '1px solid #F1F5F9', flexShrink: 0, scrollbarWidth: 'none'
          }}>`;
  const idx2 = s.indexOf(marker2, barAnchor);
  if (idx2 === -1) {
    console.error('marker not found');
    process.exit(1);
  }
  s = s.slice(0, idx2 + '          </div>\n'.length) + quickMenuBlock + '\n' + s.slice(idx2 + '          </motion.div>\n'.length);
} else {
  s = s.slice(0, idx + '          </motion.div>\n'.length) + quickMenuBlock + '\n' + s.slice(idx + '          </motion.div>\n'.length);
}

fs.writeFileSync(p, s.replace(/\n/g, '\r\n'));
console.log('done');
