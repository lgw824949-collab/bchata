const fs = require('fs');
const path = 'public/logo.svg';
let content = fs.readFileSync(path, 'utf8');

// Remove the specific white path tags
const pathToRemove = '<path fill="#ffffff" d="M 0 0 L 940 0 L 940 940 L 0 940 Z M 0 0 " fill-opacity="1" fill-rule="nonzero"/>';
content = content.split(pathToRemove).join('');

fs.writeFileSync(path, content, 'utf8');
console.log('Cleaned logo.svg');
