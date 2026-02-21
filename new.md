# 🎌 AnimeAPI — Panduan Endpoint Terbaru

> **Base URL (Local):** `http://localhost:3000/api/v1`
> **Base URL (Production):** `https://anime-api-three-jade.vercel.app/api/v1`
> **Versi:** 1.3.0 — _Cloudflare Bypass (Undici HTTP/2, Rotating UA, Image Proxy proxy)_
> **Sumber data:** [animeinweb.com](https://animeinweb.com)
> **Last updated:** 2026-02-22

---

## 📊 Status Testing

| Metrik               | Nilai                         |
| -------------------- | ----------------------------- |
| ✅ Total Endpoint    | 41                            |
| ✅ Pass Rate         | **100%**                      |
| ⏱️ Avg Response Time | ~2ms (cached)                 |
| 🗄️ Cache Active      | Ya (NodeCache TTL bervariasi) |

---

## 📋 Daftar Endpoint Aktif

| No  | Endpoint                      | Method | Cache TTL | Deskripsi                               |
| --- | ----------------------------- | ------ | --------- | --------------------------------------- |
| 1   | `/api/v1/latest`              | GET    | 10 menit  | Episode anime terbaru                   |
| 2   | `/api/v1/search`              | GET    | 5 menit   | Cari anime (keyword, genre, sort, page) |
| 3   | `/api/v1/genres`              | GET    | 24 jam    | List semua genre                        |
| 4   | `/api/v1/detail`              | GET    | 30 menit  | Detail anime by slug atau URL           |
| 5   | `/api/v1/list`                | GET    | 30 menit  | List semua anime dengan pagination      |
| 6   | `/api/v1/animeinweb`          | GET    | 30 menit  | Info anime dari AnimeInWeb by ID        |
| 7   | `/api/v1/animeinweb/episode`  | GET    | 1 jam     | Video streaming per episode             |
| 8   | `/api/v1/animeinweb/schedule` | GET    | 1 jam     | Jadwal anime per hari                   |
| 9   | `/api/v1/animeinweb/trending` | GET    | 1 jam     | Anime sedang trending                   |
| 10  | `/api/v1/animeinweb/new`      | GET    | 1 jam     | Anime baru ditambahkan                  |
| 11  | `/api/v1/animeinweb/today`    | GET    | 1 jam     | Anime update hari ini                   |
| 12  | `/api/v1/image`               | GET    | 1 tahun   | Proxy Bypass Cloudflare untuk Gambar    |

> 💡 Semua endpoint support **trailing slash** (`/latest` = `/latest/`) dan punya **alias** yang lebih pendek. Semua link gambar di dalam response (cover, thumbnail, poster) secara **otomatis dibungkus oleh endpoint `/api/v1/image`**, sehingga Frontend tidak perlu setup proxy sendiri.

---

## 🔗 Alias Endpoint

| Endpoint Lengkap              | Alias Pendek       |
| ----------------------------- | ------------------ |
| `/api/v1/animeinweb/schedule` | `/api/v1/schedule` |
| `/api/v1/animeinweb/trending` | `/api/v1/trending` |
| `/api/v1/animeinweb/new`      | `/api/v1/new`      |
| `/api/v1/animeinweb/today`    | `/api/v1/today`    |

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
      "link": "https://animeinweb.com/...",
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
| `page`    | number | ❌    | `0`     | Nomor halaman (mulai dari 0)            |

```bash
# Search keyword
curl "http://localhost:3001/api/v1/search?q=naruto"

# Filter genre Action (id=14), sort by views (terpopuler)
curl "http://localhost:3001/api/v1/search?genre=14&sort=views"

# Kombinasi keyword + genre + sort
curl "http://localhost:3001/api/v1/search?q=hero&genre=14&sort=favorites&page=0"

# Semua anime sort terbaru
curl "http://localhost:3001/api/v1/search?sort=newest"

# Halaman berikutnya
curl "http://localhost:3001/api/v1/search?q=sword&page=1"
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
  "filters": { "keyword": "naruto", "genre": null, "sort": "views" }
}
```

---

## 3. 🏷️ List Genre

```
GET /api/v1/genres
```

Tidak ada parameter. **Cache: 24 jam** (jarang berubah).

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

| ID  | Genre      | ID  | Genre         |
| --- | ---------- | --- | ------------- |
| 14  | Action     | 20  | Romance       |
| 1   | Adventure  | 21  | School        |
| 2   | Comedy     | 26  | Shounen       |
| 6   | Fantasy    | 28  | Slice of Life |
| 17  | Mystery    | 31  | Supernatural  |
| 9   | Drama      | 32  | Sports        |
| 12  | Historical | 33  | Thriller      |

---

## 4. 📖 Detail Anime

```
GET /api/v1/detail?slug={slug}
GET /api/v1/detail?url={url-animeinweb}
```

| Parameter | Type   | Wajib          | Keterangan                                         |
| --------- | ------ | -------------- | -------------------------------------------------- |
| `slug`    | string | ✅ (atau url)  | Slug anime (misal: `one-piece`) atau ID AnimeInWeb |
| `url`     | string | ✅ (atau slug) | URL lengkap animeinweb.com                         |

```bash
# Dengan slug nama anime
curl "http://localhost:3001/api/v1/detail?slug=one-piece"

# Langsung dengan ID AnimeInWeb
curl "http://localhost:3001/api/v1/detail?slug=426"

# Dengan URL lengkap
curl "http://localhost:3001/api/v1/detail?url=https://animeinweb.com/anime/426"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "title": "one piece",
    "alternativeTitle": "One Piece",
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

| Parameter | Type   | Wajib | Default | Keterangan                   |
| --------- | ------ | ----- | ------- | ---------------------------- |
| `page`    | number | ❌    | `1`     | Nomor halaman (mulai dari 1) |

```bash
curl "http://localhost:3001/api/v1/list?page=1"
curl "http://localhost:3001/api/v1/list?page=2"
```

**Response:**

```json
{
  "success": true,
  "data": [
    { "title": "nama anime", "link": "https://animeinweb.com/anime/426" }
  ],
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
    "alternativeTitle": "One Piece",
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

> ℹ️ Endpoint ini scrape langsung halaman anime. Max 300 episode per request (limit untuk menghindari timeout).

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
# One Piece episode 500
curl "http://localhost:3001/api/v1/animeinweb/episode?animeId=426&episodeNumber=500"

# Naruto episode 1
curl "http://localhost:3001/api/v1/animeinweb/episode?animeId=341&episodeNumber=1"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "animeId": "426",
    "episodeNumber": "500",
    "title": "episode 500",
    "videoSources": [
      {
        "url": "https://cdn.example.com/video.mp4",
        "resolution": "1080p",
        "quality": "1080p",
        "type": "video/mp4",
        "server": "rapsodi"
      }
    ],
    "resolutions": ["1080p", "720p", "480p", "360p"],
    "thumbnail": "https://..."
  }
}
```

> ℹ️ Biasanya tersedia 4 video source dengan kualitas berbeda. Episode besar (400+) tetap bisa dicari karena `maxSearchPages = 50`.

---

## 8. 📅 Jadwal Anime

```
GET /api/v1/animeinweb/schedule?day={hari}
GET /api/v1/schedule?day={hari}          ← alias
```

| Parameter | Nilai Valid                                                              |
| --------- | ------------------------------------------------------------------------ |
| `day`     | `senin`, `selasa`, `rabu`, `kamis`, `jumat`, `sabtu`, `minggu`, `random` |

> `day` tidak diisi = semua jadwal hari ini.

```bash
curl "http://localhost:3001/api/v1/schedule?day=senin"   # 7 anime
curl "http://localhost:3001/api/v1/schedule?day=rabu"    # 11 anime
curl "http://localhost:3001/api/v1/schedule?day=minggu"  # 26 anime
curl "http://localhost:3001/api/v1/schedule?day=random"  # hari random
curl "http://localhost:3001/api/v1/schedule"             # hari ini
```

**Jumlah anime per hari (berdasarkan test terakhir):**

| Hari   | Jumlah Anime |
| ------ | ------------ |
| Senin  | 7            |
| Selasa | 8            |
| Rabu   | 11           |
| Kamis  | 6            |
| Jumat  | 8            |
| Sabtu  | 11           |
| Minggu | 26           |

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
  "data": [
    { "id": "426", "title": "one piece", "views": "11888316", "rank": 1 }
  ],
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
  "data": [
    {
      "id": "6101",
      "title": "anime baru",
      "isNew": true,
      "thumbnail": "https://..."
    }
  ],
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
    "anime": [
      {
        "title": "nama anime",
        "episode": "episode 5",
        "thumbnail": "https://..."
      }
    ]
  }
}
```

