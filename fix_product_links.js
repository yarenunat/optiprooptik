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

            // Fix broken product links that point to category?product_id=XYZ
            // e.g. href="./kadin-gunes-gozlukleri?product_id=1788"
            // e.g. data-product_url="./kadin-gunes-gozlukleri?product_id=1788"
            const regex = /(?:["'])?(?:\.\/)?(?:[a-z-]+)?(?:\/)?\?product_id=(\d+)(?:["'])?/g;
            
            // Wait, we can just replace the whole path!
            // Let's target href="..." and data-product_url="..."
            const attrRegex = /(href|data-product_url)=["'](?:\.\/)?[a-z-]+(?:\/)?\?product_id=(\d+)["']/g;
            
            if (attrRegex.test(content)) {
                content = content.replace(attrRegex, '$1="index_route=product/product&product_id=$2.php.html"');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(p, content, 'latin1');
            }
        }
    }
}

console.log('Fixing product links...');
processHtml(__dirname);
console.log('Done.');
