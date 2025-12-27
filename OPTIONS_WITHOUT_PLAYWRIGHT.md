# Opsi Tanpa Playwright untuk Vercel (Tetap Pakai JS)

## 🎯 Masalah Utama
Halaman schedule pakai **Next.js (client-side rendering)**, jadi perlu browser automation untuk scrape. Tapi Playwright terlalu berat untuk Vercel.

---

## ✅ OPSI 1: Puppeteer dengan @sparticuz/chromium (RECOMMENDED)

**Status:** ✅ BISA di Vercel
**Kompleksitas:** Medium
**Biaya:** Gratis

### Kelebihan:
- ✅ Support JavaScript rendering
- ✅ Bisa scrape schedule dengan benar
- ✅ Optimized untuk serverless (Vercel)
- ✅ Tetap pakai JS

### Kekurangan:
- ⚠️ Perlu setup khusus
- ⚠️ Memory usage tinggi (~200-300MB)
- ⚠️ Bisa timeout kalau terlalu lama

### Implementasi:
```javascript
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

**Note:** Sudah pernah dicoba tapi error. Perlu fix konfigurasi.

---

## ✅ OPSI 2: Headless Browser Service Eksternal

**Status:** ✅ BISA di Vercel
**Kompleksitas:** Easy
**Biaya:** Ada yang gratis, ada yang bayar

### Service yang Tersedia:

#### A. Browserless.io (Free tier: 6 jam/bulan)
```javascript
const axios = require('axios');

const response = await axios.post('https://chrome.browserless.io/content', {
  url: 'https://animeinweb.com/schedule',
  waitFor: 2000
}, {
  headers: {
    'Authorization': `Bearer ${process.env.BROWSERLESS_TOKEN}`
  }
});
```

#### B. ScraperAPI (Free tier: 1000 requests/bulan)
```javascript
const axios = require('axios');

const response = await axios.get('http://api.scraperapi.com', {
  params: {
    api_key: process.env.SCRAPERAPI_KEY,
    url: 'https://animeinweb.com/schedule',
    render: 'true' // JavaScript rendering
  }
});
```

#### C. ScrapingBee (Free tier: 1000 requests/bulan)
```javascript
const axios = require('axios');

