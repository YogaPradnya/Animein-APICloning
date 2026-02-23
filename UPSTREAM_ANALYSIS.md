# 📂 Dokumentasi Analisis Upstream API AnimeInWeb

Dokumen ini berisi daftar lengkap _endpoint_ API internal yang digunakan oleh website `https://animeinweb.com/`. Data ini diperoleh melalui analisis lalu lintas jaringan (_Network Traffic_) untuk memahami bagaimana Frontend mereka mengambil data secara dinamis.

---

## 🏗️ Struktur Dasar

- **Base URL**: `https://animeinweb.com`
- **API Prefix**: `/api/proxy/3/2/`
- **Format Data**: `JSON`

---

## 1. Homepage & Global Data

Endpoint untuk konten halaman utama dan fitur sosial global.

### **Home Sections**

Mengambil data untuk section "Baru Saja Update", "Sedang Hangat", dll.

- **URL**: `/api/proxy/3/2/home/data`
- **Method**: `GET`
- **Parameter**:
  - `day` (Opsional): Contoh `SABTU` (untuk filter jadwal di home).
  - `limit` (Opsional): Jumlah data yang dikembalikan.

## 2. Schedule (Jadwal Rilis)

Sistem jadwal rilis harian berdasarkan hari yang dipilih pada tab.

- **Daily Schedule Data**
  - **URL**: `/api/proxy/3/2/schedule/data`
  - **Method**: `GET`
  - **Parameter**:
    - `day` (Wajib): `SENIN`, `SELASA`, `RABU`, `KAMIS`, `JUMAT`, `SABTU`, `MINGGU`, atau `RANDOM`.
  - **Catatan Penting**: Parameter nilai hari harus menggunakan **HURUF KAPITAL (UPPERCASE)**. Jika menggunakan lowercase, API akan mengembalikan array kosong.

---

## 3. Explore & Search (Pencarian & Filter)

Digunakan untuk halaman daftar anime, pencarian judul, dan filtering kategori.

### **Genre List**

Mengambil daftar genre beserta ID-nya untuk digunakan sebagai filter.

- **URL**: `/api/proxy/3/2/explore/genre`
- **Method**: `GET`

### **Advanced Search & Explore**

- **URL**: `/api/proxy/3/2/explore/movie`
- **Method**: `GET`
- **Parameter**:
  - `page`: Nomor halaman (mulai dari 0).
  - `sort`: `views` (Populer), `latest` (Terbaru), `alphabet` (A-Z), `score` (Rating), `favorites` (Favorit).
  - `keyword`: Kata kunci pencarian judul.
  - `genre_in`: ID Genre tunggal atau kombinasi.
  - `status`: `ongoing` atau `finished`.
  - `type`: `SERIES`, `MOVIE`, atau `ONA`.

---

## 4. Anime Detail

Informasi mendalam mengenai metadata judul anime tertentu.

### **Movie Detail**

- **URL**: `/api/proxy/3/2/movie/detail/{anime_id}`
- **Method**: `GET`

### **Episode List**

- **URL**: `/api/proxy/3/2/movie/episode/{anime_id}`
- **Method**: `GET`
- **Parameter**:
  - `page`: Pagination untuk daftar episode (berguna untuk anime panjang > 100 ep).

---

## 5. Streaming & Player Interaction

Endpoint untuk memuat konten video dan interaksi user (komentar) di halaman menonton.

### **Streaming Sources**

- **URL**: `/api/proxy/3/2/episode/streamnew/{episode_id}`
- **Method**: `GET`
- **Response**: Mengembalikan daftar server video (Google Drive, MP4 Direct, Embed Player) beserta resolusi yang tersedia.

### **Comment System**

- **URL**: `/api/proxy/3/2/comment/data`
- **Method**: `GET`
- **Parameter**:
  - `id_episode`: ID spesifik episode yang sedang dibuka.
  - `sort`: `top` (Terpopuler) atau `newest` (Terbaru).
  - `page`: Nomor halaman pagination komentar.

---

## 🛠️ Catatan Teknis & Keamanan (Kritikal)

1.  **Header Referer**: Upstream API AnimeInWeb sangat bergantung pada pengecekan header `Referer`. Untuk menghindari `403 Forbidden`, pastikan setiap request menyertakan header `Referer: https://animeinweb.com/`.
2.  **User-Agent**: Gunakan User-Agent yang meniru browser asli (Chrome/Firefox Desktop) agar tidak terblokir oleh mekanisme bot-detection sederhana.
3.  **Ketergantungan ID**: `anime_id` digunakan untuk detail anime, sementara `episode_id` (yang didapat dari list episode) digunakan untuk mendapatkan stream video. Keduanya tidak bisa ditukar.
4.  **Pagination Limit**: Halaman pencarian/explore biasanya memiliki batas `60` item per halaman.

---

## 5. Sinkronisasi Langsung Upstream (Hotfix Pencarian & Video)

Frontend telah dikonfigurasi untuk melakukan **fallback** langsung ke upstream API `animeinweb.com` jika data dari Vercel API kosong atau tidak valid. Backend Vercel juga telah dioptimalkan untuk mengikuti pola ini guna meminimalisir kegagalan:

- **Search**: Menggunakan endpoint asli `/api/proxy/3/2/explore/movie` dengan header `Referer` yang disamarkan sebagai `https://animeinweb.com/`. Hal ini memastikan hasil pencarian selalu sinkron dengan website official.
- **Video**: Mengambil sumber video dari API streaming asli `/api/proxy/3/2/episode/streamnew/{episode_id}`. Kelebihannya adalah mendeteksi semua server yang tersedia (Rapsodi, Direct, dll) untuk menghindari error "No supported format" pada pemutar video.
- **Header Spoofing**: Semua request ke upstream kini menyertakan set header browser lengkap (Sec-Ch-Ua, User-Agent yang diputar, dan session cookies) untuk melewati proteksi Cloudflare.

---

_Dianalisis secara otomatis oleh Antigravity pada 2026-02-22._
