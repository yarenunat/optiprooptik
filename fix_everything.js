const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const backupDir = path.join(rootDir, 'site_backup', 'optipro.com.tr');

// 1. Clean workspace
function cleanWorkspace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (['site_backup', 'fix_everything.js', '.git', 'node_modules'].includes(file)) continue;
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            fs.rmSync(p, { recursive: true, force: true });
        } else {
            fs.unlinkSync(p);
        }
    }
}
cleanWorkspace(rootDir);

// 2. Restore backup
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
copyDir(backupDir, rootDir);

// 3. Rename asset files on disk from *_v=*.css to *.css
function renameAssets(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (!['site_backup', 'node_modules', '.git'].includes(file)) renameAssets(p);
        } else {
            if (file.includes('_v=')) {
                const newName = file.replace(/_v=[a-f0-9]+/, '');
                fs.renameSync(p, path.join(dir, newName));
            }
        }
    }
}
renameAssets(path.join(rootDir, 'catalog'));

// 4. Process HTML files safely using 'latin1'
function processHtml(dir, depth = 0) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (!['site_backup', 'node_modules', '.git'].includes(file)) {
                processHtml(p, depth + 1);
            }
        } else if (p.endsWith('.html')) {
            let content = fs.readFileSync(p, 'latin1');
            let modified = false;

            // Fix root index.html broken links to point to the renamed files
            if (content.includes('_v%3D')) {
                content = content.replace(/_v%3D[a-f0-9]+\.css/g, '.css');
                content = content.replace(/_v%3D[a-f0-9]+\.js/g, '.js');
                modified = true;
            }

            // Add base tag for subdirectories
            if (depth > 0 && !content.includes('<base href=')) {
                const baseTag = '<base href="' + '../'.repeat(depth) + '" />';
                content = content.replace('<head>', `<head>\n${baseTag}`);
                modified = true;
            }

            // Hide the Visa/Mastercard/Anatolia logos
            const cssInjection = `\n<style>.icons-menu-228, .grid-module-footer-6-2-1 { display: none !important; }</style>\n`;
            if (!content.includes('.icons-menu-228 { display: none !important; }')) {
                content = content.replace('</head>', cssInjection + '</head>');
                modified = true;
            }

            // Replace href links to stay local
            if (content.includes('href="./')) {
                content = content.replace(/href="https:\/\/optipro\.com\.tr\/?([^"]*)"/g, (match, p1) => {
                    if (p1.startsWith('index.php')) {
                        let localRoute = p1.replace('index.php?route=', 'index_route=');
                        return `href="${localRoute}.php.html"`;
                    }
                    return `href="./${p1}"`;
                });
                modified = true;
            }
            if (content.includes('href="./')) {
                content = content.replace(/href="https:\/\/www\.optipro\.com\.tr\/?([^"]*)"/g, 'href="./$1"');
                modified = true;
            }
            
            // Fix logo link in index.html!
            // The scraper saved "index.php?route=common/home" as "index_route=common/home.php.html"
            // But in index.html, it's written as index_route%3Dcommon/home.php.html
            // Let's decode %3D back to = so it works on disk correctly!
            if (content.includes('index_route%3D')) {
                content = content.replace(/index_route%3D/g, 'index_route=');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(p, content, 'latin1');
            }
        }
    }
}
processHtml(rootDir);
console.log('Done.');
