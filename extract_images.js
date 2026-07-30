const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sliderStart = html.indexOf('<div class="module module-slider module-slider-917');
if (sliderStart > -1) {
    const sliderContent = html.substring(sliderStart, sliderStart + 15000);
    const imgRegex = /<img[^>]*>/g;
    let match;
    while ((match = imgRegex.exec(sliderContent)) !== null) {
        console.log('Image tag:', match[0]);
    }
}
