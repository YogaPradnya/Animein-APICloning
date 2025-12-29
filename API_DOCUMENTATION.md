# 📚 Anime API - Dokumentasi Lengkap

Dokumentasi lengkap untuk semua endpoint API Anime dari NontonAnimeID & AnimeInWeb.

## 🎯 Overview

API ini menyediakan akses ke data anime real-time dari berbagai sumber dengan performa tinggi dan tanpa iklan. Semua endpoint menggunakan format response yang konsisten dan mendukung CORS untuk penggunaan di frontend.

**Base URL:**
- **Local**: `http://localhost:3000/api/v1`
- **Production**: `https://anime-api-three-jade.vercel.app/api/v1`

---

## 📋 Daftar Isi

1. [Episode Terbaru](#1-episode-terbaru)
2. [Detail Anime](#2-detail-anime)
3. [Pencarian Anime](#3-pencarian-anime)
4. [List Anime](#4-list-anime)
5. [Video Episode](#5-video-episode)
6. [Info Anime (AnimeInWeb)](#6-info-anime-animeinweb)
7. [Video Episode (AnimeInWeb)](#7-video-episode-animeinweb)
8. [Jadwal Anime](#8-jadwal-anime)
9. [Anime Trending](#9-anime-trending)
10. [Anime Baru](#10-anime-baru)
11. [Anime Hari Ini](#11-anime-hari-ini)
12. [Download Episode](#12-download-episode)
13. [Download Batch](#13-download-batch)

---

## 1. Episode Terbaru

Mendapatkan daftar episode anime yang baru rilis.

### Endpoint
```
GET /api/v1/latest
```

### Parameter
Tidak ada parameter.

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "title": "nama anime",
      "episode": "episode 1",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "link": "https://example.com/anime/episode-1",
      "resolution": "1080p",
      "releaseDate": "2025-01-05"
    }
  ],
  "total": 10
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/latest"
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/latest');
const data = await response.json();
console.log(data.data); // Array episode terbaru
```

---

## 2. Detail Anime

Mendapatkan informasi lengkap tentang sebuah anime.

### Endpoint
```
GET /api/v1/detail?slug={slug-anime}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Slug/nama anime (contoh: `one-piece`) |

### Response Format

```json
{
  "success": true,
  "data": {
    "title": "one piece",
    "originalTitle": "ワンピース",
    "synopsis": "Sinopsis lengkap anime...",
    "rating": 8.5,
    "releaseDate": "1999-10-20",
    "schedule": "Minggu",
    "studio": "Toei Animation",
    "genres": ["action", "adventure", "comedy"],
    "episodes": [
      {
        "episode": "Episode 1",
        "link": "https://example.com/episode-1"
      }
    ],
    "resolution": ["1080p", "720p", "480p"],
    "thumbnail": "https://example.com/thumbnail.jpg",
    "status": "ongoing"
  }
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/detail?slug=one-piece"
```

**JavaScript:**
```javascript
const slug = 'one-piece';
const response = await fetch(`http://localhost:3000/api/v1/detail?slug=${slug}`);
const data = await response.json();
console.log(data.data.title); // "one piece"
```

---

## 3. Pencarian Anime

Mencari anime berdasarkan judul atau keyword.

### Endpoint
```
GET /api/v1/search?q={keyword}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Keyword pencarian (judul anime) |

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "title": "one piece",
      "slug": "one-piece",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "link": "https://example.com/anime/one-piece",
      "rating": 8.5
    }
  ],
  "total": 5,
  "query": "one piece"
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/search?q=naruto"
```

**JavaScript:**
```javascript
const query = 'naruto';
const response = await fetch(`http://localhost:3000/api/v1/search?q=${encodeURIComponent(query)}`);
const data = await response.json();
console.log(data.data); // Array hasil pencarian
```

---

## 4. List Anime

Mendapatkan daftar semua anime dengan pagination.

### Endpoint
```
GET /api/v1/list?page={page}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Nomor halaman (default: 1) |

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "title": "anime title",
      "slug": "anime-slug",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "link": "https://example.com/anime/anime-slug"
    }
  ],
  "total": 100,
  "page": 1
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/list?page=1"
```

**JavaScript:**
```javascript
const page = 1;
const response = await fetch(`http://localhost:3000/api/v1/list?page=${page}`);
const data = await response.json();
console.log(`Page ${data.page} dari ${Math.ceil(data.total / 20)} halaman`);
```

---

## 5. Video Episode

Mendapatkan link video streaming untuk episode tertentu.

### Endpoint
```
GET /api/v1/episode?url={url-episode}
GET /api/v1/episode?slug={slug}&episode={episode-number}
```

### Parameter

**Metode 1 (dengan URL):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | URL lengkap episode |

**Metode 2 (dengan slug & episode):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Slug anime |
| `episode` | number | Yes | Nomor episode |

### Response Format

```json
{
  "success": true,
  "data": {
    "title": "one piece episode 1",
    "episodeNumber": "1",
    "animeTitle": "one piece",
    "videoSources": [
      {
        "url": "https://example.com/video-1080p.mp4",
        "resolution": "1080p",
        "type": "video/mp4",
        "quality": "1080p"
      },
      {
        "url": "https://example.com/video-720p.mp4",
        "resolution": "720p",
        "type": "video/mp4",
        "quality": "720p"
      }
    ],
    "resolutions": ["1080p", "720p", "480p", "360p"],
    "thumbnail": "https://example.com/thumbnail.jpg",
    "description": "Deskripsi episode"
  }
}
```

### Contoh Penggunaan

**cURL:**
```bash
# Metode 1: Dengan URL
curl "http://localhost:3000/api/v1/episode?url=https://s7.nontonanimeid.boats/anime/one-piece/episode-1"

# Metode 2: Dengan slug & episode
curl "http://localhost:3000/api/v1/episode?slug=one-piece&episode=1"
```

**JavaScript:**
```javascript
// Metode 1
const url = 'https://s7.nontonanimeid.boats/anime/one-piece/episode-1';
const response1 = await fetch(`http://localhost:3000/api/v1/episode?url=${encodeURIComponent(url)}`);

// Metode 2
const response2 = await fetch(`http://localhost:3000/api/v1/episode?slug=one-piece&episode=1`);

const data = await response2.json();
const videoUrl = data.data.videoSources[0].url; // Link video 1080p
```

---

## 6. Info Anime (AnimeInWeb)

Mendapatkan informasi lengkap anime dari AnimeInWeb.

### Endpoint
```
GET /api/v1/animeinweb?id={anime-id}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | ID anime dari AnimeInWeb |

### Response Format

```json
{
  "success": true,
  "data": {
    "id": "426",
    "title": "one piece",
    "synopsis": "Sinopsis lengkap...",
    "genres": ["action", "adventure"],
    "views": "11888316",
    "favorites": "26232",
    "status": "ongoing",
    "episodes": [
      {
        "episodeNumber": "1",
        "title": "Episode 1",
        "link": "https://animeinweb.com/anime/426/episode/1"
      }
    ],
    "thumbnail": "https://example.com/thumbnail.jpg",
    "cover": "https://example.com/cover.jpg",
    "poster": "https://example.com/poster.jpg"
  }
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/animeinweb?id=426"
```

**JavaScript:**
```javascript
const animeId = '426';
const response = await fetch(`http://localhost:3000/api/v1/animeinweb?id=${animeId}`);
const data = await response.json();
console.log(data.data.title); // "one piece"
```

---

## 7. Video Episode (AnimeInWeb)

Mendapatkan link video streaming untuk episode tertentu dari AnimeInWeb.

### Endpoint
```
GET /api/v1/animeinweb/episode?animeId={id}&episodeNumber={episode}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `animeId` | string | Yes | ID anime |
| `episodeNumber` | number | Yes | Nomor episode |

### Response Format

```json
{
  "success": true,
  "data": {
    "animeId": "426",
    "episodeNumber": "500",
    "title": "one piece episode 500",
    "videoSources": [
      {
        "url": "https://example.com/video.mp4",
        "resolution": "1080p",
        "type": "video/mp4"
      }
    ],
    "resolutions": ["1080p", "720p", "480p"],
    "thumbnail": "https://example.com/thumbnail.jpg"
  }
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/animeinweb/episode?animeId=426&episodeNumber=500"
```

**JavaScript:**
```javascript
const animeId = '426';
const episodeNumber = 500;
const response = await fetch(
  `http://localhost:3000/api/v1/animeinweb/episode?animeId=${animeId}&episodeNumber=${episodeNumber}`
);
const data = await response.json();
const videoUrl = data.data.videoSources[0].url;
```

---

## 8. Jadwal Anime

Mendapatkan jadwal anime per hari (Senin-Minggu) atau random.

### Endpoint
```
GET /api/v1/animeinweb/schedule?day={hari}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `day` | string | No | Hari yang ingin diambil (default: semua hari) |

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

### Response Format

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
        "thumbnail": "https://example.com/thumbnail.jpg",
        "cover": "https://example.com/cover.jpg",
        "poster": "https://example.com/poster.jpg",
        "isNew": true,
        "status": "ongoing"
      }
    ]
  }
}
```

### Contoh Penggunaan

**cURL:**
```bash
# Jadwal hari Senin
curl "http://localhost:3000/api/v1/animeinweb/schedule?day=senin"

# Jadwal hari Minggu
curl "http://localhost:3000/api/v1/animeinweb/schedule?day=minggu"

# Random
curl "http://localhost:3000/api/v1/animeinweb/schedule?day=random"
```

**JavaScript:**
```javascript
// Ambil jadwal hari Senin
const response = await fetch('http://localhost:3000/api/v1/animeinweb/schedule?day=senin');
const data = await response.json();
console.log(`Hari: ${data.data.currentDay}`);
console.log(`Total anime: ${data.data.schedule.length}`);

// Loop semua hari
const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
for (const day of days) {
  const res = await fetch(`http://localhost:3000/api/v1/animeinweb/schedule?day=${day}`);
  const schedule = await res.json();
  console.log(`${day}: ${schedule.data.schedule.length} anime`);
}
```

**📖 Dokumentasi Lengkap:** Lihat [SCHEDULE_API.md](./SCHEDULE_API.md) untuk dokumentasi detail.

---

## 9. Anime Trending

Mendapatkan daftar anime yang sedang trending/popular.

### Endpoint
```
GET /api/v1/animeinweb/trending
```

### Parameter
Tidak ada parameter.

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "426",
      "title": "one piece",
      "views": "11888316",
      "favorites": "26232",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "link": "https://animeinweb.com/anime/426",
      "status": "ongoing"
    }
  ]
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/animeinweb/trending"
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/animeinweb/trending');
const data = await response.json();
console.log(data.data); // Array anime trending
```

---

## 10. Anime Baru

Mendapatkan daftar anime yang baru ditambahkan.

### Endpoint
```
GET /api/v1/animeinweb/new
```

### Parameter
Tidak ada parameter.

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "6101",
      "title": "anime baru",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "link": "https://animeinweb.com/anime/6101",
      "isNew": true
    }
  ]
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/animeinweb/new"
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/animeinweb/new');
const data = await response.json();
console.log(data.data); // Array anime baru
```

---

## 11. Anime Hari Ini

Mendapatkan daftar anime yang update hari ini.

### Endpoint
```
GET /api/v1/animeinweb/today
```

### Parameter
Tidak ada parameter.

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "6101",
      "title": "anime hari ini",
      "releaseTime": "new !!",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "link": "https://animeinweb.com/anime/6101",
      "isNew": true
    }
  ]
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/animeinweb/today"
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/animeinweb/today');
const data = await response.json();
console.log(data.data); // Array anime hari ini
```

