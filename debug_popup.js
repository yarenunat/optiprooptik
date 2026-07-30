const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

// Find popup-wrapper section
const popupStart = content.indexOf('popup-wrapper');
const popupEnd = content.indexOf('popup-bg', popupStart);
console.log('=== POPUP STRUCTURE ===');
console.log(content.substring(popupStart - 50, popupEnd + 100));

console.log('\n\n=== POPUP CSS (inline styles) ===');
// Find all style blocks that contain popup
const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
let match;
while ((match = styleRegex.exec(content)) !== null) {
  if (match[1].includes('popup')) {
    console.log(match[1].substring(0, 2000));
    console.log('---');
  }
}
