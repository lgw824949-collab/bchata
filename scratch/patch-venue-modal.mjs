import fs from 'fs';

const p = 'src/components/VenueDetailModal.jsx';
let s = fs.readFileSync(p, 'utf8');

// Fix broken closing tags after header address (motion.div typos)
s = s.replace(
  /(\{displayAddress\}\s*)<\/motion\.div>(\s*\)\}\s*)<\/motion\.motion\.div>(\s*)<\/motion\.motion\.div>/,
  '$1</div>$2</motion.div>$3</motion.div>'
);

// Still might be motion.div - try another pattern from actual file
s = s.replace(
  `                  {displayAddress}
                </motion.div>
              )}
            </motion.div>
          </motion.div>`,
  `                  {displayAddress}
                </motion.div>
              )}
            </motion.div>
          </motion.div>`
);

// Fix with real div - copy this carefully
const a = `                  {displayAddress}
                </motion.div>
              )}
            </motion.div>
          </motion.div>`;
const b = `                  {displayAddress}
                </motion.div>
              )}
            </motion.div>
          </motion.div>`;

// Use char codes - b should use div
const b2 = `                  {displayAddress}
                </div>
              )}
            </div>
          </motion.div>`;

if (s.includes(a)) s = s.replace(a, b2);
else if (s.includes('</motion.div>\n              )}\n            </motion.div>\n          </motion.div>')) {
  s = s.replace(
    '</motion.div>\n              )}\n            </motion.div>\n          </motion.div>',
    '</motion.div>\n              )}\n            </motion.div>\n          </motion.div>'
  );
}

// Fix address wrapper open tag
s = s.replace(
  `{displayName}</motion.div>
              {displayAddress && (
                <motion.div`,
  `{displayName}</motion.div>
              {displayAddress && (
                <motion.div`
);

// div version
s = s.replace(
  `{displayName}</motion.div>
              {displayAddress && (
                <motion.div`,
  `{displayName}</motion.div>
              {displayAddress && (
                <motion.div`
);

// REAL div fix
s = s.replace(
  /(\{displayName\}<\/div>\s*\{displayAddress && \(\s*)<motion\.div>/,
  '$1<div>'
);

const midStart = s.indexOf('              {/* 바 소개 */}');
const midEnd = s.indexOf('              {dayParties.length > 1', midStart);
if (midStart >= 0 && midEnd > midStart) {
  s = s.slice(0, midStart) + s.slice(midEnd);
  console.log('removed middle bar intro');
}

s = s.replace(
  /<div style=\{\{ padding: '24px 16px', textAlign: 'center' \}\}>[\s\S]*?\{selectedDate\} — 등록된 파티가 없습니다\.[\s\S]*?<\/motion.div>/,
  `<div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, fontWeight: 600 }}>
                {selectedDate} — 등록된 파티가 없습니다.
              </p>
            </motion.div>`.replace(/motion\.div/g, 'motion.div')
);

// fix empty state replace - use div only
s = s.replace(
  /<div style=\{\{ padding: '24px 16px', textAlign: 'center' \}\}>[\s\S]*?\{selectedDate\} — 등록된 파티가 없습니다\.[\s\S]*?<\/div>/,
  `<div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, fontWeight: 600 }}>
                {selectedDate} — 등록된 파티가 없습니다.
              </p>
            </motion.div>`
);

// last line wrong again
s = s.replace(
  `<div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, fontWeight: 600 }}>
                {selectedDate} — 등록된 파티가 없습니다.
              </p>
            </motion.div>`,
  `<div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, fontWeight: 600 }}>
                {selectedDate} — 등록된 파티가 없습니다.
              </p>
            </motion.div>`
);

fs.writeFileSync(p, s);
console.log('done');
