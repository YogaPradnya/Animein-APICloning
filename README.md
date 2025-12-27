# Anime API - NontonAnimeID

API untuk mengambil data anime dari website nontonanimeid.boats

## Fitur

- ✅ Episode terbaru
- ✅ Detail anime (judul, sinopsis, rating, dll)
- ✅ Pencarian anime
- ✅ List semua anime
- ✅ **Video episode dengan resolusi** 🆕
- ✅ Data lengkap: resolusi, studio, genre, tanggal rilis, jadwal rilis

## Endpoints

### 1. Episode Terbaru
```
GET /api/latest
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "title": "nama anime",
      "episode": "episode 1",
      "thumbnail": "url thumbnail",
      "link": "url episode",
      "resolution": "1080p",
      "releaseDate": "tanggal rilis"
    }
  ],
  "total": 10
}
```

### 2. Detail Anime
```
GET /api/detail?slug=nama-anime-slug
```

Response:
```json
{
  "success": true,
  "data": {
    "title": "nama anime",
    "originalTitle": "judul asli",
    "synopsis": "sinopsis anime",
    "rating": 8.5,
    "releaseDate": "tanggal rilis",
    "schedule": "jadwal rilis",
    "studio": "nama studio",
    "genres": ["action", "adventure"],
    "episodes": [...],
    "resolution": ["1080p", "720p"],
    "thumbnail": "url thumbnail",
    "status": "ongoing"
  }
}
```

### 3. Pencarian Anime
```
GET /api/search?q=keyword
```

Response:
```json
{
  "success": true,
  "data": [...],
  "total": 5,
  "query": "keyword"
}
```

### 4. List Anime
```
GET /api/list?page=1
```

Response:
```json
{
  "success": true,
  "data": [...],
  "total": 20,
  "page": 1
}
```

### 5. Video Episode dengan Resolusi 🆕
```
GET /api/episode?url=https://s7.nontonanimeid.boats/anime/one-piece/episode-1
GET /api/episode?slug=one-piece&episode=1
```

Response:
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
    "description": "deskripsi episode"
  }
}
```

## 🚀 Install & Run

### Install Dependencies
```bash
npm install
```

### Install Playwright Browser
```bash
npx playwright install chromium
```

### Run Server (Development)
```bash
npm run dev
# atau
npm start
```

Server akan berjalan di `http://localhost:3000`

### Test API
```bash
# Test root endpoint
curl http://localhost:3000/

# Test latest episodes
curl http://localhost:3000/api/latest

# Test search
curl "http://localhost:3000/api/search?q=one%20piece"

# Test detail
curl "http://localhost:3000/api/detail?slug=one-piece"

# Test list
curl "http://localhost:3000/api/list?page=1"

# Test episode video
curl "http://localhost:3000/api/episode?url=https://s7.nontonanimeid.boats/anime/one-piece/episode-1"
curl "http://localhost:3000/api/episode?slug=one-piece&episode=1"
```

## 📦 Deploy ke Vercel

### Cara 1: Menggunakan Vercel CLI
```bash
# Install Vercel CLI (jika belum)
npm i -g vercel

# Deploy
vercel
```

### Cara 2: Via GitHub
1. Push project ke GitHub
2. Buka Vercel dashboard
3. Connect repository
4. Deploy otomatis

**Catatan:** Untuk production di Vercel, gunakan endpoint serverless functions di folder `api/`. Server `server.js` hanya untuk development lokal.

## Catatan

- API ini menggunakan Playwright untuk scraping website yang menggunakan JavaScript rendering
- Semua data text dikonversi ke lowercase sesuai preferensi
- API sudah include CORS headers untuk bisa diakses dari frontend

