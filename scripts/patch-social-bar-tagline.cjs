const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

const badBlock = `        <div
          style={{
            marginTop: homeBlockSpace,
            paddingTop: 14,
            borderTop: '1px solid #F0F0F0',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color: '#D4436E', letterSpacing: '-0.3px' }}>
            만원의 행복
          </span>
        </motion.div>`;

const hrBlock = `        <hr style={{ ...homeSectionDividerStyle, margin: \`\${homeBlockSpace}px 0\` }} aria-hidden />`;

if (s.includes(badBlock)) {
  s = s.replace(badBlock, hrBlock);
} else if (s.includes('</motion.div>\n\n        {/* BAR')) {
  // fix typo only
  s = s.replace(
    /<div\n          style=\{\{\n            marginTop: homeBlockSpace,[\s\S]*?<\/motion\.motion.div>/,
    hrBlock
  );
}

const oldH2 = `<h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.3px' }}>
            Social BAR
          </h2>`;

const newH2 = `<h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.3px' }}>
            Social BAR
          </h2>
          <p style={{ margin: '6px 0 14px', fontSize: 11, fontWeight: 500, color: '#94A3B8', lineHeight: 1.45 }}>
            만원의 행복
          </p>`;

if (s.includes(oldH2)) {
  s = s.replace(oldH2, newH2);
}

s = s.replace(
  "background: '#ffffff', marginTop: homeBlockSpace }}>",
  "background: '#ffffff' }}>"
);

fs.writeFileSync(p, s);
console.log('patched');
