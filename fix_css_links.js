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

            // Fix HTTrack URL query parameters encoded in file names like _v%3D8f1f5dea
            const regex = /_v%3D[a-f0-9]+\./g;
            if (regex.test(content)) {
                content = content.replace(regex, '.');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(p, content, 'latin1');
                console.log('Fixed:', p);
            }
        }
    }
}

processHtml(__dirname);
console.log('Finished fixing all encoded asset links.');
