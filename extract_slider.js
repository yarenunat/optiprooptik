const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const idx = content.indexOf('module-slider-917');
console.log(content.substring(idx + 15000, idx + 18000));
