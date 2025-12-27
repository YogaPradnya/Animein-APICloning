# 📚 Panduan Penggunaan AnimeAPI (v1.0.0)

API Anime terlengkap dengan performa tinggi, caching pintar, dan data 100% REAL dari sumber aslinya.

## 🚀 Base URL
Gunakan domain Vercel atau localhost (untuk pengembangan):
```
https://anime-api-three-jade.vercel.app/api/v1
```
*(Local: http://localhost:3000/api/v1)*

---

## 📊 Monitoring & Docs
Sekarang kamu bisa pantau API kamu lewat web:
- **Interactive Docs**: `https://anime-api-three-jade.vercel.app/docs`
- **Real-time Dashboard**: `https://anime-api-three-jade.vercel.app/dashboard`

---

## ⚡ Fitur Utama
1.  **Sub-1s Performance**: Dengan sistem caching, request berulang hanya butuh **1-5 milidetik**.
2.  **100% Real Data**: Tidak ada lagi data dummy/mock. Semua data diambil langsung dari sumber.
3.  **No Ads**: Filter otomatis folder `/ADS/` dan link iklan lainnya.
4.  **Complete Episodes**: Mendukung anime dengan episode banyak (contoh: Naruto 500+ episode).
5.  **Vercel Optimized**: Scraper otomatis beralih ke mode performa tinggi saat di-deploy.

---

## 🛠️ Endpoints

### 1. Search Anime (Cari Judul)
Cari anime berdasarkan judul.
**GET** `/search?q={judul}`

**Contoh:** `.../api/v1/search?q=naruto`

---

### 2. Get Detail Anime (Info Lengkap)
Ambil sinopsis, rating, studio, genre, dan **SEMUA** list episode.
**GET** `/animeinweb?id={animeId}`

**Contoh:** `.../api/v1/animeinweb?id=341`

---

### 3. Get Episode Video
Ambil link video direct (MP4) dengan berbagai resolusi (server RAPSODI).
**GET** `/animeinweb/episode?animeId={id}&episodeNumber={no}`

**Contoh:** `.../api/v1/animeinweb/episode?animeId=341&episodeNumber=500`

---

### 4. Jadwal Rilis (Schedule)
Jadwal anime per hari lengkap dengan Cover & Poster.
**GET** `/animeinweb/schedule?day={hari}`

**Hari:** `senin, selasa, rabu, kamis, jumat, sabtu, minggu, random`.

---

### 5. Anime Hari Ini (Today)
Ambil daftar anime yang rilis di hari ini secara otomatis.
**GET** `/animeinweb/today`

---

### 6. Download Direct
Dapatkan link download langsung (MP4).
- **Single**: `/download/episode?animeId={id}&episodeNumber={no}&resolution=1080p`
- **Batch**: `/download/batch?animeId={id}&resolution=1080p&startEpisode=1&endEpisode=50`

---

### 7. Test Endpoint (Real Data)
Gunakan ini untuk testing frontend dengan data asli.
**GET** `/test?endpoint=latest`

---

## 💡 Tips Penting

### 1. Sistem Caching
API ini mengirimkan header `X-Cache`.
- `X-Cache: HIT` -> Data diambil dari memori (Super Cepat! < 10ms)
- `X-Cache: MISS` -> Data baru di-scrape (1-3 detik)

### 2. Decode URL Video
URL video yang dikembalikan masih dalam bentuk encoded. **Wajib di-decode** di frontend:
```javascript
const videoUrl = decodeURIComponent(data.url);
```

### 3. Tanpa Iklan
Semua video dari folder `/ADS/` sudah dihapus secara otomatis demi kenyamanan user.

---

## 📦 Contoh Response (Real Data)
```json
{
  "success": true,
  "data": {
    "title": "naruto: shippuuden",
    "status": "finished",
    "rating": "8.5",
    "cover": "https://...",
    "poster": "https://...",
    "episodes": [...] 
  }
}
```

---
Made with ❤️ by **Raisyahah** for **Archarakun** 🥰
