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
let replaceCount = 0;
const mobileCss = `
<style id="mobile-layout-fixes">
/* GLOBAL MOBILE FIXES */
html, body {
  overflow-x: hidden !important;
  max-width: 100vw !important;
}

@media (max-width: 768px) {
  body {
    padding-bottom: 80px !important;
  }
  .float {
    width: 50px !important;
    height: 50px !important;
    bottom: 15px !important;
    font-size: 32px !important;
    left: 15px !important;
    z-index: 1000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .fa-whatsapp.my-float {
    margin-top: 0 !important;
  }
  .scroll-top {
    bottom: 15px !important;
    right: 15px !important;
    z-index: 1000 !important;
  }
  .mobile-filter-trigger {
    bottom: 15px !important;
    z-index: 999 !important;
  }
  .btn-extra-93, .btn-extra-93 .btn-text {
    white-space: normal !important;
    font-size: 13px !important;
    height: auto !important;
    padding: 8px 5px !important;
    line-height: 1.2 !important;
  }

  /* --- POPUP FIXES --- */
  
  /* Fix huge inline style width (864px) causing horizontal scroll on mobile */
  .popup-content img {
    max-width: 100% !important;
    height: auto !important;
  }
  .popup-wrapper {
    max-width: 90vw !important;
    margin: 0 auto !important;
  }
  .popup-close {
    right: 5px !important;
    top: 5px !important;
    z-index: 9999 !important;
  }

  /* Fix Popup Checkbox Overlap */
  .popup-footer {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 15px !important;
    padding: 10px !important;
  }
  .popup-dont-show {
    margin-top: 5px !important;
    width: 100% !important;
    text-align: center !important;
  }
  .popup-buttons {
    width: 100% !important;
    text-align: center !important;
  }
  .btn-popup-1 {
    width: 100% !important;
    white-space: normal !important;
  }

  /* Fix Sidebar Menu Bullet Points and Overlaps */
  .mobile-menu-container ul, .mobile-menu-container li, .dropdown-menu ul, .dropdown-menu li {
    list-style: none !important;
    margin: 0;
    padding: 0;
  }

  /* Fix accordion menu expanding and overlapping elements (often missing position relative or height auto) */
  .accordion-menu-item .collapse, .accordion-menu-item .dropdown-menu {
    position: relative !important;
    height: auto !important;
    background: transparent !important;
  }

  /* Fix Search Dropdown Overlap */
  .desktop-search-wrapper.mini-search .dropdown-menu {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    z-index: 9999 !important;
  }
  
  /* Fix Marquee / Text overlap (Ticker) */
  .module-ticker {
    overflow: hidden !important;
    white-space: nowrap !important;
  }
}
</style>
</head>`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<style id="mobile-layout-fixes">[\s\S]*?<\/style>\s*<\/head>/g, '</head>');
  
  let newContent = content.replace('</head>', mobileCss);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    replaceCount++;
  }
});
console.log('Injected ULTIMATE mobile CSS into ' + replaceCount + ' HTML files.');
