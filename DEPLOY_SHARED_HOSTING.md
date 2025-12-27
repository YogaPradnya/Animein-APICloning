# Panduan Deploy ke Shared Hosting

## Prasyarat
1. Shared hosting dengan **Node.js support** (cPanel biasanya punya "Node.js Selector")
2. Domain yang sudah aktif
3. Akses SSH atau cPanel

## Opsi 1: Pakai Subdomain (RECOMMENDED)

### Setup di cPanel:
1. Login ke cPanel
2. Buka **Subdomains**
3. Buat subdomain baru: `api`
4. Point ke folder: `public_html/api` (atau folder khusus)
5. Klik **Create**

### Upload File:
```bash
# Upload semua file ke folder: public_html/api/
# Struktur folder:
public_html/
  api/
    server.js
    package.json
    api/
    node_modules/
    ...
```

### Setup Node.js di cPanel:
1. Buka **Node.js Selector** di cPanel
2. Pilih folder: `api`
3. Pilih Node.js version: **20.x**
4. Set **Application Root**: `/api`
5. Set **Application URL**: `api.domainkamu.com`
6. Set **Application Startup File**: `server.js`
7. Klik **Create Application**
8. Klik **Run NPM Install**
9. Klik **Restart Application**

### Akses API:
- URL: `https://api.domainkamu.com/api/v1/...`

---

## Opsi 2: Pakai Path/Subdirectory

### Setup:
1. Buat folder `api` di `public_html/api`
2. Upload semua file ke folder tersebut
3. Setup Node.js Selector dengan:
   - **Application Root**: `/api`
   - **Application URL**: `domainkamu.com/api`
   - **Application Startup File**: `server.js`

### Akses API:
- URL: `https://domainkamu.com/api/api/v1/...`
- **Note**: Ada double `/api` karena path + base URL

---

## Konfigurasi Environment Variables

Di cPanel Node.js Selector, tambahkan environment variables:
- `NODE_ENV=production`
- `PORT=3000` (atau port yang diberikan hosting)

---

## Troubleshooting

### API tidak bisa diakses:
1. Cek apakah Node.js app sudah **Running** di cPanel
2. Cek **logs** di cPanel untuk error
3. Pastikan port yang digunakan benar

### Playwright tidak jalan:
- Shared hosting biasanya **tidak support Playwright** karena perlu browser binaries
- Solusi: Pakai API internal saja (tanpa Playwright) untuk schedule

### Memory limit:
- Shared hosting biasanya punya memory limit (128MB-512MB)
- Pastikan tidak pakai terlalu banyak cache

---

## Update untuk Support Shared Hosting

Jika pakai path (domain.com/api), update `server.js` untuk support base path:

```javascript
const BASE_PATH = process.env.BASE_PATH || '';

app.use(BASE_PATH, routes);
```

Atau pakai middleware untuk handle base path.