---

## 12. Download Episode

Mendapatkan link download langsung untuk episode tertentu.

### Endpoint
```
GET /api/v1/download/episode?animeId={id}&episodeNumber={episode}&resolution={resolusi}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `animeId` | string | Yes | ID anime |
| `episodeNumber` | number | Yes | Nomor episode |
| `resolution` | string | Yes | Resolusi video (1080p, 720p, 480p, 360p) |

### Response Format

```json
{
  "success": true,
  "data": {
    "animeId": "426",
    "episodeNumber": "500",
    "resolution": "1080p",
    "downloadUrl": "https://example.com/download/episode-500-1080p.mp4",
    "fileSize": "500MB",
    "format": "mp4"
  }
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/download/episode?animeId=426&episodeNumber=500&resolution=1080p"
```

**JavaScript:**
```javascript
const animeId = '426';
const episodeNumber = 500;
const resolution = '1080p';
const response = await fetch(
  `http://localhost:3000/api/v1/download/episode?animeId=${animeId}&episodeNumber=${episodeNumber}&resolution=${resolution}`
);
const data = await response.json();
console.log(data.data.downloadUrl); // Link download
```

---

## 13. Download Batch

Mendapatkan link download untuk beberapa episode sekaligus (batch).

### Endpoint
```
GET /api/v1/download/batch?animeId={id}&resolution={resolusi}&startEpisode={start}&endEpisode={end}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `animeId` | string | Yes | ID anime |
| `resolution` | string | Yes | Resolusi video (1080p, 720p, 480p, 360p) |
| `startEpisode` | number | Yes | Episode awal |
| `endEpisode` | number | Yes | Episode akhir |

### Response Format

```json
{
  "success": true,
  "data": {
    "animeId": "426",
    "resolution": "1080p",
    "startEpisode": 1,
    "endEpisode": 10,
    "downloads": [
      {
        "episodeNumber": "1",
        "downloadUrl": "https://example.com/download/episode-1-1080p.mp4",
        "fileSize": "500MB"
      },
      {
        "episodeNumber": "2",
        "downloadUrl": "https://example.com/download/episode-2-1080p.mp4",
        "fileSize": "500MB"
      }
    ],
    "totalEpisodes": 10
  }
}
```

### Contoh Penggunaan

**cURL:**
```bash
curl "http://localhost:3000/api/v1/download/batch?animeId=426&resolution=1080p&startEpisode=1&endEpisode=10"
```

**JavaScript:**
```javascript
const animeId = '426';
const resolution = '1080p';
const startEpisode = 1;
const endEpisode = 10;
const response = await fetch(
  `http://localhost:3000/api/v1/download/batch?animeId=${animeId}&resolution=${resolution}&startEpisode=${startEpisode}&endEpisode=${endEpisode}`
);
const data = await response.json();
console.log(`Total: ${data.data.totalEpisodes} episode`);
data.data.downloads.forEach(download => {
  console.log(`Episode ${download.episodeNumber}: ${download.downloadUrl}`);
});
```

---

## 🔧 Error Handling

Semua endpoint mengembalikan format error yang konsisten:

```json
{
  "success": false,
  "error": "Pesan error yang jelas"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `400` | Bad Request (parameter tidak valid) |
| `404` | Not Found (data tidak ditemukan) |
| `500` | Internal Server Error |

### Contoh Error Response

```json
{
  "success": false,
  "error": "Anime tidak ditemukan"
}
```

### Best Practices

```javascript
async function fetchAPI(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      console.error('API Error:', data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('Network Error:', error);
    return null;
  }
}
```

---

## 🚀 Performance Tips

1. **Caching**: Cache response di client-side untuk mengurangi request
2. **Batch Requests**: Request beberapa endpoint secara parallel jika memungkinkan
3. **Error Retry**: Implement retry logic untuk network errors
4. **Pagination**: Gunakan pagination untuk list yang panjang

### Contoh dengan Retry

```javascript
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
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

- Semua endpoint mendukung **CORS** untuk penggunaan di frontend
- Response time bervariasi tergantung network dan server load
- Untuk production, disarankan menggunakan caching layer
- Semua data text dikonversi ke **lowercase** sesuai preferensi
- API menggunakan **caching** untuk meningkatkan performa

---

## 🔗 Related Documentation

- [SCHEDULE_API.md](./SCHEDULE_API.md) - Dokumentasi detail untuk Schedule API
- [README.md](./README.md) - Dokumentasi setup dan instalasi

---

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository GitHub.

---

**Last Updated**: 2025-01-05  
**API Version**: 1.0.0  
**Author**: Raisyahah

