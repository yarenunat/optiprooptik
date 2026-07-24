const fs = require('fs');
const path = require('path');

function processHtml(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (!['site_backup', 'node_modules', '.git'].includes(file)) {
                processHtml(p);
            }
        } else if (p.endsWith('.html')) {
            let content = fs.readFileSync(p, 'latin1');
            let modified = false;

            if (content.includes('index_route=common/home.php.html')) {
                content = content.replace(/index_route=common\/home\.php\.html/g, 'index.html');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(p, content, 'latin1');
            }
        }
    }
}

processHtml(__dirname);
console.log('Fixed home links!');
