const fs = require('fs');
const path = require('path');
const https = require('https');

const rootDir = __dirname;
const domain = 'https://optipro.com.tr/';
const toDownload = new Set();

function scanFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (!['site_backup', 'node_modules', '.git'].includes(file)) scanFiles(p);
        } else if (p.endsWith('.html') || p.endsWith('.css') || p.endsWith('.js')) {
            const content = fs.readFileSync(p, 'latin1');
            
            // Extract everything that looks like an image or catalog path.
            // It could be image/cache/... or image\/cache\/...
            // It could be inside " or ' or &quot;
            const regex = /(?:image|catalog)[\\\/](?:[^"'\s&]+)/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                let imgPath = match[0];
                // Unescape JSON slashes
                imgPath = imgPath.replace(/\\\//g, '/');
                // Strip ?v= query strings
                if (imgPath.includes('?')) imgPath = imgPath.split('?')[0];
                // Strip trailing commas or other artifacts
                imgPath = imgPath.replace(/[,;]+$/, '');
                
                if (imgPath.match(/\.(jpg|jpeg|png|webp|gif|svg|woff|woff2|ttf|css|js)$/i)) {
                    toDownload.add(decodeURIComponent(imgPath));
                }
            }
        }
    }
}

scanFiles(rootDir);

const downloadQueue = Array.from(toDownload).filter(p => {
    const localPath = path.join(rootDir, p.replace(/\//g, path.sep));
    return !fs.existsSync(localPath);
});

console.log(`Found ${downloadQueue.length} files missing locally.`);

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                file.close();
                fs.unlinkSync(destPath);
                resolve();
            }
        }).on('error', (err) => {
            fs.unlink(destPath, () => {});
            resolve();
        });
    });
}

async function processDownloads() {
    let count = 0;
    for (let i = 0; i < downloadQueue.length; i += 10) {
        const chunk = downloadQueue.slice(i, i + 10);
        await Promise.all(chunk.map(p => {
            const destPath = path.join(rootDir, p.replace(/\//g, path.sep));
            const url = domain + encodeURI(p);
            return downloadFile(url, destPath).then(() => { count++; });
        }));
        console.log(`Downloaded ${count}/${downloadQueue.length}`);
    }
    console.log('All downloads finished.');
}

processDownloads();
