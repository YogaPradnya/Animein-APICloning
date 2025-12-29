# 📅 Schedule API Documentation

Dokumentasi lengkap untuk menggunakan API Schedule Anime dari AnimeInWeb.

## 🎯 Overview

API Schedule menyediakan data jadwal anime per hari (Senin-Minggu) dan random. API ini menggunakan **2 metode berbeda** tergantung environment:

- **Vercel/Production**: Menggunakan API internal `animeinweb.com` (tanpa browser automation)
- **Local Development**: Menggunakan Playwright untuk scraping (jika tersedia)

API akan **otomatis switch** ke metode yang sesuai.

---

## 📡 Endpoint

```
GET /api/v1/animeinweb/schedule?day={hari}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `day` | string | No | Hari yang ingin diambil. Default: semua hari |

### Nilai `day` yang Valid

| Value | Description |
|-------|-------------|
| `senin` / `monday` / `sen` | Jadwal hari Senin |
| `selasa` / `tuesday` / `sel` | Jadwal hari Selasa |
| `rabu` / `wednesday` / `rab` | Jadwal hari Rabu |
| `kamis` / `thursday` / `kam` | Jadwal hari Kamis |
| `jumat` / `friday` / `jum` | Jadwal hari Jumat |
| `sabtu` / `saturday` / `sab` | Jadwal hari Sabtu |
| `minggu` / `sunday` / `min` | Jadwal hari Minggu |
| `random` | Anime random |

---

## 📋 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "currentDay": "SEN",
    "schedule": [
      {
        "animeId": "6068",
        "title": "wu shang shen di",
        "genre": "action",
        "views": "36315",
        "favorite": "379",
        "releaseTime": "new !!",
        "link": "https://animeinweb.com/anime/6068",
        "thumbnail": "https://xyz-api.animein.net//assets_xyz/images/movie/poster/...",
        "cover": "https://xyz-api.animein.net//assets_xyz/images/movie/cover/...",
        "poster": "https://xyz-api.animein.net//assets_xyz/images/movie/poster/...",
        "isNew": true,
        "status": "ongoing"
      }
    ]
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Gagal mengambil data schedule: ..."
}
```

---

## 💻 Contoh Penggunaan

### cURL

```bash
# Jadwal hari Senin
curl "http://localhost:3000/api/v1/animeinweb/schedule?day=senin"

# Jadwal hari Minggu
curl "http://localhost:3000/api/v1/animeinweb/schedule?day=minggu"

# Semua hari (default)
curl "http://localhost:3000/api/v1/animeinweb/schedule"
```

### JavaScript (Fetch API)