---

## 12. 🖼️ Image Proxy (Cloudflare Bypass)

```
GET /api/v1/image?url={url_asli}
```

Endpoint ini digunakan untuk membypass proteksi hotlinking Cloudflare milik sumber gambar (403 Forbidden). **Secara otomatis semua endpoint di atas akan mereturn atribut `cover`, `poster`, dan `thumbnail` dalam format link ini**.

```bash
curl "http://localhost:3000/api/v1/image?url=https%3A%2F%2Fapi.animein.net%2Fassets%2Fimages%2Fmovie%2Fposter%2F3b58031b55ceb0a20b1cb56c20933153.jpg"
```

**Response:** File Binary `image/jpeg` atau tipe gambar lainnya. Bisa langsung dipasang di `src` tag `<img>` pada Frontend!

---

## ⚠️ Error Codes

| HTTP Code | Kondisi                                                 | Contoh Response                                                       |
| --------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `200`     | Sukses                                                  | `{ "success": true, "data": [...] }`                                  |
| `400`     | Parameter wajib tidak ada                               | `{ "success": false, "error": "Parameter slug diperlukan" }`          |
| `500`     | Scraping error (website down, dll)                      | `{ "success": false, "error": "..." }`                                |
| `504`     | Timeout (>30 detik / >20 detik untuk beberapa endpoint) | `{ "success": false, "error": "Request timeout setelah 30000ms..." }` |

