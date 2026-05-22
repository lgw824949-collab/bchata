const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let s = fs.readFileSync(p, 'utf8');

const oldBlock = `  const homePartySectionTitleStyle = {
    fontSize: '14px',
    fontWeight: 800,
    color: '#1A1A1A',
    margin: '0 0 12px',
    paddingLeft: '10px',
    borderLeft: '3px solid #D4436E',
    lineHeight: 1.4,
  };
  const homePartnerSectionTitleStyle = {
    fontSize: '14px',
    fontWeight: 800,
    color: '#1A1A1A',
    margin: '20px 0 12px',
    paddingLeft: '10px',
    borderLeft: '3px solid #C9A84C',
    lineHeight: 1.4,
  };
  const homeSectionSpace = 36;
  const homeBlockSpace = 26;
  const homeSubtitleStyle = { margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: '#475569', lineHeight: 1.5 };
  const homeSectionDividerStyle = { height: 1, background: '#F0F0F0', margin: '0 20px', border: 'none' };
  const todayPartyBucketThemes = [
    { bg: '#FFF1F2', border: '#FDA4AF', label: '#BE123C', count: '#E11D48', unit: '#E11D48', districts: '#9F1239' },
    { bg: '#EFF6FF', border: '#93C5FD', label: '#1D4ED8', count: '#2563EB', unit: '#2563EB', districts: '#1E40AF' },
    { bg: '#F0FDF4', border: '#86EFAC', label: '#15803D', count: '#16A34A', unit: '#16A34A', districts: '#166534' },
  ];
  const quickMenuRegisterTileStyle = {
    width: '52px',
    minWidth: '52px',
    minHeight: '62px',
    padding: '4px 3px 3px',
    borderRadius: '10px',
    alignSelf: 'flex-start',
    marginTop: 4,
  };
  const quickMenuRegisterHighlightStyle = {
    background: '#FFFBFC',
    border: '1px solid #F5D0E0',
    boxShadow: '0 1px 2px rgba(212, 67, 110, 0.05)',
  };
  const quickMenuRegisterIconWrapStyle = {
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  const quickMenuRegisterLabelStyle = {
    color: '#D4436E',
    fontWeight: 700,
    fontSize: '9px',
    marginTop: '3px',
    textAlign: 'center',
    lineHeight: 1.2,
    letterSpacing: '-0.4px',
    whiteSpace: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  };
  const quickMenuFloatStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFFFF',
    border: '1px solid #F0F0F0',
    borderRadius: '16px',
    padding: '12px 10px 10px',
    cursor: 'pointer',
    width: '100%',
    minHeight: '102px',
    boxSizing: 'border-box',
  };
  const quickMenuTileStyle = {
    ...quickMenuFloatStyle,
    position: 'relative',
    width: '80px',
    minWidth: '80px',
    flexShrink: 0,
    scrollSnapAlign: 'start',
  };
  const quickMenuIconWrapStyle = { width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  const quickMenuLabelStyle = { color: '#1A1A1A', fontWeight: 700, fontSize: '13px', marginTop: '8px', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' };`;

