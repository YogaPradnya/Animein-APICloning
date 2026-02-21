# 🎌 AnimeAPI — Panduan Endpoint Terbaru

> **Base URL (Local):** `http://localhost:3001/api/v1`  
> **Base URL (Production):** `https://anime-api-three-jade.vercel.app/api/v1`  
> **Versi:** 1.1.0 — _Fitur download dihapus, bug scraper diperbaiki_

---

## 📋 Daftar Endpoint Aktif

| No  | Endpoint                      | Method | Deskripsi                               |
| --- | ----------------------------- | ------ | --------------------------------------- |
| 1   | `/api/v1/latest`              | GET    | Episode anime terbaru                   |
| 2   | `/api/v1/search`              | GET    | Cari anime (keyword, genre, sort, page) |
| 3   | `/api/v1/genres`              | GET    | List semua genre                        |
| 4   | `/api/v1/detail`              | GET    | Detail anime by slug atau URL           |
| 5   | `/api/v1/list`                | GET    | List semua anime dengan pagination      |
| 6   | `/api/v1/animeinweb`          | GET    | Info anime dari AnimeInWeb by ID        |
| 7   | `/api/v1/animeinweb/episode`  | GET    | Video streaming per episode             |
| 8   | `/api/v1/animeinweb/schedule` | GET    | Jadwal anime per hari                   |
| 9   | `/api/v1/animeinweb/trending` | GET    | Anime sedang trending                   |
| 10  | `/api/v1/animeinweb/new`      | GET    | Anime baru ditambahkan                  |
| 11  | `/api/v1/animeinweb/today`    | GET    | Anime update hari ini                   |
| 12  | `/api/v1/episode`             | GET    | Video streaming NontonAnimeID           |

---

## 1. 📺 Episode Terbaru

```
GET /api/v1/latest
```

Tidak ada parameter.

```bash
curl "http://localhost:3001/api/v1/latest"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "title": "nama anime",
      "episode": "episode 5",
      "link": "https://...",
      "thumbnail": "https://..."
    }
  ],
  "total": 11
}
```

---

## 2. 🔍 Pencarian Anime

```
GET /api/v1/search?q={keyword}&genre={id}&sort={sort}&page={page}
```

| Parameter | Type   | Wajib | Default | Keterangan                              |
| --------- | ------ | ----- | ------- | --------------------------------------- |
| `q`       | string | ❌    | `""`    | Keyword pencarian                       |
| `genre`   | number | ❌    | -       | ID genre (lihat `/genres`)              |
| `sort`    | string | ❌    | `views` | `views`, `title`, `favorites`, `newest` |
| `page`    | number | ❌    | `0`     | Nomor halaman                           |

```bash
# Search keyword
curl "http://localhost:3001/api/v1/search?q=naruto"

# Filter genre Action (id=14), sort by views (terpopuler)
curl "http://localhost:3001/api/v1/search?genre=14&sort=views"

# Kombinasi
curl "http://localhost:3001/api/v1/search?q=hero&genre=14&sort=favorites&page=0"

# Semua anime sort terbaru
curl "http://localhost:3001/api/v1/search?sort=newest"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "animeId": "426",
      "title": "one piece",
      "type": "tv",
      "status": "ongoing",
      "year": "1999",
      "views": 11891844,
      "favorites": 26236,
      "genres": ["action", "adventure"],
      "poster": "https://...",
      "link": "https://animeinweb.com/anime/426"
    }
  ],
  "total": 60,
  "pagination": {
    "currentPage": 0,
    "hasNextPage": true,
    "totalResults": 60
  },
  "filters": { "keyword": "", "genre": "14", "sort": "views" }
}
```

---

## 3. 🏷️ List Genre

```
GET /api/v1/genres
```

Tidak ada parameter.

```bash
curl "http://localhost:3001/api/v1/genres"
```

**Response:**

```json
{
  "success": true,
  "data": [
    { "id": 14, "name": "action" },
    { "id": 1, "name": "adventure" },
    { "id": 2, "name": "comedy" }
  ],
  "total": 33
}
```

**Referensi ID Genre Populer:**

