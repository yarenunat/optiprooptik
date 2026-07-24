const fs = require('fs');
const path = require('path');

function processUrls(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (!['site_backup', 'node_modules', '.git'].includes(file)) {
                processUrls(p);
            }
        } else if (p.endsWith('.html') || p.endsWith('.css') || p.endsWith('.js')) {
            let content = fs.readFileSync(p, 'latin1');
            let modified = false;

            // Replace all occurrences of ./ and ./ with ./
            // Because we have base href="../" in subdirectories, ./ will resolve perfectly to the root directory
            if (content.includes('./')) {
                content = content.replace(/https:\/\/optipro\.com\.tr\//g, './');
                modified = true;
            }
            if (content.includes('https:\\/\\/optipro.com.tr\\/')) {
                content = content.replace(/https:\\\/\\\/optipro\.com\.tr\\\//g, '.\\/');
                modified = true;
            }
            if (content.includes('./')) {
                content = content.replace(/https:\/\/www\.optipro\.com\.tr\//g, './');
                modified = true;
            }
            
            // Note: Our previous script ALREADY fixed `href=` links to map index.php?route= to local files.
            // This global replacement will catch all `src=`, `data-src=`, `srcset=`, etc. which point to `image/` or `catalog/`.

            if (modified) {
                fs.writeFileSync(p, content, 'latin1');
            }
        }
    }
}

console.log('Stripping absolute domain to enable fully offline images/assets...');
processUrls(__dirname);
console.log('Done.');