const newBlock = `  const HOME_BRAND = '#D4436E';
  const HOME_BRAND_SOFT = '#FFF5F7';
  const HOME_BRAND_BORDER = '#FBCFE8';
  const HOME_TEXT = '#1E293B';
  const HOME_TEXT_MUTED = '#64748B';
  const HOME_SURFACE = '#F8FAFC';
  const HOME_BORDER = '#E2E8F0';
  const homePartyBucketEmpty = {
    bg: HOME_SURFACE, border: HOME_BORDER, label: HOME_TEXT_MUTED, count: '#94A3B8', unit: '#94A3B8', districts: '#94A3B8',
  };
  const homePartyBucketActive = {
    bg: HOME_BRAND_SOFT, border: HOME_BRAND_BORDER, label: '#9F1239', count: HOME_BRAND, unit: HOME_BRAND, districts: '#BE185D',
  };
  const homePartySectionTitleStyle = {
    fontSize: '15px', fontWeight: 800, color: HOME_TEXT, margin: '0 0 12px', lineHeight: 1.4,
  };
  const homePartnerSectionTitleStyle = {
    fontSize: '15px', fontWeight: 800, color: HOME_TEXT, margin: '20px 0 12px', lineHeight: 1.4,
  };
  const homeSectionSpace = 32;
  const homeBlockSpace = 22;
  const homeSubtitleStyle = { margin: '4px 0 0', fontSize: 12, fontWeight: 500, color: HOME_TEXT_MUTED, lineHeight: 1.45 };
  const homeSectionDividerStyle = { height: 1, background: HOME_BORDER, margin: '0 20px', border: 'none' };
  const homeSectionTitleStyle = { margin: 0, fontSize: 15, fontWeight: 800, color: HOME_TEXT, letterSpacing: '-0.3px' };
  const quickMenuRegisterHighlightStyle = {
    background: HOME_BRAND_SOFT,
    border: \`1.5px solid \${HOME_BRAND_BORDER}\`,
  };
  const quickMenuFloatStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFFFF',
    border: \`1px solid \${HOME_BORDER}\`,
    borderRadius: '14px',
    padding: '10px 8px 8px',
    cursor: 'pointer',
    width: '100%',
    minHeight: '88px',
    boxSizing: 'border-box',
  };
  const quickMenuTileStyle = {
    ...quickMenuFloatStyle,
    position: 'relative',
    width: '76px',
    minWidth: '76px',
    flexShrink: 0,
    scrollSnapAlign: 'start',
  };
  const quickMenuIconWrapStyle = { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  const quickMenuLabelStyle = { color: HOME_TEXT, fontWeight: 600, fontSize: '12px', marginTop: '6px', textAlign: 'center', lineHeight: 1.35, whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' };
  const quickMenuRegisterLabelStyle = { ...quickMenuLabelStyle, color: HOME_BRAND, fontWeight: 700 };
  const QUICK_MENU_ICON = 26;
  const quickMenuIconColor = '#475569';`;

if (!s.includes(oldBlock)) {
  console.error('style block not found');
  process.exit(1);
}
s = s.replace(oldBlock, newBlock);

s = s.replace(
  /const quickMenuItems = useMemo\(\(\) => \[[\s\S]*?\], \[handleRegister[\s\S]*?\]\);/,
  `const quickMenuItems = useMemo(() => [
    { id: 'party-register', registerHighlight: true, icon: <Music size={QUICK_MENU_ICON} strokeWidth={1.5} color={HOME_BRAND} />, label: '파티등록', particles: '🎉', action: () => handleRegister('party') },
    { id: 'class-register', registerHighlight: true, icon: <User size={QUICK_MENU_ICON} strokeWidth={1.5} color={HOME_BRAND} />, label: '클래스등록', particles: '📚', action: () => window.dispatchEvent(new CustomEvent('open-vip-class-register')) },
    { id: 'concierge', icon: <MessageSquare size={QUICK_MENU_ICON} strokeWidth={1.5} color={quickMenuIconColor} />, label: '컨시어지', particles: '✨', action: () => window.dispatchEvent(new CustomEvent('open-chatbot')) },
    { id: 'livepick', icon: <Camera size={QUICK_MENU_ICON} strokeWidth={1.5} color={quickMenuIconColor} />, label: '라이브픽', particles: '📸', action: () => { window.history.pushState({}, '', '#community'); setView('community'); } },
    { id: 'wishlist', icon: <Heart size={QUICK_MENU_ICON} strokeWidth={1.5} color={quickMenuIconColor} />, label: '찜하기', particles: '❤️', action: () => { window.history.pushState({}, '', '#wishlist'); setShowWishlist(true); } },
    { id: 'chat', textIcon: '1:1', label: '채팅문의', particles: '💬', action: () => window.open('https://open.kakao.com/o/gP43rNri', '_blank') },
    { id: 'saju', icon: <Star size={QUICK_MENU_ICON} strokeWidth={1.5} color={quickMenuIconColor} />, label: '운명의좌표', particles: '🌟', action: () => { window.history.pushState({}, '', '#saju'); setShowSaju(true); } },
    { id: 'restaurant', icon: <Utensils size={QUICK_MENU_ICON} strokeWidth={1.5} color={quickMenuIconColor} />, label: '맛집뒷풀이', particles: '🍽', action: () => { window.history.pushState({}, '', '#restaurant'); setView('restaurant'); } },
    { id: 'weather', icon: <CloudSun size={QUICK_MENU_ICON} strokeWidth={1.5} color={quickMenuIconColor} />, label: '오늘날씨', particles: '☀️', action: () => { window.history.pushState({}, '', '#weather'); setShowWeather(true); } },
    { id: 'route', icon: <Navigation size={QUICK_MENU_ICON} strokeWidth={1.5} color={quickMenuIconColor} />, label: '지능형경로', particles: '🧭', action: () => { window.history.pushState({}, '', '#route'); openAnalysis(false); } },
    { id: 'calendar', icon: <Calendar size={QUICK_MENU_ICON} strokeWidth={1.5} color={quickMenuIconColor} />, label: '행사달력', particles: '📅', action: () => setShowFullCalendar(true) },
  ], [handleRegister, setShowFullCalendar, setView, setShowWishlist, setShowSaju, setShowWeather, openAnalysis]);`
);

