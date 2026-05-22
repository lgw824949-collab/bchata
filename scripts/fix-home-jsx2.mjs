import { readFileSync, writeFileSync } from 'fs';
const p = 'c:/dev/bchata/src/pages/Home.tsx';
let lines = readFileSync(p, 'utf8').split(/\r?\n/);

// Fix renderHeroPosters closings (~1732-1734, 0-indexed 1731-1733)
if (lines[1732]?.includes('</motion.div>') && lines[1731]?.includes('home-poster-label')) {
  lines[1732] = '            </motion.div>'.replace('motion.', '');
}
if (lines[1733]?.trim() === '</motion.div>') {
  // keep motion wrap close
}

// line 1732 in 1-based = index 1731 - read actual
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('home-poster-label') && lines[i + 1]?.trim() === '</motion.div>') {
    // next line after gradient close is wrong if it says motion.div for inner
  }
}

// Direct index fix from build errors (1-based line numbers)
const fixes = {
  1733: '            </motion.div>'.replace('</motion.div>', '</div>'),
  1812: '          </motion.div>'.replace('</motion.div>', '</motion.div>'),
  1823: '        </motion.div>'.replace('</motion.div>', '</motion.div>'),
};

for (const [lineNum, content] of Object.entries(fixes)) {
  const idx = Number(lineNum) - 1;
  if (lines[idx]) lines[idx] = content;
}

// Fix social bar row close: find home-social-bar-row and fix its closing
const rowIdx = lines.findIndex((l) => l.includes('className="home-social-bar-row"'));
if (rowIdx >= 0) {
  for (let j = rowIdx; j < rowIdx + 80 && j < lines.length; j++) {
    if (lines[j].trim() === '</motion.div>' && lines[j - 1]?.includes('renderBarCard')) {
      lines[j] = '                    </motion.div>'.replace('motion.', '');
      break;
    }
    if (lines[j].includes('showExpandToggle')) {
      // remove expand block until matching close before barListExpanded
      let depth = 0;
      let k = j;
      while (k < lines.length) {
        if (lines[k].includes('{showExpandToggle')) depth = 1;
        if (depth && lines[k].trim() === ')}' && !lines[k + 1]?.includes('barListExpanded')) {
          lines.splice(j, k - j + 1);
          break;
        }
        if (depth && lines[k].includes('barListExpanded')) break;
        k++;
      }
      break;
    }
  }
}

writeFileSync(p, lines.join('\n'));
console.log('fixed lines', Object.keys(fixes).join(','));
