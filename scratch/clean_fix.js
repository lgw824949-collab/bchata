import fs from 'fs';

const filePath = 'src/pages/Community.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the modal styles to be white/light
content = content.replace(
    /background: 'var\(--color-card\)', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '25px', position: 'relative', border: '1px solid var\(--color-border\)'/,
    "background: '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '25px', position: 'relative', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'"
);

content = content.replace(
    /background: 'var\(--color-border\)', border: 'none', borderRadius: '50%', padding: '6px', color: 'var\(--color-text-main\)'/,
    "background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', padding: '6px', color: '#000000'"
);

content = content.replace(
    /<h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '20px' }}>/,
    "<h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '20px', color: '#000000' }}>"
);

content = content.replace(
    /border: '1px dashed rgba\(255,255,255,0\.2\)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba\(255,255,255,0\.03\)', overflow: 'hidden'/,
    "border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.02)', overflow: 'hidden'"
);

content = content.replace(
    /color="rgba\(255,255,255,0\.3\)" \/><span style={{ fontSize: '12px', color: 'rgba\(255,255,255,0\.5\)', marginTop: '8px' }}>/,
    'color="rgba(0,0,0,0.3)" /><span style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", marginTop: "8px" }}>'
);

content = content.replace(
    /border: '1px solid var\(--color-border\)', borderRadius: '12px', padding: '12px', fontSize: '14px', outline: 'none', resize: 'none', background: 'var\(--color-bg\)', color: 'var\(--color-text-main\)'/,
    "border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '12px', fontSize: '14px', outline: 'none', resize: 'none', background: '#f8fafc', color: '#000000'"
);

content = content.replace(
    /border: '1px solid var\(--color-border\)', fontSize: '13px', background: 'var\(--color-bg\)', color: 'var\(--color-text-main\)'/g,
    "border: '1.5px solid rgba(0,0,0,0.1)', fontSize: '13px', background: '#f8fafc', color: '#000000'"
);

// Restore Korean strings (only the ones that are likely broken in the file)
content = content.replace(/\\?쒖슱/g, "서울");
content = content.replace(/\\?꾩껜/g, "전체");
content = content.replace(/蹂대땲\\?\\?,/g, "보니따,");
content = content.replace(/\\?덈줈\\?\\?쇰뱶/g, "업로드");
content = content.replace(/\\?쇰뱶/g, "피드");
content = content.replace(/\\?댁궗/g, "살사");
content = content.replace(/\\?꾩옣/g, "현장");
content = content.replace(/遺꾩쐞湲\?/g, "분위기");
content = content.replace(/\\?쇱떆媛꾩씤利\?/g, "실시간 인증");
content = content.replace(/ㅼ떆媛꾩씤利\?/g, "실시간 인증");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated styles and restored Korean in Community.jsx');