---

## 🖥️ Halaman Web

| URL          | Deskripsi                                      |
| ------------ | ---------------------------------------------- |
| `/dashboard` | Monitoring real-time request & performa server |
| `/docs`      | Dokumentasi API interaktif                     |

---

## ❌ Endpoint yang Dihapus

| Endpoint                          | Alasan                                |
| --------------------------------- | ------------------------------------- |
| `GET /api/v1/download/episode`    | Dihapus sesuai permintaan             |
| `GET /api/v1/download/batch`      | Dihapus sesuai permintaan             |
| `GET /api/v1/download/batch-info` | Dihapus sesuai permintaan             |
| `GET /api/v1/episode`             | Sumber NontonAnimeID — SSL cert rusak |

---

## 🔧 Changelog

### v1.3.0 — 2026-02-22

- 🔐 **Core:** Implementasi `undici` HTTP/2 client + Rotating User Agents + In-Memory Cookie Jar untuk **100% bypass Cloudflare CF-Mitigated**.
- 🛠️ **Server:** Tambahan Middleware Proxy Image di `server.js` untuk membypass proteksi hotlink gambar (403 Forbidden).
- 🧹 **Clean up:** Penghapusan file logs dan script test lama yang tidak terpakai.

### v1.2.0 — 2026-02-21

- ✅ **Testing:** Semua 41 endpoint lulus 100% (0 failed)
- ✅ **Pass Rate:** 100% dengan avg response 2ms (cached)
- 📝 **Docs:** Update `new.md` dengan tabel jumlah anime per hari jadwal, error codes, referensi genre lengkap
- 🗑️ **Hapus:** Endpoint `/api/v1/episode` (NontonAnimeID / `nontonanimeid.boats`) — SSL cert bermasalah
- ✅ **Semua sumber video** sekarang 100% dari **animeinweb.com** via `/api/v1/animeinweb/episode`

### v1.1.0

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