| ID  | Genre     | ID  | Genre         |
| --- | --------- | --- | ------------- |
| 14  | Action    | 20  | Romance       |
| 1   | Adventure | 21  | School        |
| 2   | Comedy    | 26  | Shounen       |
| 6   | Fantasy   | 28  | Slice of Life |
| 17  | Mystery   | 31  | Supernatural  |

---

## 4. 📖 Detail Anime

```
GET /api/v1/detail?slug={slug}
GET /api/v1/detail?slug={animeinweb-id}
GET /api/v1/detail?url={url-animeinweb}
```

| Parameter | Type   | Wajib | Keterangan                                         |
| --------- | ------ | ----- | -------------------------------------------------- |
| `slug`    | string | ✅    | Slug anime (misal: `one-piece`) atau ID AnimeInWeb |
| `url`     | string | ✅    | URL lengkap animeinweb.com                         |

```bash
# Dengan slug
curl "http://localhost:3001/api/v1/detail?slug=one-piece"

# Langsung dengan ID AnimeInWeb
curl "http://localhost:3001/api/v1/detail?slug=426"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "title": "one piece",
    "synopsis": "...",
    "status": "ongoing",
    "genres": ["action", "adventure"],
    "episodes": [
      { "number": "1100", "episodeId": "...", "title": "episode 1100" }
    ],
    "cover": "https://...",
    "poster": "https://...",
    "views": "11891844",
    "favorites": "26232"
  }
}
```

---

## 5. 📋 List Anime

```
GET /api/v1/list?page={page}
```

| Parameter | Type   | Wajib | Default |
| --------- | ------ | ----- | ------- |
| `page`    | number | ❌    | `1`     |

```bash
curl "http://localhost:3001/api/v1/list?page=1"
curl "http://localhost:3001/api/v1/list?page=2"
```

**Response:**

```json
{
  "success": true,
  "data": [{ "title": "...", "link": "..." }],
  "total": 60,
  "page": 1
}
```

---

## 6. 🎬 Info Anime AnimeInWeb

```
GET /api/v1/animeinweb?id={animeId}
```

| Parameter | Type   | Wajib | Keterangan                   |
| --------- | ------ | ----- | ---------------------------- |
| `id`      | string | ✅    | ID anime dari animeinweb.com |

```bash
curl "http://localhost:3001/api/v1/animeinweb?id=426"   # One Piece
curl "http://localhost:3001/api/v1/animeinweb?id=341"   # Naruto
```

**Response:**

```json
{
  "success": true,
  "data": {
    "title": "one piece",
    "synopsis": "...",
    "status": "ongoing",
    "episodes": [
      {
        "number": "5",
        "episodeId": "...",
        "link": "https://animeinweb.com/anime/426?ep=5"
      }
    ],
    "views": "11891844",
    "cover": "https://...",
    "poster": "https://..."
  }
}
```

---

## 7. 🎥 Video Episode (AnimeInWeb)

```
GET /api/v1/animeinweb/episode?animeId={id}&episodeNumber={ep}
```

| Parameter       | Type   | Wajib | Keterangan    |
| --------------- | ------ | ----- | ------------- |
| `animeId`       | string | ✅    | ID anime      |
| `episodeNumber` | number | ✅    | Nomor episode |

```bash
# One Piece episode 1
curl "http://localhost:3001/api/v1/animeinweb/episode?animeId=426&episodeNumber=1"

# Naruto episode 1
curl "http://localhost:3001/api/v1/animeinweb/episode?animeId=341&episodeNumber=1"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "animeId": "426",
    "episodeNumber": "1",
    "title": "episode 1",
    "videoSources": [
      {
        "url": "https://cdn.example.com/video.mp4",
        "resolution": "1080p",
        "quality": "1080p",
        "type": "video/mp4",
        "server": "rapsodi"
      }
    ],
    "resolutions": ["1080p", "720p", "480p"],
    "thumbnail": "https://..."
  }
}
```

---

## 8. 📅 Jadwal Anime

```
GET /api/v1/animeinweb/schedule?day={hari}
GET /api/v1/schedule?day={hari}          ← alias
```

| Parameter | Nilai Valid                                                              |
| --------- | ------------------------------------------------------------------------ |
| `day`     | `senin`, `selasa`, `rabu`, `kamis`, `jumat`, `sabtu`, `minggu`, `random` |

