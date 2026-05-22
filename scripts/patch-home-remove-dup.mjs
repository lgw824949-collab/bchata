import { readFileSync, writeFileSync } from 'fs';
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let t = readFileSync(p, 'utf8');
const start = t.indexOf('        {/* featured posters: see hero section above */}');
const end = t.indexOf('        <motion.div className="home-quick-menu-block">', start);
if (start === -1 || end === -1) {
  console.error('markers missing', start, end);
  process.exit(1);
}
t = t.slice(0, start) + t.slice(end);
t = t.replace(
  '          </motion.div>\n        )}\n      </motion.div>\n\n      {activeTab === null && (\n        <div style={{ padding: \'0 16px\' }}>',
  '          </motion.div>\n        )}\n      </motion.div>\n\n      {activeTab === null && (\n        <div style={{ padding: \'0 16px\' }}>',
);
t = t.replace('        </motion.div>\n      )}\n\n      {/* 🔴 [LIVE 바', '        </div>\n      )}\n\n      {/* 🔴 [LIVE 바');
writeFileSync(p, t);
console.log('patched');
