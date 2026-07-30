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
/* MOBILE FIXES */
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
}
</style>
</head>`;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('id="mobile-layout-fixes"')) {
    let newContent = content.replace('</head>', mobileCss);
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      replaceCount++;
    }
  }
});
console.log('Injected mobile CSS into ' + replaceCount + ' HTML files.');