```bash
curl "http://localhost:3001/api/v1/schedule?day=senin"
curl "http://localhost:3001/api/v1/schedule?day=sabtu"
curl "http://localhost:3001/api/v1/schedule?day=random"
curl "http://localhost:3001/api/v1/schedule"  # Semua hari
```

**Response:**

```json
{
  "success": true,
  "data": {
    "currentDay": "SEN",
    "schedule": [
      {
        "animeId": "6068",
        "title": "anime title",
        "genre": "action",
        "views": "36315",
        "releaseTime": "new !!",
        "thumbnail": "https://...",
        "isNew": true,
        "status": "ongoing"
      }
    ]
  }
}
```

---

## 9. 🔥 Anime Trending

```
GET /api/v1/animeinweb/trending
GET /api/v1/trending                     ← alias
```

```bash
curl "http://localhost:3001/api/v1/trending"
```

**Response:**

```json
{
  "success": true,
  "data": [{ "id": "426", "title": "one piece", "views": "11888316" }],
  "total": 30
}
```

---

## 10. ✨ Anime Baru

```
GET /api/v1/animeinweb/new
GET /api/v1/new                          ← alias
```

```bash
curl "http://localhost:3001/api/v1/new"
```

**Response:**

```json
{
  "success": true,
  "data": [{ "id": "6101", "title": "anime baru", "isNew": true }],
  "total": 11
}
```

---

## 11. 📆 Anime Hari Ini

```
GET /api/v1/animeinweb/today
GET /api/v1/today                        ← alias
```

```bash
curl "http://localhost:3001/api/v1/today"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "day": "Sabtu",
    "date": "2026-02-21",
    "anime": [{ "title": "...", "episode": "..." }]
  }
}
```

---

## 12. 🎞️ Video Episode (NontonAnimeID)

```
GET /api/v1/episode?url={url}
GET /api/v1/episode?slug={slug}&episode={nomor}
```

| Parameter | Type   | Keterangan          |
| --------- | ------ | ------------------- |
| `url`     | string | URL lengkap episode |
| `slug`    | string | Slug anime          |
| `episode` | number | Nomor episode       |

```bash
# Dengan slug + episode
curl "http://localhost:3001/api/v1/episode?slug=one-piece&episode=1"

# Dengan URL langsung
curl "http://localhost:3001/api/v1/episode?url=https://s7.nontonanimeid.boats/anime/one-piece/episode-1"
```

> ⚠️ **Catatan:** Endpoint ini menggunakan scraping dari `nontonanimeid.boats` dan bergantung pada SSL certificate domain tersebut. Mungkin tidak selalu tersedia.

---

## ❌ Endpoint yang Dihapus

Fitur berikut telah **dihapus** dari versi ini:

| Endpoint                          | Alasan                    |
| --------------------------------- | ------------------------- |
| `GET /api/v1/download/episode`    | Dihapus sesuai permintaan |
| `GET /api/v1/download/batch`      | Dihapus sesuai permintaan |
| `GET /api/v1/download/batch-info` | Dihapus sesuai permintaan |

---

## 🔧 Changelog v1.1.0

- ✅ **Fix:** `episodeApiUrl is not defined` di `getAnimeInWebData`
- ✅ **Fix:** Scoping bug `keyword/genre/sort/page` tidak bisa diakses di catch block `searchAnime`
- ✅ **Fix:** `Cannot read properties of undefined (reading 'startsWith')` di `getAnimeDetail` dan `getAnimeInWebData`
- ✅ **Fix:** `getAnimeDetail` menggunakan `firstResult.animeId` (bukan `firstResult.id` yang tidak ada)
- ✅ **Fix:** Search episode logic di `getAnimeInWebEpisode` — sekarang bisa cari episode nomor besar (ep.500+) dengan `maxSearchPages = 50`
- ✅ **Fix:** `/download/episode` tanpa params sekarang return 400 (bukan 500)
- ✅ **Fix:** Limit `maxPages = 10` di `getAnimeInWebData` agar tidak timeout pada anime panjang
- 🗑️ **Hapus:** Semua endpoint download (`/download/episode`, `/download/batch`, `/download/batch-info`)
- 📝 **Tambah:** File dokumentasi `new.md`
- 📝 **Tambah:** Script testing `test-all-endpoints.js`
