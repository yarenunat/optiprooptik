const fs = require('fs');
const content = fs.readFileSync('index.html', 'latin1');
const lines = content.split('\n');
const cssLines = lines.filter(line => line.includes('rel="stylesheet"') || line.includes('style.min.css'));
console.log(cssLines.join('\n'));
