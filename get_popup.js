const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const idx = content.indexOf('Alışverişe başla');
console.log(content.substring(idx - 600, idx + 400));
