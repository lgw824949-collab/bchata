import fs from 'fs';

const p = 'c:/dev/bchata/src/components/VenueDetailModal.jsx';
let s = fs.readFileSync(p, 'utf8');
const marker = "flexDirection: 'row',";
const start = s.indexOf(marker);
if (start < 0) {
  console.error('start not found');
  process.exit(1);
}
const start2 = s.lastIndexOf('<motion.div', start);
const end = s.indexOf('{dayParties.length > 1', start);
if (start2 < 0 || end < 0) {
  console.error('bounds', start2, end);
  process.exit(1);
}
const rep = fs.readFileSync('c:/dev/bchata/scratch/venue-party-card.txt', 'utf8');
s = s.slice(0, start2) + rep + s.slice(end);
fs.writeFileSync(p, s);
console.log('patched', end - start2, '->', rep.length);
