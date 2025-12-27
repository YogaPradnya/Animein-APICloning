# 📚 Panduan Penggunaan API AnimeinWeb

## Base URL
```
http://localhost:3000/api/v1
```

## ⚡ API Internal yang Digunakan

API ini menggunakan **API internal dari animeinweb.com** untuk mendapatkan data yang lebih lengkap dan akurat:

- **Detail Anime**: `/api/proxy/3/2/movie/detail/{id}`
- **Episode List**: `/api/proxy/3/2/movie/episode/{id}?page=0`
- **Episode Video**: `/api/proxy/3/2/episode/streamnew/{episodeId}`
- **Comment**: `/api/proxy/3/2/comment/data?id_episode={id}&sort=top&page=0`

Semua data sudah **otomatis difilter** untuk menghilangkan iklan dan link iklan.

---

## Endpoints

### 1. Search Anime (Cari dengan Judul) ⭐
Cari anime berdasarkan judul/nama anime

**Request:**
```
GET /api/v1/search?q={judulAnime}
```

**Contoh:**
```bash
curl 'http://localhost:3000/api/v1/search?q=naruto'
curl 'http://localhost:3000/api/v1/search?q=one%20piece'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "animeId": "341",
      "title": "naruto: shippuuden",
      "alternativeTitle": "naruto: shippuden",
      "synopsis": "...",
      "type": "series",
      "status": "finished",
      "year": "2025",
      "views": "4612873",
      "favorites": "10420",
      "genres": ["action", "adventure"],
      "poster": "https://...",
      "cover": "https://...",
      "link": "https://animeinweb.com/anime/341"
    }
  ],
  "total": 18,
  "query": "naruto"
}
```

---

### 2. Get Info Anime
Ambil informasi anime (title, status, genre, dll)

**Request:**
```
GET /api/v1/animeinweb?id={animeId}
```

**Contoh:**
```bash
curl 'http://localhost:3000/api/v1/animeinweb?id=341'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "naruto: shippuuden",
    "status": "finished",
    "type": "series",
    "synopsis": "...",
    "genres": [],
    "episodes": [],
    "note": "Video ada di halaman episode individual. Gunakan link episode untuk mendapatkan video."
  }
}
```

---

### 2. Get Info Anime Lengkap (Rating, Genre, Author, Studio, Sinopsis, Cover, Poster) ⭐ SEMUA EPISODE!
Ambil semua informasi anime lengkap. **Semua episode akan diambil** (termasuk anime dengan ratusan episode seperti Naruto 500 episode).

**Request:**
```
GET /api/v1/animeinweb?id={animeId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "naruto: shippuuden",
    "alternativeTitle": "...",
    "synopsis": "...",
    "status": "finished",
    "type": "series",
    "airedStart": "2007-02-15",
    "airedEnd": "2017-03-23",
    "studios": ["studio pierrot"],
    "genres": ["action", "adventure", "comedy"],
    "author": "masashi kishimoto",
    "rating": "8.5",
    "cover": "https://animeinweb.com/images/cover.jpg",
    "poster": "https://animeinweb.com/images/poster.jpg",
    "thumbnail": "https://animeinweb.com/images/thumb.jpg",
    "episodes": [
      {
        "number": "500",
        "episodeId": "4988",
        "title": "episode 500",
        "views": "47637",
        "releaseDate": "2 Aug 2019",
        "thumbnail": "https://...",
        "isNew": false,
        "link": "https://animeinweb.com/anime/341?ep=500"
      },
      // ... semua episode dari 500 sampai 1
      {
        "number": "1",
        "episodeId": "123",
        "title": "episode 1",
        "views": "1000000",
        "releaseDate": "15 Feb 2007",
        "thumbnail": "https://...",
        "isNew": false,
        "link": "https://animeinweb.com/anime/341?ep=1"
      }
    ],
    "note": "Video ada di halaman episode individual..."
  }
}
```

**Note:** 
- ✅ **Semua episode akan diambil** dari semua halaman (tidak hanya 30 episode pertama)
- ✅ Untuk anime dengan banyak episode (500+), semua episode akan muncul
- ✅ Episode diurutkan dari terbaru ke terlama (500, 499, ..., 1)

---

### 3. Get Episode Video ⭐ (TANPA IKLAN, Semua Resolusi RAPSODI)
Ambil video dan resolusi per episode - **Semua resolusi dari server RAPSODI**

