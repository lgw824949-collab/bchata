const fs = require('fs');
const p = 'src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('  const renderHeroPosters = ');
const end = s.indexOf('  const renderHomeQuickMenuInner = ');
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}

const replacement = `  const featuredRowTitle = (row, item) => {
    if (!item) {
      return isEn ? \`Explore \${row.labelEn}\` : \`\${row.label} 행사 둘러보기\`;
    }
    const raw = item.title || item.instructor || '';
    return translateDynamicText(cleanTitle(raw), isEn);
  };

  const featuredRowMeta = (row, item) => {
    if (!item) {
      return isEn ? 'Tap to browse' : '탭하여 둘러보기';
    }
    if (row.id === 'social') {
      const datePart = formatItemDate(item.date, item.time);
      const loc = translateDynamicText(item.locationName || item.address || '', isEn);
      return [datePart, loc].filter(Boolean).join(' · ');
    }
    if (row.id === 'bootcamp') {
      const d = (item.start_date || '').slice(0, 10);
      const loc = translateDynamicText(item.location || item.region || '', isEn);
      return [d, loc].filter(Boolean).join(' · ');
    }
    const start = (item.start_date || '').slice(0, 10);
    const end = (item.end_date || '').slice(0, 10);
    const datePart = end && end !== start ? \`\${start} – \${end}\` : start;
    const loc = translateDynamicText(item.location || item.region || '', isEn);
    return [datePart, loc].filter(Boolean).join(' · ');
  };

  const renderFeaturedStreamList = () => (
    <ul className="home-featured-stream" role="list" aria-label={isEn ? 'Featured events list' : '추천 행사 목록'}>
      {homeFeaturedRows.map((row) => {
        const pool = row.pool;
        const item = pool.length ? pool[row.idx % pool.length] : null;
        const isActive = activePosterSlot === row.id;
        const thumbSrc = item?.poster_url || row.fallback;
        const rowLabel = isEn ? row.labelEn : row.label;
        return (
          <li key={row.id} className="home-featured-stream__item" role="listitem">
            <motion.button
              type="button"
              className={\`home-featured-stream__row\${isActive ? ' is-active' : ''}\`}
              onClick={() => row.action(item)}
              whileTap={{ scale: 0.99 }}
            >
              <motion.div
                className="home-featured-stream__thumb"
                key={\`\${row.id}-\${item?.id || 'fallback'}\`}
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
              >
                <img
                  src={thumbSrc}
                  alt=""
                  loading="lazy"
                  onError={imgFallbackHandler(row.fallback)}
                />
              </motion.div>
              <motion.div className="home-featured-stream__body">
                <span className="home-featured-stream__category">{rowLabel}</span>
                <span className="home-featured-stream__title">{featuredRowTitle(row, item)}</span>
                <span className="home-featured-stream__meta">{featuredRowMeta(row, item)}</span>
              </motion.div>
            </motion.button>
          </li>
        );
      })}
    </ul>
  );

`;

s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(p, s);
console.log('patched renderFeaturedStreamList');