const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
  params: {
    api_key: process.env.SCRAPINGBEE_KEY,
    url: 'https://animeinweb.com/schedule',
    render_js: 'true'
  }
});
```

### Kelebihan:
- ✅ Tidak perlu install browser
- ✅ Tidak makan memory di Vercel
- ✅ Reliable dan cepat
- ✅ Support JavaScript rendering

### Kekurangan:
- ⚠️ Perlu API key (ada free tier)
- ⚠️ Rate limit di free tier
- ⚠️ Dependency eksternal

---

## ✅ OPSI 3: Cari API Endpoint Lain

**Status:** ⚠️ BELUM DITEMUKAN
**Kompleksitas:** Easy (kalau ketemu)
**Biaya:** Gratis

### Yang Sudah Dicoba:
- ❌ `/api/proxy/3/2/explore/movie` - Tidak punya data per hari
- ❌ `/api/proxy/3/2/schedule` - Tidak ada endpoint
- ❌ `/api/proxy/3/2/movie/schedule` - Tidak ada endpoint

### Yang Bisa Dicoba:
```javascript
// Coba endpoint-endpoint ini:
const endpoints = [
  'https://animeinweb.com/api/proxy/3/2/schedule/movie',
  'https://animeinweb.com/api/proxy/3/2/movie/list?day=MONDAY',
  'https://animeinweb.com/api/proxy/3/2/calendar',
  'https://animeinweb.com/api/proxy/3/2/timetable',
];
```

**Note:** Perlu investigasi lebih lanjut untuk cari endpoint yang punya data schedule per hari.

---

## ✅ OPSI 4: Hybrid Approach (Vercel + Service Eksternal)

**Status:** ✅ BISA di Vercel
**Kompleksitas:** Medium
**Biaya:** Gratis (pakai free tier)

### Konsep:
- **Vercel:** Handle API endpoints yang tidak perlu browser
- **Service Eksternal:** Handle scraping schedule (via API call)

### Implementasi:
```javascript
// Di Vercel
async function getSchedule(day = null) {
  if (process.env.VERCEL) {
    // Pakai service eksternal untuk scraping
    const response = await axios.post('https://chrome.browserless.io/content', {
      url: `https://animeinweb.com/schedule?day=${day}`,
      waitFor: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.BROWSERLESS_TOKEN}`
      }
    });
    
    // Parse HTML response
    const $ = cheerio.load(response.data);
    // ... extract data
  }
}
```

---

## ✅ OPSI 5: Pre-render & Cache (Workaround)

**Status:** ✅ BISA di Vercel
**Kompleksitas:** Medium
**Biaya:** Gratis

### Konsep:
- Scrape schedule sekali sehari (pakai cron job atau scheduled function)
- Simpan hasil ke cache/database
- API hanya return data dari cache

### Implementasi:
```javascript
// Scheduled function (Vercel Cron Jobs)
// Run setiap hari jam 00:00 UTC
export default async function handler(req, res) {
  // Scrape schedule untuk semua hari
  const schedule = await scrapeScheduleWithService();
  
  // Simpan ke cache/database
  await saveToCache(schedule);
  
  return res.json({ success: true });
}

// API endpoint hanya return dari cache
app.get('/api/v1/animeinweb/schedule', async (req, res) => {
  const schedule = await getFromCache(req.query.day);
  return res.json({ success: true, data: schedule });
});
```

**Note:** Perlu setup Vercel Cron Jobs atau external cron service.

---

## 📊 PERBANDINGAN OPSI

| Opsi | Kompleksitas | Biaya | Reliability | Schedule Accuracy |
|------|-------------|-------|-------------|-------------------|
| Puppeteer + Chromium | Medium | Gratis | ⚠️ Medium | ✅ Akurat |
| Browserless.io | Easy | Free tier | ✅ High | ✅ Akurat |
| ScraperAPI | Easy | Free tier | ✅ High | ✅ Akurat |
| ScrapingBee | Easy | Free tier | ✅ High | ✅ Akurat |
| Cari API Endpoint | Easy | Gratis | ❓ Unknown | ❓ Unknown |
| Pre-render & Cache | Medium | Gratis | ✅ High | ⚠️ Update sekali/hari |

---

## 🏆 REKOMENDASI

### Untuk Production:
**Opsi 2: Browserless.io atau ScraperAPI**
- ✅ Paling reliable
- ✅ Tidak makan resource Vercel
- ✅ Support JavaScript rendering
- ✅ Free tier cukup untuk development

### Untuk Development:
**Opsi 1: Puppeteer + Chromium**
- ✅ Gratis
- ✅ Tidak perlu dependency eksternal
- ⚠️ Perlu fix konfigurasi

### Untuk Long-term:
**Opsi 5: Pre-render & Cache**
- ✅ Paling efisien
- ✅ Tidak perlu scrape setiap request
- ✅ Bisa update sekali sehari

---

## 💡 IMPLEMENTASI CEPAT: Browserless.io

### Setup:
1. Daftar di https://browserless.io (free tier)
2. Dapatkan API token
3. Tambahkan ke Vercel environment variables

### Code:
```javascript
const axios = require('axios');

async function scrapeScheduleWithBrowserless(day = null) {
  const url = day 
    ? `https://animeinweb.com/schedule?day=${day}`
    : 'https://animeinweb.com/schedule';
  
  const response = await axios.post(
    'https://chrome.browserless.io/content',
    {
      url: url,
      waitFor: 2000, // Wait 2 seconds for JS to render
      gotoOptions: {
        waitUntil: 'networkidle0'
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.BROWSERLESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  
  // Parse HTML dengan Cheerio
  const $ = cheerio.load(response.data);
  // ... extract schedule data
  
  return scheduleData;
}
```

---

## 🎯 KESIMPULAN

**Opsi Terbaik untuk Vercel:**
1. **Browserless.io** (paling mudah dan reliable)
2. **ScraperAPI** (alternatif yang bagus)
3. **Puppeteer + Chromium** (kalau mau fix konfigurasi)

Semua opsi ini:
- ✅ Tetap pakai JS
- ✅ Bisa di Vercel
- ✅ Tidak perlu Playwright
- ✅ Bisa scrape JavaScript-rendered content