**Request:**
```
GET /api/v1/animeinweb/episode?animeId={animeId}&episodeNumber={episodeNumber}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| animeId | string | ✅ | ID anime dari animeinweb.com |
| episodeNumber | string | ✅ | Nomor episode |

**Contoh:**
```bash
# Episode 500 Naruto Shippuuden
curl 'http://localhost:3000/api/v1/animeinweb/episode?animeId=341&episodeNumber=500'

# Episode 1 Naruto Shippuuden
curl 'http://localhost:3000/api/v1/animeinweb/episode?animeId=341&episodeNumber=1'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Episode 500",
    "episodeNumber": "500",
    "episodeId": "4988",
    "animeTitle": "Naruto: Shippuuden",
    "animeId": "341",
    "videoSources": [
      {
        "url": "https://storages.animein.net/naruto%3a%20shippuuden%2f500-360p-xxx.mp4",
        "resolution": "360p",
        "type": "direct",
        "quality": "360p",
        "server": "RAPSODI",
        "fileSize": "36.9617"
      },
      {
        "url": "https://storages.animein.net/naruto%3a%20shippuuden%2f500-480p-xxx.mp4",
        "resolution": "480p",
        "type": "direct",
        "quality": "480p",
        "server": "RAPSODI",
        "fileSize": "71.6171"
      }
    ],
    "resolutions": ["480p", "360p"],
    "thumbnail": "https://animeinweb.com/assets/images/movie/episode/xxx.jpg",
    "views": "47637",
    "releaseDate": "2 Aug 2019",
    "nextEpisode": null
  }
}
```

---

### 4. Get Schedule (Jadwal Anime Per Hari) ⭐ OPTIMASI!
Ambil jadwal rilis anime per hari. **Title sudah dibersihkan** dari views, favorites, dan waktu rilis.

**Request:**
```
GET /api/v1/animeinweb/schedule?day={day}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| day | string | ❌ | Hari: senin, selasa, rabu, kamis, jumat, sabtu, minggu, random. Jika tidak diisi, ambil hari aktif |

**Contoh:**
```bash
# Jadwal hari ini (default)
curl 'http://localhost:3000/api/v1/animeinweb/schedule'

# Jadwal Senin
curl 'http://localhost:3000/api/v1/animeinweb/schedule?day=senin'

# Jadwal Sabtu
curl 'http://localhost:3000/api/v1/animeinweb/schedule?day=sabtu'

# Jadwal Random
curl 'http://localhost:3000/api/v1/animeinweb/schedule?day=random'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentDay": "SAB",
    "schedule": [
      {
        "animeId": "5966",
        "title": "watari-kun no xx ga houkai sunzen",
        "genre": "comedy",
        "views": "98.515",
        "favorite": "6.273",
        "releaseTime": "new !!",
        "link": "https://animeinweb.com/anime/5966",
        "thumbnail": "https://xyz-api.animein.net/assets/images/movie/poster/xxx.jpg",
        "cover": "https://xyz-api.animein.net/assets/images/movie/cover/xxx.jpg",
        "poster": "https://xyz-api.animein.net/assets/images/movie/poster/xxx.jpg",
        "isNew": true,
        "status": "ongoing"
      },
      {
        "animeId": "426",
        "title": "one piece",
        "genre": "action",
        "views": "11.864.785",
        "favorite": "26.180",
        "releaseTime": "1h 7j",
        "link": "https://animeinweb.com/anime/426",
        "thumbnail": "https://xyz-api.animein.net/assets/images/movie/poster/xxx.jpg",
        "cover": "https://xyz-api.animein.net/assets/images/movie/cover/xxx.jpg",
        "poster": "https://xyz-api.animein.net/assets/images/movie/poster/xxx.jpg",
        "isNew": false,
        "status": "ongoing"
      }
    ]
  }
}
```

**Note:** 
- Title sudah **dibersihkan** dari views, favorites, dan waktu rilis
- Genre dipisah dari title jika ada
- `isNew: true` jika episode baru rilis (releaseTime mengandung "new !!")
- `status` bisa: "ongoing", "finished", "on hold"
- ✅ **Cover, poster, dan thumbnail** sudah termasuk di response

---

### 5. Get Trending (Anime Sedang Hangat)
Ambil anime yang sedang trending/popular

**Request:**
```
GET /api/v1/animeinweb/trending
```

