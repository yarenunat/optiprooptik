const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !['node_modules', '.git'].includes(path.basename(file))) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(__dirname);
let fixCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Clean old style block if it exists
  content = content.replace(/<style id="mobile-layout-fixes">[\s\S]*?<\/style>\s*<\/head>/g, '</head>');

  const mobileCss = `
<style id="mobile-layout-fixes">
/* KILL HORIZONTAL SCROLL */
html, body {
  overflow-x: hidden !important;
  width: 100% !important;
  max-width: 100% !important;
}

@media (max-width: 768px) {
  body { padding-bottom: 0 !important; }

  /* Ensure containers do not exceed viewport */
  .site-wrapper, #wrapper, .container, .container-fluid,
  header, footer, main, section, nav, table, .row {
    max-width: 100% !important;
    overflow-x: hidden !important;
  }

  /* ===== HERO SLIDER FIX ===== */
  /* The issue: main background images shrinking to strips */
  .module-slider-917 .slide-content > img,
  .module-slider-917 .slide-content > video {
    min-height: 400px !important;
    height: 100% !important;
    width: 100% !important;
    object-fit: cover !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
  }
  .module-slider-917 .swiper-slide {
    min-height: 400px !important;
  }
  .module-slider-917 .slide-content {
    min-height: 400px !important;
    position: relative !important;
  }

  /* ===== POPUP FIX (Nuclear Specificity) ===== */
  .module-popup-1160 .popup-container,
  div.popup-container, [class*="popup-container"] {
    width: 85vw !important; max-width: 85vw !important; min-width: 0 !important;
  }
  .popup-wrapper, div.popup-wrapper { max-width: 85vw !important; }
  .popup-close { right: 5px !important; top: 5px !important; z-index: 9999 !important; }
  .popup-content img, .popup-content p img {
    max-width: 100% !important; width: 100% !important; height: auto !important;
  }

  html body .popup-wrapper .popup-footer,
  html body .module-popup-1160 .popup-footer,
  .module-popup-1160 div.popup-footer, div.popup-footer {
    display: flex !important; flex-direction: column !important;
    align-items: center !important; gap: 12px !important; padding: 15px !important;
    position: relative !important;
  }
  
  html body .popup-wrapper .popup-dont-show,
  html body .module-popup-1160 .popup-dont-show,
  .module-popup-1160 label.popup-dont-show,
  label.popup-dont-show, .popup-dont-show[for] {
    position: static !important; inset: initial !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    gap: 8px !important; width: 100% !important; margin: 0 !important;
  }

  html body .popup-wrapper .popup-buttons,
  .module-popup-1160 div.popup-buttons, div.popup-buttons {
    width: 100% !important; text-align: center !important;
  }
  
  html body .popup-wrapper .btn-popup-1,
  .module-popup-1160 .btn-popup-1, a.btn-popup-1 {
    width: 100% !important; display: block !important; padding: 10px 15px !important;
  }
}
</style>
</head>`;

  let newContent = content.replace('</head>', mobileCss);
  if (newContent !== content) {
    modified = true;
    content = newContent;
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    fixCount++;
  }
});

console.log('Fixed ' + fixCount + ' files');
