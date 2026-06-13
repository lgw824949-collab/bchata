const fs = require('fs');
const p = 'c:/dev/bchata/src/pages/Home.tsx';
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);

lines[509] = "                <motion.div style={{ padding: '8px 4px 0' }}>";
lines[509] = "                <div style={{ padding: '8px 4px 0' }}>";
lines[510] = '                  <div';
if (lines[522].trim() === '</motion.div>') {
  lines[522] = '                  </motion.div>';
}

fs.writeFileSync(p, lines.join('\n'));
for (let i = 507; i < 525; i++) console.log(`${i + 1}|${lines[i]}`);
