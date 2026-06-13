import fs from 'fs';

const filePath = 'src/pages/Community.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace line 348 style
content = content.replace(
  /color: newPost\.is_live \? '#fff' : '#94A3B8'/g,
  "color: newPost.is_live ? '#E53935' : '#1e293b'"
);

// Replace line 349 style
content = content.replace(
  /color: newPost\.is_live \? 'rgba\(255,255,255,0\.7\)' : '#64748B'/g,
  "color: newPost.is_live ? 'rgba(229, 57, 53, 0.8)' : '#475569'"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated styles in Community.jsx');