```javascript
// Ambil jadwal hari Senin
async function getSchedule(day = 'senin') {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/animeinweb/schedule?day=${day}`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`Hari: ${data.data.currentDay}`);
      console.log(`Total anime: ${data.data.schedule.length}`);
      
      data.data.schedule.forEach((anime, index) => {
        console.log(`${index + 1}. ${anime.title} (${anime.status})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getSchedule('minggu');
```

### Axios

```javascript
const axios = require('axios');

async function getSchedule(day = 'senin') {
  try {
    const response = await axios.get('http://localhost:3000/api/v1/animeinweb/schedule', {
      params: { day }
    });
    
    if (response.data.success) {
      const { currentDay, schedule } = response.data.data;
      console.log(`Hari: ${currentDay}`);
      console.log(`Total: ${schedule.length} anime`);
      
      return schedule;
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test semua hari
const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
days.forEach(async (day) => {
  const schedule = await getSchedule(day);
  console.log(`${day}: ${schedule?.length || 0} anime`);
});
```

### Python (Requests)

```python
import requests

def get_schedule(day='senin'):
    url = 'http://localhost:3000/api/v1/animeinweb/schedule'
    params = {'day': day}
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if data['success']:
            schedule = data['data']['schedule']
            print(f"Hari: {data['data']['currentDay']}")
            print(f"Total: {len(schedule)} anime")
            
            for i, anime in enumerate(schedule[:5], 1):
                print(f"{i}. {anime['title']} ({anime['status']})")
            
            return schedule
    except Exception as e:
        print(f"Error: {e}")

# Test
get_schedule('minggu')
```

---

## 🔧 Environment Behavior

### Local Development (dengan Playwright)

Jika Playwright terinstall dan tidak di Vercel:

```bash
# Akan menggunakan Playwright untuk scraping
[Schedule] Using Playwright for local development...
```

**Keuntungan:**
- ✅ Data lebih lengkap (scraping langsung dari website)
- ✅ Bisa scrape semua tab sekaligus

**Kekurangan:**
- ⏱️ Lebih lambat (~5-6 detik)
- 💾 Butuh Playwright installed

### Vercel/Production (API Internal)

Jika di Vercel atau Playwright tidak tersedia:

```bash
# Akan menggunakan API internal
[Schedule] Using API internal schedule (tanpa Playwright)...
```

**Keuntungan:**
- ⚡ Lebih cepat (~1-2 detik)
- 🚀 Bisa jalan di Vercel (serverless)
- 📦 Tidak perlu browser automation

**Kekurangan:**
- ⚠️ Terbatas pada data yang tersedia di API internal

---

## 📊 Data per Hari (Contoh)

| Hari | Jumlah Anime | Contoh |
|------|--------------|--------|
| **SENIN** | ~7 | Wu Shang Shen Di, 3-nen Z-gumi Ginpachi-sensei |
| **SELASA** | ~3 | Tondemo Skill de Isekai Hourou Meshi 2 |
| **RABU** | ~5 | Kakuriyo no Yadomeshi Ni |
| **KAMIS** | ~6 | Taiyou yori mo Mabushii Hoshi |
| **JUMAT** | ~5 | Watari-kun no xx ga Houkai Sunzen |
| **SABTU** | ~11 | Kao ni Denai Kashiwada-san to Kao ni Deru Oota-kun |
| **MINGGU** | ~24 | Mofa Gongzhu de Xiao Fannao, One Punch Man 3, One Piece |
| **RANDOM** | ~15 | Pokémon (2023) |

> **Note**: Jumlah anime per hari bisa berubah tergantung jadwal update dari sumber.

---

## 🎨 Field Description

| Field | Type | Description |
|-------|------|-------------|
| `animeId` | string | ID unik anime |
| `title` | string | Judul anime (lowercase) |
| `genre` | string | Genre utama anime |
| `views` | string | Jumlah view |
| `favorite` | string | Jumlah favorite |
| `releaseTime` | string | Waktu release (e.g., "new !!", "tamat", "4h 11j 35m") |
| `link` | string | URL detail anime |
| `thumbnail` | string | URL thumbnail image |
| `cover` | string | URL cover image |
| `poster` | string | URL poster image |
| `isNew` | boolean | Apakah anime baru |
| `status` | string | Status anime (ongoing/finished) |

---

## ⚠️ Error Handling

### Common Errors

1. **Network Timeout**
   ```json
   {
     "success": false,
     "error": "Gagal mengambil data schedule: timeout of 15000ms exceeded"
   }
   ```

2. **Invalid Day Parameter**
   - Jika `day` tidak valid, akan return data untuk hari default atau error

3. **API Unavailable**
   - Jika API internal tidak tersedia, akan fallback ke explore API atau error

### Best Practices

```javascript
async function getScheduleSafe(day) {
  try {
    const response = await fetch(`/api/v1/animeinweb/schedule?day=${day}`);
    const data = await response.json();
    
    if (!data.success) {
      console.error('API Error:', data.error);
      return [];
    }
    
    return data.data.schedule || [];
  } catch (error) {
    console.error('Network Error:', error);
    return [];
  }
}
```

---

## 🚀 Performance Tips

1. **Cache Response**: Cache response di client-side untuk mengurangi request
2. **Batch Requests**: Jika perlu beberapa hari, request secara parallel
3. **Error Retry**: Implement retry logic untuk network errors

```javascript
// Contoh dengan retry
async function getScheduleWithRetry(day, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`/api/v1/animeinweb/schedule?day=${day}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## 📝 Notes

- API ini menggunakan **API internal** dari `animeinweb.com`
- Data di-update secara real-time dari sumber
- Response time bervariasi tergantung network dan server load
- Untuk production, disarankan menggunakan caching layer

---

## 🔗 Related Endpoints

- [`/api/v1/animeinweb/today`](./API_USAGE.md) - Anime hari ini
- [`/api/v1/animeinweb/trending`](./API_USAGE.md) - Anime trending
- [`/api/v1/animeinweb/new`](./API_USAGE.md) - Anime baru

---

**Last Updated**: 2025-01-05  
**API Version**: 1.0.0

