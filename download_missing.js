const fs = require('fs');
const path = require('path');
const https = require('https');

const rootDir = __dirname;
const domain = 'https://optipro.com.tr/';

// Set of files to download to avoid duplicates
const toDownload = new Set();

function extractPaths(content) {
    // Match absolute optipro URLs
    const urlRegex = /https:\/\/optipro\.com\.tr\/([^"'\s\)]+)/g;
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
        let p = match[1];
        if (p.includes('?')) p = p.split('?')[0]; // strip query string
        if (p.endsWith('.jpg') || p.endsWith('.png') || p.endsWith('.webp') || p.endsWith('.svg') || p.endsWith('.css') || p.endsWith('.js') || p.includes('image/') || p.includes('catalog/')) {
            toDownload.add(decodeURIComponent(p));
        }
    }
    
    // Match relative paths for images and catalog
    const relRegex = /(?:src|data-src|href|srcset|data-image|data-zoom-image|data-thumb)=["']?(image\/[^"'\s]+|catalog\/[^"'\s]+)/g;
    while ((match = relRegex.exec(content)) !== null) {
        let p = match[1];
        if (p.includes('?')) p = p.split('?')[0];
        if (p.includes(' 1x')) p = p.split(' ')[0]; // Handle srcset "image.jpg 1x, image.jpg 2x"
        toDownload.add(decodeURIComponent(p));
    }
    
    const srcsetRegex = /, (image\/[^"'\s]+) 2x/g;
    while ((match = srcsetRegex.exec(content)) !== null) {
        let p = match[1];
        if (p.includes('?')) p = p.split('?')[0];
        toDownload.add(decodeURIComponent(p));
    }
}

// 1. Scan files
function scanFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (!['site_backup', 'node_modules', '.git'].includes(file)) scanFiles(p);
        } else if (p.endsWith('.html') || p.endsWith('.css') || p.endsWith('.js')) {
            const content = fs.readFileSync(p, 'latin1');
            extractPaths(content);
        }
    }
}
scanFiles(rootDir);

// Add known missing JS/CSS/Font libraries dynamically loaded by Journal3
toDownload.add('catalog/view/theme/journal3/lib/swiper-latest/swiper-bundle.min.js');
toDownload.add('catalog/view/theme/journal3/lib/swiper-latest/swiper-bundle.min.css');
toDownload.add('catalog/view/theme/journal3/lib/countup/countup.min.js');
toDownload.add('catalog/view/theme/journal3/lib/font-awesome/fonts/fontawesome-webfont.woff2');
toDownload.add('catalog/view/theme/journal3/lib/font-awesome/fonts/fontawesome-webfont.woff');
toDownload.add('catalog/view/theme/journal3/lib/font-awesome/fonts/fontawesome-webfont.ttf');

const downloadQueue = Array.from(toDownload).filter(p => {
    // only download if it doesn't exist
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
                resolve(); // Ignore 404s
            }
        }).on('error', (err) => {
            fs.unlink(destPath, () => {});
            resolve();
        });
    });
}

async function processDownloads() {
    let count = 0;
    // Download in chunks of 10 to avoid socket errors
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
