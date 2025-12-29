# 📚 Anime API - Dokumentasi Lengkap

Dokumentasi lengkap untuk semua endpoint API Anime dari NontonAnimeID, AnimeInWeb, dan **MyAnimeList**.

## 🎯 Overview

API ini menyediakan akses ke data anime real-time dari berbagai sumber dengan performa tinggi dan tanpa iklan. Semua endpoint menggunakan format response yang konsisten dan mendukung CORS untuk penggunaan di frontend.

**Fitur Utama:**
- ✅ Data anime dari multiple source (NontonAnimeID, AnimeInWeb)
- ✅ Video streaming dengan multiple resolusi
- ✅ **Integrasi MyAnimeList** - Login, bookmark, statistik user
- ✅ Sync bookmark dari MAL ke web kamu
- ✅ Download episode dan batch

**Base URL:**
- **Local**: `http://localhost:3000/api/v1`
- **Production**: `https://anime-api-three-jade.vercel.app/api/v1`

---

## 📋 Daftar Isi

### NontonAnimeID & AnimeInWeb
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

### MyAnimeList Integration
14. [MAL: Login (OAuth2)](#14-mal-login-oauth2)
15. [MAL: Callback OAuth2](#15-mal-callback-oauth2)
16. [MAL: Refresh Token](#16-mal-refresh-token)
17. [MAL: User Profile](#17-mal-user-profile)
18. [MAL: User Anime List (Bookmark)](#18-mal-user-anime-list-bookmark)
19. [MAL: Anime Detail](#19-mal-anime-detail)
20. [MAL: Search Anime](#20-mal-search-anime)
21. [MAL: Anime Ranking](#21-mal-anime-ranking)
22. [MAL: Seasonal Anime](#22-mal-seasonal-anime)
23. [MAL: Update Anime List](#23-mal-update-anime-list)
24. [MAL: Delete dari List](#24-mal-delete-dari-list)
25. [MAL: Sync Bookmark](#25-mal-sync-bookmark)

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

## 14. MAL: Login (OAuth2)

Mendapatkan URL authorization untuk login ke MyAnimeList.

### Endpoint
```
GET /api/v1/mal/auth
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | string | No | Custom state untuk tracking |

### Response Format

```json
{
  "success": true,
  "data": {
    "authorization_url": "https://myanimelist.net/v1/oauth2/authorize?...",
    "state": "random_state_string",
    "message": "Redirect user ke authorization_url untuk login MyAnimeList"
  }
}
```

### Flow Login

1. Frontend panggil `/api/v1/mal/auth`
2. Redirect user ke `authorization_url`
3. User login di MAL dan authorize app
4. MAL redirect ke callback URL dengan `code` dan `state`
5. Backend exchange code untuk token

### Contoh Penggunaan

**JavaScript:**
```javascript
// Step 1: Get authorization URL
const response = await fetch('http://localhost:3000/api/v1/mal/auth');
const data = await response.json();

// Step 2: Redirect user ke MAL
window.location.href = data.data.authorization_url;
```

---

## 15. MAL: Callback OAuth2

Endpoint callback setelah user login di MyAnimeList.

### Endpoint
```
GET /api/v1/mal/callback?code={code}&state={state}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Authorization code dari MAL |
| `state` | string | Yes | State dari step sebelumnya |

### Response Format

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 12345678,
      "name": "username",
      "picture": "https://...",
      "anime_statistics": {
        "num_items_watching": 10,
        "num_items_completed": 150,
        "num_items_on_hold": 5,
        "num_items_dropped": 3,
        "num_items_plan_to_watch": 50,
        "num_items": 218,
        "num_episodes": 3500,
        "mean_score": 7.5
      }
    },
    "token": {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "def50200...",
      "expires_in": 2678400,
      "expires_at": 1738836000000
    },
    "message": "Login berhasil! Simpan token ini untuk request selanjutnya"
  }
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
// Setelah redirect dari MAL, parse URL params
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Exchange code untuk token
const response = await fetch(`http://localhost:3000/api/v1/mal/callback?code=${code}&state=${state}`);
const data = await response.json();

// Simpan token
localStorage.setItem('mal_access_token', data.data.token.access_token);
localStorage.setItem('mal_refresh_token', data.data.token.refresh_token);
localStorage.setItem('mal_user', JSON.stringify(data.data.user));
```

---

## 16. MAL: Refresh Token

Refresh access token yang sudah expired.

### Endpoint
```
POST /api/v1/mal/refresh
```

### Body

```json
{
  "refresh_token": "def50200..."
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "access_token": "new_access_token...",
    "refresh_token": "new_refresh_token...",
    "expires_in": 2678400,
    "expires_at": 1738836000000
  }
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
const refreshToken = localStorage.getItem('mal_refresh_token');

const response = await fetch('http://localhost:3000/api/v1/mal/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token: refreshToken })
});

const data = await response.json();

// Update token
localStorage.setItem('mal_access_token', data.data.access_token);
localStorage.setItem('mal_refresh_token', data.data.refresh_token);
```

---

## 17. MAL: User Profile

Mendapatkan profil user yang sudah login beserta statistik anime.

### Endpoint
```
GET /api/v1/mal/user
```

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer {access_token}` |

### Response Format

```json
{
  "success": true,
  "data": {
    "id": 12345678,
    "name": "username",
    "picture": "https://api-cdn.myanimelist.net/images/...",
    "gender": "male",
    "birthday": "1990-01-15",
    "location": "Indonesia",
    "joined_at": "2015-05-20T10:30:00+00:00",
    "anime_statistics": {
      "num_items_watching": 10,
      "num_items_completed": 150,
      "num_items_on_hold": 5,
      "num_items_dropped": 3,
      "num_items_plan_to_watch": 50,
      "num_items": 218,
      "num_days_watched": 45.5,
      "num_episodes": 3500,
      "num_times_rewatched": 20,
      "mean_score": 7.5
    }
  }
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
const accessToken = localStorage.getItem('mal_access_token');

const response = await fetch('http://localhost:3000/api/v1/mal/user', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const data = await response.json();
console.log(`Halo, ${data.data.name}!`);
console.log(`Total anime: ${data.data.anime_statistics.num_items}`);
console.log(`Total episode ditonton: ${data.data.anime_statistics.num_episodes}`);
```

---

## 18. MAL: User Anime List (Bookmark)

Mendapatkan daftar anime user (bookmark/watchlist).

### Endpoint
```
GET /api/v1/mal/animelist
```

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer {access_token}` |

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter: `watching`, `completed`, `on_hold`, `dropped`, `plan_to_watch` |
| `sort` | string | No | Sort: `list_score`, `list_updated_at`, `anime_title`, `anime_start_date` |
| `limit` | number | No | Jumlah per page (max 1000, default 100) |
| `offset` | number | No | Offset untuk pagination |

### Response Format

```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 218,
      "watching": 10,
      "completed": 150,
      "on_hold": 5,
      "dropped": 3,
      "plan_to_watch": 50,
      "total_episodes_watched": 3500
    },
    "anime_list": [
      {
        "mal_id": 21,
        "title": "one punch man",
        "main_picture": {
          "medium": "https://...",
          "large": "https://..."
        },
        "synopsis": "Saitama adalah pahlawan...",
        "mean_score": 8.5,
        "genres": ["action", "comedy", "parody"],
        "studios": [{"id": 11, "name": "madhouse"}],
        "status": "finished_airing",
        "num_episodes": 12,
        "start_date": "2015-10-05",
        "end_date": "2015-12-21",
        "start_season": {"year": 2015, "season": "fall"},
        "broadcast": {"day_of_the_week": "monday", "start_time": "01:05"},
        "media_type": "tv",
        "rating": "pg_13",
        "list_status": {
          "status": "completed",
          "score": 9,
          "num_episodes_watched": 12,
          "is_rewatching": false,
          "updated_at": "2024-01-15T10:30:00+00:00",
          "start_date": "2024-01-01",
          "finish_date": "2024-01-10",
          "num_times_rewatched": 2
        }
      }
    ],
    "paging": {
      "previous": null,
      "next": "https://..."
    }
  }
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
const accessToken = localStorage.getItem('mal_access_token');

// Ambil semua anime list
const response = await fetch('http://localhost:3000/api/v1/mal/animelist', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const data = await response.json();
console.log(`Total anime: ${data.data.stats.total}`);
console.log(`Sedang ditonton: ${data.data.stats.watching}`);
console.log(`Sudah selesai: ${data.data.stats.completed}`);

// Filter hanya yang sedang ditonton
const watchingResponse = await fetch('http://localhost:3000/api/v1/mal/animelist?status=watching', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

---

## 19. MAL: Anime Detail

Mendapatkan detail lengkap anime dari MyAnimeList.

### Endpoint
```
GET /api/v1/mal/anime/{mal_id}
```

### Headers (Optional)

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer {access_token}` (untuk lihat status di list user) |

### Response Format

```json
{
  "success": true,
  "data": {
    "mal_id": 21,
    "title": "one punch man",
    "alternative_titles": {
      "synonyms": ["OPM"],
      "en": "One Punch Man",
      "ja": "ワンパンマン"
    },
    "main_picture": {
      "medium": "https://...",
      "large": "https://..."
    },
    "synopsis": "Saitama adalah pahlawan yang bisa mengalahkan siapapun...",
    "mean_score": 8.5,
    "rank": 125,
    "popularity": 5,
    "num_list_users": 3500000,
    "media_type": "tv",
    "status": "finished_airing",
    "genres": ["action", "comedy", "parody", "sci-fi", "super power"],
    "studios": [{"id": 11, "name": "madhouse"}],
    "num_episodes": 12,
    "start_date": "2015-10-05",
    "end_date": "2015-12-21",
    "start_season": {"year": 2015, "season": "fall"},
    "broadcast": {"day_of_the_week": "monday", "start_time": "01:05"},
    "source": "web_manga",
    "average_episode_duration": 1440,
    "rating": "pg_13",
    "pictures": [
      {"medium": "https://...", "large": "https://..."}
    ],
    "related_anime": [
      {
        "mal_id": 34134,
        "title": "one punch man 2nd season",
        "relation_type": "sequel",
        "relation_type_formatted": "Sequel"
      }
    ],
    "recommendations": [
      {
        "mal_id": 31964,
        "title": "mob psycho 100",
        "num_recommendations": 150
      }
    ],
    "statistics": {
      "status": {
        "watching": 150000,
        "completed": 2800000,
        "on_hold": 100000,
        "dropped": 50000,
        "plan_to_watch": 400000
      }
    },
    "my_list_status": {
      "status": "completed",
      "score": 9,
      "num_episodes_watched": 12
    }
  }
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
const malId = 21; // One Punch Man
const accessToken = localStorage.getItem('mal_access_token');

const response = await fetch(`http://localhost:3000/api/v1/mal/anime/${malId}`, {
  headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
});

const data = await response.json();
console.log(`Title: ${data.data.title}`);
console.log(`Score: ${data.data.mean_score}`);
console.log(`Episodes: ${data.data.num_episodes}`);
console.log(`Status: ${data.data.status}`);
```

---

## 20. MAL: Search Anime

Mencari anime di MyAnimeList.

### Endpoint
```
GET /api/v1/mal/search?q={query}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Keyword pencarian |
| `limit` | number | No | Jumlah hasil (max 100, default 10) |

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "mal_id": 21,
      "title": "one punch man",
      "main_picture": {
        "medium": "https://...",
        "large": "https://..."
      },
      "synopsis": "Saitama adalah...",
      "mean_score": 8.5,
      "genres": ["action", "comedy"],
      "studios": [{"id": 11, "name": "madhouse"}],
      "status": "finished_airing",
      "num_episodes": 12,
      "start_date": "2015-10-05",
      "start_season": {"year": 2015, "season": "fall"},
      "media_type": "tv"
    }
  ],
  "query": "one punch man"
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
const query = 'naruto';
const response = await fetch(`http://localhost:3000/api/v1/mal/search?q=${encodeURIComponent(query)}&limit=20`);
const data = await response.json();

data.data.forEach(anime => {
  console.log(`${anime.title} (${anime.mean_score})`);
});
```

---

## 21. MAL: Anime Ranking

Mendapatkan ranking anime dari MyAnimeList.

### Endpoint
```
GET /api/v1/mal/ranking
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Ranking type (default: `all`) |
| `limit` | number | No | Jumlah per page (max 500, default 10) |
| `offset` | number | No | Offset untuk pagination |

### Ranking Types

| Type | Description |
|------|-------------|
| `all` | Top anime overall |
| `airing` | Top anime yang sedang tayang |
| `upcoming` | Top anime yang akan datang |
| `tv` | Top anime TV series |
| `ova` | Top OVA |
| `movie` | Top anime movie |
| `special` | Top special |
| `bypopularity` | Top by popularity |
| `favorite` | Top by favorites |

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "mal_id": 5114,
      "title": "fullmetal alchemist: brotherhood",
      "main_picture": {...},
      "mean_score": 9.1,
      "genres": ["action", "adventure", "drama", "fantasy"],
      "status": "finished_airing",
      "num_episodes": 64
    }
  ],
  "ranking_type": "all"
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
// Top 10 anime overall
const response = await fetch('http://localhost:3000/api/v1/mal/ranking?type=all&limit=10');
const data = await response.json();

data.data.forEach(anime => {
  console.log(`#${anime.rank} ${anime.title} (${anime.mean_score})`);
});

// Top anime yang sedang tayang
const airingResponse = await fetch('http://localhost:3000/api/v1/mal/ranking?type=airing&limit=10');
```

---

## 22. MAL: Seasonal Anime

Mendapatkan daftar anime per musim.

### Endpoint
```
GET /api/v1/mal/season/{year}/{season}
```

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | number | Yes | Tahun (contoh: 2024) |
| `season` | string | Yes | Season: `winter`, `spring`, `summer`, `fall` |
| `sort` | string | No | Sort: `anime_score`, `anime_num_list_users` |
| `limit` | number | No | Jumlah per page (max 500, default 10) |
| `offset` | number | No | Offset untuk pagination |

### Response Format

```json
{
  "success": true,
  "season": {"year": 2024, "season": "winter"},
  "data": [
    {
      "mal_id": 52991,
      "title": "sousou no frieren",
      "main_picture": {...},
      "mean_score": 9.1,
      "genres": ["adventure", "drama", "fantasy"],
      "status": "currently_airing",
      "num_episodes": 28,
      "broadcast": {"day_of_the_week": "friday", "start_time": "23:00"}
    }
  ]
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
const year = 2024;
const season = 'winter';
const response = await fetch(`http://localhost:3000/api/v1/mal/season/${year}/${season}?limit=20`);
const data = await response.json();

console.log(`Anime ${season} ${year}:`);
data.data.forEach(anime => {
  console.log(`- ${anime.title} (${anime.mean_score})`);
});
```

---

## 23. MAL: Update Anime List

Menambah atau update anime di list user.

### Endpoint
```
PATCH /api/v1/mal/animelist/{animeId}
```

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer {access_token}` |
| `Content-Type` | `application/json` |

### Body

```json
{
  "status": "watching",
  "score": 8,
  "num_episodes_watched": 5
}
```

### Status Values

| Status | Description |
|--------|-------------|
| `watching` | Sedang ditonton |
| `completed` | Sudah selesai |
| `on_hold` | Ditunda |
| `dropped` | Berhenti nonton |
| `plan_to_watch` | Mau ditonton |

### Response Format

```json
{
  "success": true,
  "data": {
    "status": "watching",
    "score": 8,
    "num_episodes_watched": 5,
    "is_rewatching": false,
    "updated_at": "2024-01-15T10:30:00+00:00"
  },
  "message": "Anime list berhasil diupdate"
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
const accessToken = localStorage.getItem('mal_access_token');
const animeId = 21; // One Punch Man

// Tambah ke watching list
const response = await fetch(`http://localhost:3000/api/v1/mal/animelist/${animeId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'watching',
    num_episodes_watched: 3
  })
});

// Mark as completed dengan score
const completeResponse = await fetch(`http://localhost:3000/api/v1/mal/animelist/${animeId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'completed',
    score: 9,
    num_episodes_watched: 12
  })
});
```

---

## 24. MAL: Delete dari List

Menghapus anime dari list user.

### Endpoint
```
DELETE /api/v1/mal/animelist/{animeId}
```

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer {access_token}` |

### Response Format

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Anime berhasil dihapus dari list"
  }
}
```

### Contoh Penggunaan

**JavaScript:**
```javascript
const accessToken = localStorage.getItem('mal_access_token');
const animeId = 21;

const response = await fetch(`http://localhost:3000/api/v1/mal/animelist/${animeId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const data = await response.json();
if (data.success) {
  console.log('Anime berhasil dihapus dari list!');
}
```

---

## 25. MAL: Sync Bookmark

Sync bookmark dari MAL dengan data anime lengkap. Gunakan endpoint ini untuk mendapatkan seluruh watchlist user beserta statistik.

### Endpoint
```
GET /api/v1/mal/sync
```

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer {access_token}` |

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter status (watching, completed, dll) |

### Response Format

```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 218,
      "watching": 10,
      "completed": 150,
      "on_hold": 5,
      "dropped": 3,
      "plan_to_watch": 50,
      "total_episodes_watched": 3500
    },
    "anime_list": [
      {
        "mal_id": 21,
        "title": "one punch man",
        "synopsis": "Saitama adalah...",
        "mean_score": 8.5,
        "genres": ["action", "comedy"],
        "studios": [{"id": 11, "name": "madhouse"}],
        "status": "finished_airing",
        "num_episodes": 12,
        "start_date": "2015-10-05",
        "end_date": "2015-12-21",
        "start_season": {"year": 2015, "season": "fall"},
        "broadcast": {"day_of_the_week": "monday"},
        "media_type": "tv",
        "rating": "pg_13",
        "main_picture": {...},
        "list_status": {
          "status": "completed",
          "score": 9,
          "num_episodes_watched": 12
        },
        "animeinweb_id": null,
        "has_video": false
      }
    ],
    "message": "Data anime dari MAL. Gunakan endpoint /api/v1/animeinweb untuk video streaming."
  }
}
```

### Contoh Penggunaan dengan Frontend

**JavaScript:**
```javascript
const accessToken = localStorage.getItem('mal_access_token');

// Sync seluruh bookmark
const response = await fetch('http://localhost:3000/api/v1/mal/sync', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const data = await response.json();

// Tampilkan statistik
console.log(`Total anime: ${data.data.stats.total}`);
console.log(`Sedang ditonton: ${data.data.stats.watching}`);
console.log(`Sudah selesai: ${data.data.stats.completed}`);
console.log(`Total episode: ${data.data.stats.total_episodes_watched}`);

// Untuk setiap anime yang sedang ditonton, cari video di animeinweb
const watching = data.data.anime_list.filter(a => a.list_status.status === 'watching');

for (const anime of watching) {
  // Search di animeinweb berdasarkan title
  const searchRes = await fetch(`http://localhost:3000/api/v1/search?q=${encodeURIComponent(anime.title)}`);
  const searchData = await searchRes.json();
  
  if (searchData.data && searchData.data.length > 0) {
    console.log(`Found ${anime.title} di animeinweb!`);
    // Bisa lanjut ambil video episode
  }
}
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

## 🔐 Setup MyAnimeList Integration

Untuk menggunakan fitur MAL, kamu perlu:

### 1. Daftar API di MyAnimeList

1. Buka [https://myanimelist.net/apiconfig](https://myanimelist.net/apiconfig)
2. Login dengan akun MAL kamu
3. Klik "Create ID"
4. Isi form:
   - **App Name**: Nama aplikasi kamu
   - **App Type**: Web
   - **App Description**: Deskripsi singkat
   - **App Redirect URL**: `http://localhost:3000/api/v1/mal/callback` (untuk development)
   - **Homepage URL**: URL website kamu
5. Submit dan catat **Client ID** dan **Client Secret**

### 2. Set Environment Variables

Tambahkan di file `.env`:

```env
MAL_CLIENT_ID=your_client_id_here
MAL_CLIENT_SECRET=your_client_secret_here
MAL_REDIRECT_URI=http://localhost:3000/api/v1/mal/callback
```

Untuk production di Vercel:
```env
MAL_REDIRECT_URI=https://your-domain.vercel.app/api/v1/mal/callback
```

### 3. Update Redirect URI di MAL

Jika deploy ke Vercel, update **App Redirect URL** di [MAL API Config](https://myanimelist.net/apiconfig) dengan URL production kamu.

### Flow Login Lengkap

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Frontend ──────────► /api/v1/mal/auth                      │
│                          ↓                                      │
│                          Returns authorization_url              │
│                          ↓                                      │
│  2. Redirect user ─────► myanimelist.net/v1/oauth2/authorize   │
│                          ↓                                      │
│                          User login & authorize                 │
│                          ↓                                      │
│  3. MAL redirect ──────► /api/v1/mal/callback?code=...&state=..│
│                          ↓                                      │
│                          Exchange code for token                │
│                          ↓                                      │
│  4. Return tokens ─────► access_token + refresh_token          │
│                          ↓                                      │
│  5. Save tokens ───────► localStorage / database               │
│                          ↓                                      │
│  6. Use tokens ────────► Authorization: Bearer {access_token}  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Contoh Complete Implementation

**HTML (index.html):**
```html
<button id="loginBtn">Login dengan MyAnimeList</button>
<div id="userInfo" style="display: none;">
  <img id="userPic" src="" alt="Profile Picture" width="50">
  <span id="userName"></span>
  <button id="logoutBtn">Logout</button>
</div>

<script>
const API_URL = 'http://localhost:3000/api/v1';

// Check if already logged in
const accessToken = localStorage.getItem('mal_access_token');
if (accessToken) {
  showUserInfo();
}

// Login button
document.getElementById('loginBtn').addEventListener('click', async () => {
  const res = await fetch(`${API_URL}/mal/auth`);
  const data = await res.json();
  window.location.href = data.data.authorization_url;
});

// Handle callback (jika halaman ini adalah callback page)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

if (code && state) {
  handleCallback(code, state);
}

async function handleCallback(code, state) {
  const res = await fetch(`${API_URL}/mal/callback?code=${code}&state=${state}`);
  const data = await res.json();
  
  if (data.success) {
    localStorage.setItem('mal_access_token', data.data.token.access_token);
    localStorage.setItem('mal_refresh_token', data.data.token.refresh_token);
    localStorage.setItem('mal_user', JSON.stringify(data.data.user));
    
    // Clear URL params
    window.history.replaceState({}, document.title, window.location.pathname);
    
    showUserInfo();
  }
}

async function showUserInfo() {
  const user = JSON.parse(localStorage.getItem('mal_user'));
  
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('userInfo').style.display = 'block';
  document.getElementById('userPic').src = user.picture || '';
  document.getElementById('userName').textContent = user.name;
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('mal_access_token');
  localStorage.removeItem('mal_refresh_token');
  localStorage.removeItem('mal_user');
  window.location.reload();
});
</script>
```

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



