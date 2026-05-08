import fs from 'fs';

const filePath = 'src/pages/Community.jsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Line 108: if (diff < 1) return '방금 전';
lines[107] = "    if (diff < 1) return '방금 전';";

// Line 109, 110, 111: template literals
lines[108] = "    if (diff < 60) return `${diff}분 전`;";
lines[109] = "    if (diff < 1440) return `${Math.floor(diff/60)}시간 전`;";
lines[110] = "    return `${Math.floor(diff/1440)}일 전`;";

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Fixed syntax errors on lines 108-111 in Community.jsx');
