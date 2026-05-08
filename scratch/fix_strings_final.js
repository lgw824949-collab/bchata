import fs from 'fs';

const filePath = 'src/pages/Community.jsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Line 134, 135: shareData
lines[133] = "      title: 'LIVE PICK 현장 리포트',";
lines[134] = "      text: `[오늘밤빠] ${post.bar_name || '현장'} 분위기 확인하세요!`,";

// Line 143: alert
lines[142] = "        alert('링크가 복사되었습니다.');";

// Line 152: alert
lines[151] = "      alert('사진과 내용을 입력해주세요!');";

// Line 175: setNewPost
lines[174] = "      setNewPost({ content: '', region: '서울', bar_name: '', image: null, is_live: true });";

// Line 178: alert
lines[177] = "      alert('업로드 실패: ' + err.message);";

// Check line 208
lines[207] = "            현장 리포트는 3일간 유지됩니다. 인기 포스트는 [베스트]로 선정됩니다.";

// Check line 312, 313, 315
lines[311] = "                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{selectedPost.bar_name || '익명투자자'}</h3>";
lines[312] = "                      {selectedPost.is_live && <span style={{ background: '#E53935', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>실시간 인증</span>}";
lines[314] = "                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>{selectedPost.region} • {getRelativeTime(selectedPost.created_at)}</p>";

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Fixed unterminated strings and restored Korean in Community.jsx');