**Contoh:**
```bash
curl 'http://localhost:3000/api/v1/animeinweb/trending'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "animeId": "341",
      "title": "naruto: shippuuden",
      "thumbnail": "https://animeinweb.com/images/thumb.jpg",
      "link": "https://animeinweb.com/anime/341"
    }
  ],
  "total": 20
}
```

---

### 6. Get New (Anime Baru Ditambahkan)
Ambil anime yang baru ditambahkan

**Request:**
```
GET /api/v1/animeinweb/new
```

**Contoh:**
```bash
curl 'http://localhost:3000/api/v1/animeinweb/new'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "animeId": "999",
      "title": "anime baru",
      "thumbnail": "https://animeinweb.com/images/new.jpg",
      "link": "https://animeinweb.com/anime/999"
    }
  ],
  "total": 15
}
```

---

### 7. Get Today (Anime Hari Ini)
Ambil anime yang rilis hari ini

**Request:**
```
GET /api/v1/animeinweb/today
```

**Contoh:**
```bash
curl 'http://localhost:3000/api/v1/animeinweb/today'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "day": "senin",
    "date": "2024-12-27",
    "anime": [
      {
        "animeId": "123",
        "title": "one piece",
        "genre": "action",
        "views": "11.864.504",
        "favorite": "26.179",
        "releaseTime": "1h 7j 53m",
        "link": "https://animeinweb.com/anime/123",
        "isNew": false,
        "status": "ongoing"
      }
    ]
  }
}
```

---

## Contoh Penggunaan

### JavaScript / Frontend

```javascript
const BASE_URL = 'http://localhost:3000/api/v1';

// 0. Search Anime dengan Judul
async function searchAnime(keyword) {
  const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(keyword)}`);
  const data = await response.json();
  
  if (data.success) {
    console.log(`Found ${data.total} results for "${data.query}"`);
    data.data.forEach(anime => {
      console.log(`${anime.title} (ID: ${anime.animeId}) - ${anime.views} views`);
    });
  }
  
  return data;
}

// Contoh penggunaan
searchAnime('naruto');      // Cari "naruto"
searchAnime('one piece');   // Cari "one piece"
searchAnime('demon slayer'); // Cari "demon slayer"

// 1. Get Info Anime Lengkap
async function getAnimeInfo(animeId) {
  const response = await fetch(`${BASE_URL}/animeinweb?id=${animeId}`);
  const data = await response.json();
  
  if (data.success) {
    const anime = data.data;
    console.log('Title:', anime.title);
    console.log('Rating:', anime.rating);
    console.log('Author:', anime.author);
    console.log('Studios:', anime.studios);
    console.log('Genres:', anime.genres);
    console.log('Cover:', anime.cover);
    console.log('Poster:', anime.poster);
    console.log('Synopsis:', anime.synopsis);
    console.log('Episodes:', anime.episodes.length);
  }
  
  return data;
}

// 2. Get Episode Video dengan Semua Resolusi RAPSODI
async function getEpisodeVideo(animeId, episodeNumber) {
  const response = await fetch(
    `${BASE_URL}/animeinweb/episode?animeId=${animeId}&episodeNumber=${episodeNumber}`
  );
  const data = await response.json();
  
  if (data.success) {
    console.log('Title:', data.data.title);
    console.log('Resolutions:', data.data.resolutions);
    
    // Video sudah di-sort: RAPSODI dulu, kemudian resolusi tertinggi
    const bestVideo = data.data.videoSources[0];
    console.log('Best Quality Video:', bestVideo.url);
    console.log('Server:', bestVideo.server);
    
    // Play video - PENTING: decode URL dulu!
    const videoElement = document.getElementById('player');
    videoElement.src = decodeURIComponent(bestVideo.url);
    videoElement.play();
  }
  
  return data;
}

// 3. Get Schedule (Jadwal Anime Per Hari)
async function getSchedule(day = null) {
  const url = day 
    ? `${BASE_URL}/animeinweb/schedule?day=${day}`
    : `${BASE_URL}/animeinweb/schedule`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.success) {
    console.log('Current Day:', data.data.currentDay);
    console.log('Total Anime:', data.data.schedule.length);
    
    data.data.schedule.forEach(anime => {
      console.log(`${anime.title} - ${anime.genre} - ${anime.releaseTime}`);
    });
  }
  
  return data;
}