s = s.replace(
  `<header style={{ marginBottom: 14 }}>
      <motion.div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.3px' }}>{title}</h2>`,
  `<header style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={homeSectionTitleStyle}>{title}</h2>`
);

s = s.replace(
  `].map((r, bucketIdx) => {
            const theme = todayPartyBucketThemes[bucketIdx] || todayPartyBucketThemes[0];
            const hasCount = !loading && r.count > 0;`,
  `].map((r) => {
            const theme = !loading && r.count > 0 ? homePartyBucketActive : homePartyBucketEmpty;
            const hasCount = !loading && r.count > 0;`
);

s = s.replace(
  `boxShadow: hasCount ? \`0 3px 10px \${theme.border}55\` : 'none',`,
  `boxShadow: hasCount ? '0 2px 8px rgba(212, 67, 110, 0.12)' : 'none',`
);

s = s.replace(
  `minHeight: 80,`,
  `minHeight: 76,`
);

s = s.replace(
  `fontSize: '22px', fontWeight: 900, color: theme.count`,
  `fontSize: hasCount ? '22px' : '20px', fontWeight: 900, color: theme.count`
);

s = s.replace(
  `<h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.3px' }}>
            {isEn ? "Today's parties" : '오늘의 파티'}
          </h2>`,
  `<h2 style={homeSectionTitleStyle}>
            {isEn ? "Today's parties" : '오늘의 파티'}
          </h2>`
);

s = s.replace(
  `background: 'linear-gradient(135deg, #D4436E, #C9A84C)',`,
  `background: 'linear-gradient(135deg, #D4436E 0%, #C7365F 100%)',`
);

s = s.replace(
  `width: min(100%, calc(80px * 3 + 14px * 2 + 40px));`,
  `width: min(100%, calc(76px * 3 + 14px * 2 + 38px));`
);

s = s.replace(
  `border: 2px solid #C9A84C;`,
  `border: 2px solid #D4436E;`
);

