const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const app = express();
const port = 4000;
const rootDir = __dirname;

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(rootDir, 'image', 'cache', 'catalog', 'uploads');
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----- Admin Panel UI -----
app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Optipro Yönetim Paneli</title>
            <style>
                :root { --primary: #20b2aa; --bg: #f4f7f6; --text: #333; --border: #e0e0e0; }
                * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }
                body { margin: 0; background: var(--bg); color: var(--text); display: flex; height: 100vh; }
                .sidebar { width: 250px; background: #fff; border-right: 1px solid var(--border); padding: 20px; }
                .sidebar h2 { color: var(--primary); font-size: 20px; display: flex; align-items: center; gap: 10px; margin-top:0; }
                .sidebar h2 img { width: 28px; height: 28px; border-radius: 4px; }
                .menu { list-style: none; padding: 0; margin-top: 30px; }
                .menu li { margin-bottom: 10px; }
                .menu a { text-decoration: none; color: #555; display: block; padding: 10px 15px; border-radius: 6px; transition: 0.2s; }
                .menu a:hover, .menu a.active { background: #f0fdfa; color: var(--primary); font-weight: 500; }
                
                .main { flex: 1; padding: 30px 40px; overflow-y: auto; }
                .header { margin-bottom: 30px; }
                .header h1 { margin: 0 0 5px 0; font-size: 24px; }
                .header p { margin: 0; color: #777; font-size: 14px; }
                
                .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
                .card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
                .card h3 { margin-top: 0; margin-bottom: 20px; font-size: 16px; font-weight: 600; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
                
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 8px; font-size: 13px; color: #555; font-weight: 500; }
                .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; transition: 0.2s; outline: none; }
                .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(32,178,170,0.1); }
                textarea.form-control { resize: vertical; min-height: 100px; }
                
                .image-upload-box { border: 2px dashed #b2dfdb; background: #f0fdfa; border-radius: 8px; padding: 40px 20px; text-align: center; cursor: pointer; transition: 0.2s; }
                .image-upload-box:hover { background: #e0f2f1; }
                .image-upload-box input { display: none; }
                .image-upload-box span { color: var(--primary); font-weight: 500; display: block; margin-top: 10px; }
                
                .actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px; }
                .btn { padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: 0.2s; text-decoration: none; }
                .btn-outline { background: transparent; color: #555; border: 1px solid #ccc; }
                .btn-outline:hover { background: #f4f4f4; }
                .btn-primary { background: var(--primary); color: #fff; box-shadow: 0 4px 6px rgba(32,178,170,0.2); }
                .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 12px rgba(32,178,170,0.3); }
            </style>
        </head>
        <body>
            <div class="sidebar">
                <h2>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="6" cy="15" r="4"></circle>
                      <circle cx="18" cy="15" r="4"></circle>
                      <line x1="10" y1="15" x2="14" y2="15"></line>
                      <line x1="2" y1="15" x2="2" y2="15"></line>
                      <line x1="22" y1="15" x2="22" y2="15"></line>
                    </svg>
                    Optipro Admin
                </h2>
                <ul class="menu">
                    <li><a href="/admin" class="active">Ürün Ekle</a></li>
                    <li><a href="/admin/manage">Ürünleri Yönet</a></li>
                    <li><a href="/" target="_blank">Siteyi Görüntüle</a></li>
                </ul>
            </div>
            <div class="main">
                <div class="header">
                    <h1>Yeni Ürün Ekle</h1>
                    <p>Mağazanıza yeni bir ürün ekleyin.</p>
                </div>
                <form action="/admin/add-product" method="POST" enctype="multipart/form-data">
                    <div class="grid">
                        <div class="left-col">
                            <div class="card">
                                <h3>İsim ve Açıklama</h3>
                                <div class="form-group">
                                    <label>Ürün Adı</label>
                                    <input type="text" name="name" class="form-control" required placeholder="Örn: RAY-BAN RB3025">
                                </div>
                                <div class="form-group">
                                    <label>Ürün Açıklaması (Opsiyonel)</label>
                                    <textarea name="desc" class="form-control" placeholder="Ürün özelliklerini buraya yazın..."></textarea>
                                </div>
                            </div>
                            
                            <div class="card">
                                <h3>Kategori</h3>
                                <div class="form-group">
                                    <label>Ürün Kategorisi</label>
                                    <select name="category" class="form-control">
                                        <option value="kadin-gunes-gozlukleri">Kadın Güneş Gözlükleri</option>
                                        <option value="erkek-gunes-gozlukleri">Erkek Güneş Gözlükleri</option>
                                        <option value="cocuk-gunes-gozlukleri">Çocuk Güneş Gözlükleri</option>
                                        <option value="index_route=product/special">İndirimdekiler (Outlet)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="right-col">
                            <div class="card">
                                <h3>Fiyatlandırma</h3>
                                <div class="form-group">
                                    <label>Fiyat (TL)</label>
                                    <input type="text" name="price" class="form-control" required placeholder="Örn: 4.500,00 TL">
                                </div>
                            </div>
                            
                            <div class="card">
                                <h3>Ürün Görselleri</h3>
                                <div class="form-group">
                                    <label>Fotoğrafları Seç (Çoklu Seçim)</label>
                                    <label class="image-upload-box">
                                        <input type="file" name="images" required accept="image/*" multiple id="fileInput">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary)"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        <span id="fileCount">Yüklemek için tıklayın</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="actions">
                        <a href="/" class="btn btn-outline">İptal</a>
                        <button type="submit" class="btn btn-primary">+ Ürün Ekle</button>
                    </div>
                </form>
            </div>
            
            <script>
                document.getElementById('fileInput').addEventListener('change', function(e) {
                    const count = e.target.files.length;
                    document.getElementById('fileCount').textContent = count > 0 ? count + ' fotoğraf seçildi' : 'Yüklemek için tıklayın';
                });
            </script>
        </body>
        </html>
    `);
});

// ----- Add Product Logic -----
app.post('/admin/add-product', upload.array('images', 10), (req, res) => {
    try {
        const { name, price, category } = req.body;
        const imageFiles = req.files;
        
        if (!imageFiles || imageFiles.length === 0) return res.status(400).send("Resim yüklenmedi.");

        const mainImageFile = imageFiles[0];
        const imgRelPath = 'image/cache/catalog/uploads/' + mainImageFile.filename;
        const newProductId = Date.now();
        const newProductFileName = `index_route=product\\product&product_id=${newProductId}.php.html`;
        const newProductUrl = `index_route=product/product&product_id=${newProductId}.php.html`;
        
        // 1. Create a Product Page based on an existing one
        const templateProductPath = path.join(rootDir, 'index_route=product', 'product&product_id=2180.php.html');
        if (fs.existsSync(templateProductPath)) {
            let prodContent = fs.readFileSync(templateProductPath, 'latin1');
            
            // Replace Name and Price blindly
            prodContent = prodContent.replace(/QUANTUM Q195 C3/g, name);
            prodContent = prodContent.replace(/9\.172,80TL/g, price);
            
            // Replace images in the HTML body (Main image and additional thumbnail images)
            // Replace the first and second WhatsApp images with the first uploaded image
            prodContent = prodContent.replace(/WhatsApp%20Image%202025-03-29%20at%2012\\.43\\.14-1500x1500w\\.jpeg/g, mainImageFile.filename);
            prodContent = prodContent.replace(/WhatsApp%20Image%202025-03-29%20at%2012\\.43\\.14-600x315w\\.jpeg/g, mainImageFile.filename);
            
            // Generate data-images JSON array for the zoom gallery
            const galleryArr = imageFiles.map(img => {
                const p = '.\\/image\\/cache\\/catalog\\/uploads\\/' + img.filename;
                return {
                    type: "image",
                    src: p,
                    srcset: p + " 1x, " + p + " 2x",
                    thumb: p,
                    subHtml: name
                };
            });
            const galleryJsonString = JSON.stringify(galleryArr).replace(/"/g, '&quot;');
            
            // Replace data-images attribute entirely
            prodContent = prodContent.replace(/data-images="\\[.*?\\]"/g, 'data-images="' + galleryJsonString + '"');
            
            fs.writeFileSync(path.join(rootDir, 'index_route=product', 'product&product_id=' + newProductId + '.php.html'), prodContent, 'latin1');
        }

        // 2. Add product to the selected category page!
        let catPath = '';
        if (category.startsWith('index_route=')) {
            catPath = path.join(rootDir, category.replace('/', '\\') + '.php.html');
        } else {
            catPath = path.join(rootDir, category, 'index.html');
        }

        if (fs.existsSync(catPath)) {
            let catContent = fs.readFileSync(catPath, 'latin1');
            
            // Extract the first product layout using string indices to avoid regex truncation
            const startIdx = catContent.indexOf('<div class="product-layout');
            const nextIdx = catContent.indexOf('<div class="product-layout', startIdx + 1);
            
            if (startIdx !== -1 && nextIdx !== -1) {
                let newItem = catContent.slice(startIdx, nextIdx);
                
                // Replace link
                newItem = newItem.replace(/href="[^"]+"/g, `href="${(category.startsWith('index_route') ? '' : '../') + newProductUrl}"`);
                
                // Replace title (the a tag inside div class="name")
                newItem = newItem.replace(/<div class="name"><a[^>]+>.*?<\/a><\/div>/is, `<div class="name"><a href="${(category.startsWith('index_route') ? '' : '../') + newProductUrl}" title="${name}">${name}</a></div>`);
                
                // Replace price
                newItem = newItem.replace(/<span class="price-new">.*?<\/span>/is, `<span class="price-new">${price}</span>`);
                
                // Replace image
                const newImgSrc = (category.startsWith('index_route') ? './' : '../') + imgRelPath;
                newItem = newItem.replace(/<img[^>]+>/is, `<img src="${newImgSrc}" alt="${name}" class="img-responsive">`);
                
                // Update product ID (for quickview/cart/whatsapp tracking if any)
                newItem = newItem.replace(/data-product[-_]id="\d+"/g, `data-product-id="${newProductId}"`);
                
                // Add an admin-added class for easy deletion
                newItem = newItem.replace(/class="product-layout/g, 'class="product-layout admin-added');

                // Inject it right after the grid opening tag
                const gridTarget = 'class="main-products main-products-style product-grid auto-grid"';
                const gridIdx = catContent.indexOf(gridTarget);
                if (gridIdx !== -1) {
                    const insertIdx = catContent.indexOf('>', gridIdx) + 1;
                    catContent = catContent.slice(0, insertIdx) + '\n' + newItem + catContent.slice(insertIdx);
                    
                    fs.writeFileSync(catPath, catContent, 'latin1');
                }
            }
        }

        res.send(`
            <html><head><style>body{font-family:sans-serif;padding:20px;}</style></head><body>
            <h2>Başarılı!</h2><p>${name} ürünü başarıyla eklendi.</p>
            <a href="/admin">Yeni Ürün Ekle</a> | <a href="/admin/manage">Ürünleri Yönet</a>
            </body></html>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send("Bir hata oluştu: " + err.message);
    }
});

// ----- Manage Products UI -----
app.get('/admin/manage', (req, res) => {
    // Find all files in index_route=product that are timestamp-based (added by admin)
    const prodDir = path.join(rootDir, 'index_route=product');
    const files = fs.readdirSync(prodDir);
    let html = `
        <html>
        <head>
            <title>Optipro Yönetim Paneli - Ürün Yönetimi</title>
            <style>
                body { font-family: sans-serif; background: #f4f4f4; padding: 20px; }
                .container { background: #fff; padding: 20px; border-radius: 8px; max-width: 800px; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                h2 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
                a.btn { background: #000; color: #fff; text-decoration: none; padding: 5px 10px; border-radius: 3px; font-size: 14px; }
                a.btn.delete { background: #d9534f; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Son Eklenen Ürünleri Yönet</h2>
                <a class="btn" href="/admin">Geri Dön</a>
                <table>
                    <tr><th>Ürün ID (Tarih)</th><th>Dosya</th><th>İşlem</th></tr>
    `;
    
    files.forEach(f => {
        const match = f.match(/product&product_id=(\d+)\.php\.html/);
        if (match && parseInt(match[1]) > 1700000000000) {
            const id = match[1];
            html += `<tr><td>${new Date(parseInt(id)).toLocaleString('tr-TR')}</td><td>${f}</td><td><a href="/admin/delete/${id}" class="btn delete" onclick="return confirm('Silmek istediğinize emin misiniz?')">Sil</a></td></tr>`;
        }
    });

    html += `
                </table>
            </div>
        </body>
        </html>
    `;
    res.send(html);
});

// ----- Delete Logic -----
app.get('/admin/delete/:id', (req, res) => {
    const id = req.params.id;
    const prodPath = path.join(rootDir, 'index_route=product', `product&product_id=${id}.php.html`);
    
    if (fs.existsSync(prodPath)) fs.unlinkSync(prodPath);
    
    // Scan all HTML files and remove the product-layout with this ID
    function scanAndRemove(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const p = path.join(dir, file);
            if (fs.statSync(p).isDirectory()) {
                if (!['site_backup', 'node_modules', '.git'].includes(file)) scanAndRemove(p);
            } else if (p.endsWith('.html')) {
                let content = fs.readFileSync(p, 'latin1');
                if (content.includes(`data-product-id="${id}"`)) {
                    // Very simple removal using regex matching the div
                    const removeRegex = new RegExp(`<div class="product-layout admin-added[^>]*data-product-id="${id}".*?<\/div>\\s*<\/div>\\s*<\/div>`, 'is');
                    content = content.replace(removeRegex, '');
                    fs.writeFileSync(p, content, 'latin1');
                }
            }
        }
    }
    scanAndRemove(rootDir);
    
    res.redirect('/admin/manage');
});

// ----- Search Logic -----
app.get('/index.php', (req, res, next) => {
    if (req.query.route === 'journal3/search') {
        // Journal3 AJAX autocomplete search
        return res.json([]); 
    }
    
    if (req.query.route === 'product/search') {
        // Full page search submission (pressing Enter)
        // Redirect to a real existing catalog page because we can't generate a dynamic search results page on the fly easily
        return res.redirect('/index_route=product/catalog.php.html');
    }
    next();
});

// Serve everything statically
app.use(express.static(rootDir));

app.listen(port, () => {
    console.log("✅ Optipro sunucusu çalışıyor! Panelinize şuradan erişin: http://localhost:" + port + "/admin");
    console.log("✅ Mağazayı şuradan görüntüleyin: http://localhost:" + port + "/");
});