// 4. Get Trending (Anime Sedang Hangat)
async function getTrending() {
  const response = await fetch(`${BASE_URL}/animeinweb/trending`);
  const data = await response.json();
  
  if (data.success) {
    console.log('Trending Anime:', data.total);
    data.data.forEach(anime => {
      console.log(`${anime.title} (ID: ${anime.animeId})`);
    });
  }
  
  return data;
}

// 5. Get New (Anime Baru Ditambahkan)
async function getNewAnime() {
  const response = await fetch(`${BASE_URL}/animeinweb/new`);
  const data = await response.json();
  
  if (data.success) {
    console.log('New Anime:', data.total);
    data.data.forEach(anime => {
      console.log(`${anime.title} (ID: ${anime.animeId})`);
    });
  }
  
  return data;
}

// 6. Get Today (Anime Hari Ini)
async function getTodayAnime() {
  const response = await fetch(`${BASE_URL}/animeinweb/today`);
  const data = await response.json();
  
  if (data.success) {
    console.log(`Anime Hari Ini (${data.data.day}):`, data.data.anime.length);
    data.data.anime.forEach(anime => {
      console.log(`${anime.title} - ${anime.releaseTime}`);
    });
  }
  
  return data;
}

// Contoh Penggunaan
getAnimeInfo(341);                    // Naruto Shippuuden info lengkap
getEpisodeVideo(341, 500);            // Episode 500 dengan semua resolusi RAPSODI
getSchedule('senin');                 // Jadwal Senin
getSchedule();                        // Jadwal hari ini (default)
getTrending();                        // Anime trending
getNewAnime();                        // Anime baru
getTodayAnime();                      // Anime hari ini
```

### React Component

```jsx
import { useState, useEffect } from 'react';