s = s.replace(
  /onClick=\{\(e\) => \{ triggerParticle\(e, item\.particles\); item\.action\(\); \}\}\s+style=\{\{\s+\.\.\.quickMenuTileStyle,\s+\.\.\.\(isRegisterMini \? quickMenuRegisterTileStyle : \{\}\),\s+\.\.\.\(isRegisterMini \? quickMenuRegisterHighlightStyle : \{\}\),\s+\}\}\s+>\s+\{item\.textIcon \? \(\s+<motion\.motion\.div style=\{\{ \.\.\.quickMenuIconWrapStyle, width: '44px', height: '44px', fontSize: 18, fontWeight: 900, color: '#C9A84C'/,
  `onClick={(e) => { triggerParticle(e, item.particles); item.action(); }}
                style={{
                  ...quickMenuTileStyle,
                  ...(isRegisterMini ? quickMenuRegisterHighlightStyle : {}),
                }}
              >
                {item.textIcon ? (
                  <motion.div style={{ ...quickMenuIconWrapStyle, width: '40px', height: '40px', fontSize: 16, fontWeight: 800, color: quickMenuIconColor`
);

// fix botched replace - read file and fix quick menu block manually if needed

const quickOld = `{quickMenuItems.map((item) => {
              const isRegisterMini = Boolean(item.registerHighlight);
              return (
              <motion.div
                key={item.id}
                whileTap={{ scale: isRegisterMini ? 0.94 : 0.92 }}
                onClick={(e) => { triggerParticle(e, item.particles); item.action(); }}
                style={{
                  ...quickMenuTileStyle,
                  ...(isRegisterMini ? quickMenuRegisterTileStyle : {}),
                  ...(isRegisterMini ? quickMenuRegisterHighlightStyle : {}),
                }}
              >
                {item.textIcon ? (
                  <motion.div style={{ ...quickMenuIconWrapStyle, width: '44px', height: '44px', fontSize: 18, fontWeight: 900, color: '#C9A84C', letterSpacing: '-0.8px' }}>{item.textIcon}</motion.div>
                ) : (
                  <motion.div style={isRegisterMini ? quickMenuRegisterIconWrapStyle : quickMenuIconWrapStyle}>{item.icon}</motion.div>
                )}
                <span style={isRegisterMini ? quickMenuRegisterLabelStyle : quickMenuLabelStyle}>{item.label}</span>
              </motion.div>
            );})}`;

const quickNew = `{quickMenuItems.map((item) => {
              const isRegister = Boolean(item.registerHighlight);
              return (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.94 }}
                onClick={(e) => { triggerParticle(e, item.particles); item.action(); }}
                style={{
                  ...quickMenuTileStyle,
                  ...(isRegister ? quickMenuRegisterHighlightStyle : {}),
                }}
              >
                {item.textIcon ? (
                  <motion.div style={{ ...quickMenuIconWrapStyle, fontSize: 16, fontWeight: 800, color: quickMenuIconColor, letterSpacing: '-0.8px' }}>{item.textIcon}</motion.div>
                ) : (
                  <motion.div style={quickMenuIconWrapStyle}>{item.icon}</motion.div>
                )}
                <span style={isRegister ? quickMenuRegisterLabelStyle : quickMenuLabelStyle}>{item.label}</span>
              </motion.div>
            );})}`;

if (s.includes(quickOld)) s = s.replace(quickOld, quickNew);
else console.warn('quick menu block: manual check');

s = s.replace(/background: isSelected \? '#FFF1F2' : '#F8FAFC',\s+color: isSelected \? '#E53935' : '#334155',\s+border: isSelected \? '1px solid #FECDD3' : '1px solid #E2E8F0',/g,
  `background: isSelected ? HOME_BRAND_SOFT : HOME_SURFACE,
                    color: isSelected ? HOME_BRAND : HOME_TEXT,
                    border: isSelected ? \`1px solid \${HOME_BRAND_BORDER}\` : \`1px solid \${HOME_BORDER}\`,`);

s = s.replace(/color: isSelected \? '#E53935' : '#64748B',\s+}\s+aria-label/g,
  `color: isSelected ? HOME_BRAND : HOME_TEXT_MUTED,
                    }}
                    aria-label`);

s = s.replace(
  `<h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.3px' }}>
            Social BAR
          </h2>`,
  `<h2 style={homeSectionTitleStyle}>
            Social BAR
          </h2>`
);

fs.writeFileSync(p, s);
console.log('patched home visual system');
