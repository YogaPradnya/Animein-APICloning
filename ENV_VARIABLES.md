# Environment Variables

File ini menjelaskan environment variables yang digunakan di project ini.

## 📝 Cara Setup

Buat file `.env` di root project dengan isi:

```env
# Base URL untuk scraping
BASE_URL=https://s7.nontonanimeid.boats
ANIMEINWEB_URL=https://animeinweb.com

# Port untuk development server (optional)
PORT=3000

# Environment (development/production)
NODE_ENV=development
```

## 🔧 Environment Variables

### BASE_URL
- **Deskripsi:** Base URL untuk website nontonanimeid.boats
- **Default:** `https://s7.nontonanimeid.boats`
- **Contoh:** `BASE_URL=https://s7.nontonanimeid.boats`
- **Digunakan untuk:** Scraping episode terbaru dan detail anime dari nontonanimeid.boats

### ANIMEINWEB_URL
- **Deskripsi:** Base URL untuk website animeinweb.com
- **Default:** `https://animeinweb.com`
- **Contoh:** `ANIMEINWEB_URL=https://animeinweb.com`
- **Digunakan untuk:** Scraping schedule, trending, new, detail, dan episode dari animeinweb.com

### PORT
- **Deskripsi:** Port untuk development server
- **Default:** `3000`
- **Contoh:** `PORT=3000`
- **Digunakan untuk:** Menentukan port saat menjalankan `node server.js`

### NODE_ENV
- **Deskripsi:** Environment mode (development/production)
- **Default:** `development`
- **Contoh:** `NODE_ENV=production`
- **Digunakan untuk:** Menentukan mode aplikasi

### VERCEL
- **Deskripsi:** Flag untuk Vercel deployment (otomatis set oleh Vercel)
- **Default:** Tidak ada (undefined)
- **Contoh:** `VERCEL=true`
- **Digunakan untuk:** Menentukan apakah aplikasi jalan di Vercel (untuk optimasi scraping)

## 🚀 Setup untuk Development

1. Copy file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

2. Edit file `.env` sesuai kebutuhan:
```env
BASE_URL=https://s7.nontonanimeid.boats
ANIMEINWEB_URL=https://animeinweb.com
PORT=3000
NODE_ENV=development
```

3. Jalankan server:
```bash
npm run dev
```

## 🌐 Setup untuk Vercel

1. Login ke Vercel Dashboard
2. Pilih project
3. Buka **Settings** → **Environment Variables**
4. Tambahkan variables:
   - `BASE_URL` = `https://s7.nontonanimeid.boats`
   - `ANIMEINWEB_URL` = `https://animeinweb.com`
   - `NODE_ENV` = `production`

Atau pakai Vercel CLI:
```bash
vercel env add BASE_URL
vercel env add ANIMEINWEB_URL
vercel env add NODE_ENV
```

## 📌 Catatan

- File `.env` **JANGAN** di-commit ke Git (sudah ada di `.gitignore`)
- Gunakan `.env.example` sebagai template
- Untuk production, set environment variables di hosting platform (Vercel, Railway, dll)