function AnimePlayer({ animeId, episodeNumber }) {
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState(null);

  useEffect(() => {
    async function fetchEpisode() {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3000/api/v1/animeinweb/episode?animeId=${animeId}&episodeNumber=${episodeNumber}`
      );
      const data = await res.json();
      
      if (data.success) {
        setEpisode(data.data);
        // Set default ke kualitas tertinggi
        if (data.data.videoSources.length > 0) {
          setSelectedQuality(data.data.videoSources[0]);
        }
      }
      setLoading(false);
    }
    
    fetchEpisode();
  }, [animeId, episodeNumber]);

  if (loading) return <div>Loading...</div>;
  if (!episode) return <div>Episode tidak ditemukan</div>;

  return (
    <div>
      <h1>{episode.animeTitle} - {episode.title}</h1>
      
      {/* Quality Selector */}
      <div>
        <label>Pilih Kualitas:</label>
        <select onChange={(e) => {
          const video = episode.videoSources.find(v => v.resolution === e.target.value);
          setSelectedQuality(video);
        }}>
          {episode.videoSources.map(video => (
            <option key={video.resolution} value={video.resolution}>
              {video.resolution} ({video.server})
            </option>
          ))}
        </select>
      </div>
      
      {/* Video Player */}
      {selectedQuality && (
        <video 
          controls 
          width="100%"
          src={decodeURIComponent(selectedQuality.url)}
        >
          Browser tidak support video tag.
        </video>
      )}
      
      <p>Views: {episode.views}</p>
      <p>Release: {episode.releaseDate}</p>
    </div>
  );
}

// Penggunaan
<AnimePlayer animeId="341" episodeNumber="500" />
```

### Python

```python
import requests
from urllib.parse import unquote, quote

BASE_URL = 'http://localhost:3000/api/v1'

def search_anime(keyword):
    """Cari anime berdasarkan judul"""
    url = f'{BASE_URL}/search?q={quote(keyword)}'
    response = requests.get(url)
    data = response.json()
    
    if data['success']:
        print(f"Found {data['total']} results for '{data['query']}'")
        for anime in data['data'][:10]:  # Show first 10
            print(f"  - {anime['title']} (ID: {anime['animeId']}) - {anime['views']} views")
    
    return data

def get_anime_info(anime_id):
    """Ambil informasi anime lengkap"""
    url = f'{BASE_URL}/animeinweb?id={anime_id}'
    response = requests.get(url)
    data = response.json()
    
    if data['success']:
        anime = data['data']
        print(f"Title: {anime['title']}")
        print(f"Rating: {anime.get('rating', 'N/A')}")
        print(f"Author: {anime.get('author', 'N/A')}")
        print(f"Studios: {anime.get('studios', [])}")
        print(f"Genres: {anime.get('genres', [])}")
        print(f"Status: {anime.get('status', 'N/A')}")
        print(f"Cover: {anime.get('cover', 'N/A')}")
        print(f"Poster: {anime.get('poster', 'N/A')}")
        print(f"Episodes: {len(anime.get('episodes', []))}")
        print()
    
    return data

def get_episode(anime_id, episode_number):
    """Ambil video episode dengan semua resolusi RAPSODI"""
    url = f'{BASE_URL}/animeinweb/episode?animeId={anime_id}&episodeNumber={episode_number}'
    response = requests.get(url)
    data = response.json()
    
    if data['success']:
        episode = data['data']
        print(f"Title: {episode['title']}")
        print(f"Anime: {episode['animeTitle']}")
        print(f"Resolutions: {episode['resolutions']}")
        print(f"Views: {episode['views']}")
        print()
        
        # Video sudah di-sort: RAPSODI dulu, kemudian resolusi tertinggi
        for video in episode['videoSources']:
            decoded_url = unquote(video['url'])
            print(f"[{video['resolution']}] Server: {video['server']} {'(RAPSODI)' if video.get('isRapsodi') else ''}")
            print(f"    URL: {decoded_url}")
            print(f"    Size: {video.get('fileSize', 'N/A')} MB")
            print()
    
    return data

def get_schedule(day=None):
    """Ambil jadwal anime per hari"""
    url = f'{BASE_URL}/animeinweb/schedule'
    if day:
        url += f'?day={day}'
    
    response = requests.get(url)
    data = response.json()
    
    if data['success']:
        schedule = data['data']
        print(f"Current Day: {schedule['currentDay']}")
        print(f"Total Anime: {len(schedule['schedule'])}")
        print()
        
        for anime in schedule['schedule'][:10]:  # Show first 10
            print(f"{anime['title']} - {anime.get('genre', 'N/A')} - {anime.get('releaseTime', 'N/A')}")
    
    return data

def get_trending():
    """Ambil anime trending/popular"""
    url = f'{BASE_URL}/animeinweb/trending'
    response = requests.get(url)
    data = response.json()
    
    if data['success']:
        print(f"Trending Anime: {data['total']}")
        for anime in data['data'][:10]:  # Show first 10
            print(f"  - {anime['title']} (ID: {anime['animeId']})")
    
    return data

def get_new():
    """Ambil anime baru ditambahkan"""
    url = f'{BASE_URL}/animeinweb/new'
    response = requests.get(url)
    data = response.json()
    
    if data['success']:
        print(f"New Anime: {data['total']}")
        for anime in data['data'][:10]:  # Show first 10
            print(f"  - {anime['title']} (ID: {anime['animeId']})")
    
    return data

def get_today():
    """Ambil anime hari ini"""
    url = f'{BASE_URL}/animeinweb/today'
    response = requests.get(url)
    data = response.json()
    
    if data['success']:
        today = data['data']
        print(f"Anime Hari Ini ({today['day']} - {today['date']}): {len(today['anime'])}")
        for anime in today['anime'][:10]:  # Show first 10
            print(f"  - {anime['title']} - {anime.get('releaseTime', 'N/A')}")
    
    return data

# Contoh penggunaan
if __name__ == '__main__':
    print("=== 0. Search Anime ===")
    search_anime('naruto')
    print()
    
    print("=== 1. Get Anime Info Lengkap ===")
    get_anime_info(341)
    
    print("\n=== 2. Get Episode Video (Semua Resolusi RAPSODI) ===")
    get_episode(341, 500)
    
    print("\n=== 3. Get Schedule Senin ===")
    get_schedule('senin')
    
    print("\n=== 4. Get Trending ===")
    get_trending()
    
    print("\n=== 5. Get New Anime ===")
    get_new()
    
    print("\n=== 6. Get Today ===")
    get_today()
```

### cURL

```bash
# 0. Search anime dengan judul
curl -s 'http://localhost:3000/api/v1/search?q=naruto' | jq

# Search dengan spasi (gunakan %20 atau quote)
curl -s 'http://localhost:3000/api/v1/search?q=one%20piece' | jq
curl -s "http://localhost:3000/api/v1/search?q=one piece" | jq

# Get hanya title dan ID
curl -s 'http://localhost:3000/api/v1/search?q=naruto' | jq '.data[] | {animeId, title, views}'

# 1. Get anime info lengkap
curl -s 'http://localhost:3000/api/v1/animeinweb?id=341' | jq

# Get hanya field tertentu
curl -s 'http://localhost:3000/api/v1/animeinweb?id=341' | jq '.data | {title, rating, author, studios, genres, cover, poster}'

# 2. Get episode video dengan semua resolusi RAPSODI
curl -s 'http://localhost:3000/api/v1/animeinweb/episode?animeId=341&episodeNumber=500' | jq

# Get hanya URL video (RAPSODI dulu)
curl -s 'http://localhost:3000/api/v1/animeinweb/episode?animeId=341&episodeNumber=500' | jq '.data.videoSources[].url'

# Get hanya resolusi yang tersedia
curl -s 'http://localhost:3000/api/v1/animeinweb/episode?animeId=341&episodeNumber=500' | jq '.data.resolutions'

# Get video RAPSODI saja
curl -s 'http://localhost:3000/api/v1/animeinweb/episode?animeId=341&episodeNumber=500' | jq '.data.videoSources[] | select(.server == "RAPSODI")'

# 3. Get schedule (jadwal anime)
curl -s 'http://localhost:3000/api/v1/animeinweb/schedule' | jq

# Get schedule hari tertentu
curl -s 'http://localhost:3000/api/v1/animeinweb/schedule?day=senin' | jq '.data.schedule[] | {title, genre, releaseTime}'

# 4. Get trending anime
curl -s 'http://localhost:3000/api/v1/animeinweb/trending' | jq

# Get hanya title dan ID
curl -s 'http://localhost:3000/api/v1/animeinweb/trending' | jq '.data[] | {animeId, title}'

# 5. Get new anime
curl -s 'http://localhost:3000/api/v1/animeinweb/new' | jq

# 6. Get anime hari ini
curl -s 'http://localhost:3000/api/v1/animeinweb/today' | jq

# Get hanya list anime hari ini
curl -s 'http://localhost:3000/api/v1/animeinweb/today' | jq '.data.anime[] | {title, releaseTime, status}'
```

---

## Cara Mencari Anime ID

1. Buka https://animeinweb.com
2. Cari anime yang diinginkan
3. Klik anime tersebut
4. Lihat URL di browser, contoh: `https://animeinweb.com/anime/341`
5. Angka di akhir URL adalah **Anime ID** (341)

### Anime ID Populer

| Anime | ID |
|-------|-----|
| Naruto Shippuuden | 341 |

---

## Penting! ⚠️

### 1. URL Video Perlu Di-decode
URL video dari API masih dalam format encoded. Sebelum digunakan untuk play video, **decode dulu**:

```javascript
// URL dari API (encoded)
const encodedUrl = "https://storages.animein.net/naruto%3a%20shippuuden%2f500-360p.mp4";

// Decode URL
const decodedUrl = decodeURIComponent(encodedUrl);
// Result: "https://storages.animein.net/naruto: shippuuden/500-360p.mp4"
```

### 2. Video Sudah Tanpa Iklan ✅
Semua URL video dari folder `/ADS/` sudah **otomatis difilter dan dihapus**.

### 3. Response Time (OPTIMASI!)
- Endpoint `/api/v1/animeinweb/episode` sekarang **~2-5 detik** (dioptimasi dengan API langsung, tanpa Playwright)
- Endpoint `/api/v1/animeinweb/schedule`, `/trending`, `/new`, `/today` sekarang **~2-5 detik** (menggunakan API internal)
- Endpoint `/api/v1/animeinweb?id=...` membutuhkan waktu **~3-5 detik** untuk mengambil semua data lengkap
- Endpoint `/api/v1/download/episode` membutuhkan waktu **~2-5 detik**
- Endpoint `/api/v1/download/batch` membutuhkan waktu **~30 detik - 5 menit** tergantung jumlah episode (max 50 episode per request)

### 4. CORS
Server sudah mengaktifkan CORS, jadi bisa diakses dari frontend di port berbeda.

---

### 8. Download Episode (Download Per Episode) ⭐ NEW!
Download link untuk episode tertentu dengan resolusi yang diinginkan.

**Request:**
```
GET /api/v1/download/episode?animeId={animeId}&episodeNumber={episodeNumber}&resolution={resolution}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| animeId | string | ✅ | ID anime dari animeinweb.com |
| episodeNumber | string | ✅ | Nomor episode |
| resolution | string | ❌ | Resolusi yang diinginkan (1080p, 720p, 480p, 360p). Jika tidak diisi, akan menggunakan resolusi tertinggi (RAPSODI) |

**Contoh:**
```bash
# Download episode 1 dengan resolusi tertinggi (default)
curl 'http://localhost:3000/api/v1/download/episode?animeId=5966&episodeNumber=1'

# Download episode 1 dengan resolusi 1080p
curl 'http://localhost:3000/api/v1/download/episode?animeId=5966&episodeNumber=1&resolution=1080p'

# Download episode 500 dengan resolusi 720p
curl 'http://localhost:3000/api/v1/download/episode?animeId=341&episodeNumber=500&resolution=720p'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "animeId": "5966",
    "animeTitle": "Watari-kun no xx ga Houkai Sunzen",
    "episodeNumber": "1",
    "episodeTitle": "Episode 1",
    "downloadUrl": "https://storages.animein.net/Watari-kun no xx ga Houkai Sunzen/1-1080p-1751647843064.mp4",
    "resolution": "1080p",
    "quality": "1080p",
    "server": "RAPSODI",
    "fileSize": "125.5",
    "type": "video/mp4",
    "note": "Gunakan downloadUrl untuk download video. URL sudah di-decode dan siap digunakan."
  }
}
```

**Penggunaan di Browser/JavaScript:**
```javascript
// Download langsung di browser
const response = await fetch('http://localhost:3000/api/v1/download/episode?animeId=5966&episodeNumber=1&resolution=1080p');
const data = await response.json();

if (data.success) {
  // Buat link download
  const link = document.createElement('a');
  link.href = data.data.downloadUrl;
  link.download = `${data.data.animeTitle} - Episode ${data.data.episodeNumber}.mp4`;
  link.click();
}
```

---

### 9. Batch Download (Download Semua Episode) ⭐ NEW!
Download link untuk semua episode sekaligus dalam satu request.

**Request:**
```
GET /api/v1/download/batch?animeId={animeId}&resolution={resolution}&startEpisode={start}&endEpisode={end}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| animeId | string | ✅ | ID anime dari animeinweb.com |
| resolution | string | ❌ | Resolusi yang diinginkan (1080p, 720p, 480p, 360p). Jika tidak diisi, akan menggunakan resolusi tertinggi |
| startEpisode | number | ❌ | Episode mulai (default: 1) |
| endEpisode | number | ❌ | Episode akhir (default: semua episode) |

**Note:** Endpoint ini akan memproses maksimal **50 episode** per request untuk menghindari timeout. Gunakan `startEpisode` dan `endEpisode` untuk batch lainnya.

**Contoh:**
```bash
# Download semua episode dengan resolusi tertinggi (max 50 episode pertama)
curl 'http://localhost:3000/api/v1/download/batch?animeId=341'

# Download episode 1-50 dengan resolusi 1080p
curl 'http://localhost:3000/api/v1/download/batch?animeId=341&resolution=1080p&startEpisode=1&endEpisode=50'

# Download episode 51-100 dengan resolusi 720p
curl 'http://localhost:3000/api/v1/download/batch?animeId=341&resolution=720p&startEpisode=51&endEpisode=100'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "animeId": "341",
    "animeTitle": "naruto: shippuuden",
    "totalEpisodes": 500,
    "processedEpisodes": 50,
    "failedEpisodes": 0,
    "downloadLinks": [
      {
        "episodeNumber": "1",
        "episodeTitle": "Episode 1",
        "downloadUrl": "https://storages.animein.net/naruto: shippuuden/1-1080p-xxx.mp4",
        "resolution": "1080p",
        "quality": "1080p",
        "server": "RAPSODI",
        "fileSize": "125.5",
        "type": "video/mp4"
      },
      {
        "episodeNumber": "2",
        "episodeTitle": "Episode 2",
        "downloadUrl": "https://storages.animein.net/naruto: shippuuden/2-1080p-xxx.mp4",
        "resolution": "1080p",
        "quality": "1080p",
        "server": "RAPSODI",
        "fileSize": "120.3",
        "type": "video/mp4"
      }
      // ... lebih banyak episode
    ],
    "note": "Hanya memproses 50 episode pertama. Gunakan parameter startEpisode dan endEpisode untuk batch lainnya."
  }
}
```

**Penggunaan di JavaScript untuk Download Semua:**
```javascript
async function downloadAllEpisodes(animeId, resolution = '1080p') {
  // Get anime info untuk mengetahui total episode
  const animeInfo = await fetch(`http://localhost:3000/api/v1/animeinweb?id=${animeId}`).then(r => r.json());
  const totalEpisodes = animeInfo.data.episodes.length;
  
  // Download dalam batch (50 episode per batch)
  const batchSize = 50;
  for (let start = 1; start <= totalEpisodes; start += batchSize) {
    const end = Math.min(start + batchSize - 1, totalEpisodes);
    console.log(`Downloading episodes ${start}-${end}...`);
    
    const response = await fetch(
      `http://localhost:3000/api/v1/download/batch?animeId=${animeId}&resolution=${resolution}&startEpisode=${start}&endEpisode=${end}`
    );
    const data = await response.json();
    
    if (data.success) {
      // Download setiap episode
      data.data.downloadLinks.forEach(episode => {
        const link = document.createElement('a');
        link.href = episode.downloadUrl;
        link.download = `${data.data.animeTitle} - Episode ${episode.episodeNumber}.mp4`;
        link.click();
        
        // Delay kecil untuk menghindari browser block
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
    }
  }
}

// Contoh penggunaan
downloadAllEpisodes('341', '1080p');
```

---

## Error Handling

### Parameter tidak lengkap
```json
{
  "success": false,
  "error": "Parameter animeId dan episodeNumber diperlukan. Contoh: /api/v1/animeinweb/episode?animeId=341&episodeNumber=500"
}
```

### Episode tidak ditemukan
```json
{
  "success": false,
  "error": "Episode ID tidak ditemukan untuk anime 341 episode 999"
}
```

### Server error
```json
{
  "success": false,
  "error": "Failed to fetch episode data from API"
}
```

---

## Menjalankan Server

```bash
# Install dependencies
npm install

# Jalankan server
npm run dev

# Server akan berjalan di http://localhost:3000
```

---

## Struktur Response

### Struktur Response Video Episode

| Field | Type | Description |
|-------|------|-------------|
| url | string | URL video (perlu di-decode) |
| resolution | string | Resolusi video (360p, 480p, 720p, 1080p) |
| type | string | Tipe server (direct, semi) |
| quality | string | Kualitas video |
| server | string | Nama server (RAPSODI, NANIMEX, dll) |
| fileSize | string | Ukuran file dalam MB (jika tersedia) |
| isRapsodi | boolean | true jika server RAPSODI (prioritas pertama) |

**Note:** Video sources sudah di-sort: RAPSODI server dulu, kemudian resolusi tertinggi.

### Struktur Response Anime Info

| Field | Type | Description |
|-------|------|-------------|
| title | string | Judul anime |
| alternativeTitle | string | Judul alternatif |
| synopsis | string | Sinopsis anime |
| status | string | Status (finished, ongoing) |
| type | string | Tipe (series, movie, ova) |
| airedStart | string | Tanggal mulai tayang |
| airedEnd | string | Tanggal selesai tayang |
| studios | array | Daftar studio |
| genres | array | Daftar genre |
| author | string | Author/creator |
| rating | string | Rating anime |
| cover | string | URL cover image |
| poster | string | URL poster image |
| thumbnail | string | URL thumbnail |
| episodes | array | Daftar episode |

### Struktur Response Schedule

| Field | Type | Description |
|-------|------|-------------|
| currentDay | string | Hari yang aktif (SEN, SEL, RAB, dll) |
| schedule | array | Daftar anime di hari tersebut |

**Schedule Item:**
| Field | Type | Description |
|-------|------|-------------|
| animeId | string | ID anime |
| title | string | Judul anime |
| genre | string | Genre anime |
| views | string | Jumlah views |
| favorite | string | Jumlah favorite |
| releaseTime | string | Waktu rilis (contoh: "1h 7j 53m") |
| link | string | Link ke halaman anime |
| thumbnail | string | URL thumbnail image |
| cover | string | URL cover image |
| poster | string | URL poster image |
| isNew | boolean | true jika baru rilis |
| status | string | Status (ongoing, finished, on hold) |

---

## Support

Jika ada masalah atau pertanyaan, silakan buka issue di repository.

