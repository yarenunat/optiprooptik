const fs = require('fs');
const content = fs.readFileSync('kadin-gunes-gozlukleri/index.html', 'latin1');
const startIdx = content.indexOf('<div class="product-layout');
const nextIdx = content.indexOf('<div class="product-layout', startIdx + 1);
const gridIdx = content.indexOf('class="main-products main-products-style product-grid auto-grid"');
console.log('Start:', startIdx, 'Next:', nextIdx, 'Grid:', gridIdx);
