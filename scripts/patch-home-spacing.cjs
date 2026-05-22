const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

// Fix hero JSX mismatches (motion.div opened, div closed)
s = s.replace(
  /onError=\{\(e\) => \{ e\.currentTarget\.style\.display = 'none' \}\}\r?\n\s*\/>\r?\n\s*<\/motion.div>\r?\n\s*\)\}/,
  (m) => m.replace('</motion.div>', '</motion.div>')
);
// Actually fix div close after logo
s = s.replace(
  /(\s*onError=\{\(e\) => \{ e\.currentTarget\.style\.display = 'none' \}\}\r?\n\s*\/>\r?\n)\s*<\/motion.div>/,
  '$1        </motion.div>'
);
// Fix: if still </motion.div> wrong - read file
if (s.includes('onError={(e) => { e.currentTarget.style.display = \'none\' }}\n          />\n        </motion.div>')) {
  s = s.replace(
    'onError={(e) => { e.currentTarget.style.display = \'none\' }}\n          />\n        </motion.div>',
    'onError={(e) => { e.currentTarget.style.display = \'none\' }}\n          />\n        </motion.div>'
  );
}

// Logo block: </div> -> </motion.div>
s = s.replace(
  /style=\{\{ width: '44px', height: '44px'[\s\S]*?onError=\{\(e\) => \{ e\.currentTarget\.style\.display = 'none' \}\}\r?\n\s*\/>\r?\n\s*<\/motion.div>/,
  (block) => block.replace(/<\/motion.div>\s*$/, '</motion.div>')
);

// Simpler line-based fix
const lines = s.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('e.currentTarget.style.display') && lines[i + 2]?.trim() === '</motion.div>') {
    lines[i + 2] = '        </motion.div>';
  }
}
s = lines.join('\n');

// Region row close before LIVE comment
const liveIdx = s.indexOf('{/* 🔴 [LIVE 바 임팩트 영역 개편] */}');
if (liveIdx > 0) {
  const before = s.slice(0, liveIdx);
  const after = s.slice(liveIdx);
  const fixedBefore = before.replace(
    /\}\)\}\r?\n\s*<\/motion.div>\r?\n\s*<\/>\r?\n\s*\)\}\r?\n\s*<\/motion.div>\s*$/m,
    '})}\n        </motion.div>\n        </>\n        )}\n      </motion.div>'
  );
  if (fixedBefore !== before) s = fixedBefore + after;
  else {
    s = before.replace(
      /\}\)\}\r?\n\s*<\/motion.div>\r?\n\s*<\/>\r?\n\s*\)\}\r?\n\s*<\/motion.div>\r?\n\s*$/m,
      '})}\n        </motion.div>\n        </>\n        )}\n      </motion.div>\n\n      '
    ) + after;
  }
}

// Spacing updates
s = s.replace(
  "paddingBottom: '80px'",
  "paddingBottom: '100px'"
);
s = s.replace(
  "{/* 🔴 [LIVE 바 임팩트 영역 개편] */}\n      <div style={{ padding: '0 16px', marginBottom: '20px' }}>",
  "{/* 🔴 [LIVE 바 임팩트 영역 개편] */}\n      <motion.div style={{ padding: '0 20px', marginBottom: homeSectionSpace }}>"
);
s = s.replace(
  '<div id="quickmenu-section" style={{ padding: \'0 16px\', marginBottom: \'20px\' }}>',
  '<div id="quickmenu-section" style={{ padding: \'0 20px\', marginBottom: homeSectionSpace + 4 }}>'
);
s = s.replace(
  '<div style={{ display: \'flex\', gap: \'8px\', marginBottom: \'20px\' }}>',
  `<div style={{ display: 'flex', gap: 12, marginBottom: homeBlockSpace }}>`
);
s = s.replace(
  'aspect-ratio: 9 / 16;',
  'aspect-ratio: 2 / 3;'
);
s = s.replace(
  `              marginBottom: '16px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {quickMenuItems.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { triggerParticle(e, item.particles); item.action(); }}
                style={{ ...quickMenuFloatStyle, position: 'relative', width: 'calc(22% - 6px)', minWidth: 'calc(22% - 6px)', flexShrink: 0, scrollSnapAlign: 'start' }}
              >`,
  `              marginTop: 4,
              marginBottom: homeBlockSpace,
              padding: '8px 2px 12px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              gap: 12,
            }}
          >
            {quickMenuItems.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { triggerParticle(e, item.particles); item.action(); }}
                style={quickMenuTileStyle}
              >`
);
s = s.replace(
  `          <motion.div style={{
            display: 'flex', overflowX: 'auto', gap: '8px', padding: '0 0 16px',
            borderBottom: '1px solid #F1F5F9', flexShrink: 0, scrollbarWidth: 'none',
            alignItems: 'center',
          }}>`,
  `          <motion.div style={{
            display: 'flex', overflowX: 'auto', gap: 10, padding: '12px 0 20px',
            marginTop: 8,
            borderBottom: '1px solid #F1F5F9', flexShrink: 0, scrollbarWidth: 'none',
            alignItems: 'center',
          }}>`
);
s = s.replace(
  `padding: '8px 14px',
                borderRadius: 100,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#334155',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Plus size={14}`,
  `padding: '10px 16px',
                borderRadius: 100,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#334155',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                minHeight: 40,
              }}
            >
              <Plus size={14}`
);
s = s.replace(
  `padding: '8px 16px',
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
                  }}`,
  `padding: '10px 18px',
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
                    transition: 'all 0.2s ease',
                    minHeight: 40,
                  }}`
);
s = s.replace(
  `<motion.div style={{ padding: '12px 0 4px', flex: 1 }}>`,
  `<motion.div style={{ padding: '20px 0 8px', flex: 1 }}>`
);
s = s.replace(
  `style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}`,
  `style={{ display: 'flex', flexDirection: 'column', gap: 14 }}`
);
s = s.replace(
  `gap: '10px',
                        minHeight: '72px',`,
  `gap: 14,
                        minHeight: 80,
                        paddingTop: 4,`
);

// Region bucket cards
s = s.replace(
  `padding: '12px',
                  borderRadius: '14px',
                  border: isSelected ? '1.5px solid #C9A84C' : '1px solid #F0F0F0',
                  background: isSelected ? '#FFFBF0' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >

                <div style={{ fontSize: '12px', fontWeight: 400, color: '#999999', marginBottom: '4px'`,
  `padding: '14px 12px',
                  borderRadius: '16px',
                  border: isSelected ? '1.5px solid #C9A84C' : '1px solid #F0F0F0',
                  background: isSelected ? '#FFFBF0' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  minHeight: 72,
                }}
              >

                <motion.div style={{ fontSize: '12px', fontWeight: 400, color: '#999999', marginBottom: 6`
);

fs.writeFileSync(p, s);
console.log('spacing patch done');
