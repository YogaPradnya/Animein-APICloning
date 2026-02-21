/**
 * Contoh Penggunaan AnimeAPI (Vercel Version)
 * File: example_usage.js
 * 
 * Panduan cara memanggil endpoint API yang sudah disederhanakan.
 */

const BASE_URL = 'https://anime-api-three-jade.vercel.app/api/v1';

// 1. Mengambil Jadwal Rilis (Schedule)
async function getScheduleExample(day = 'senin') {
    try {
        console.log(`\n--- Mengambil Jadwal Hari: ${day} ---`);
        const response = await fetch(`${BASE_URL}/schedule?day=${day}`);
        const result = await response.json();
        
        if (result.success) {
            console.log(`Berhasil mendapatkan ${result.data.schedule.length} anime.`);
            // Contoh menampilkan 3 judul pertama
            result.data.schedule.slice(0, 3).forEach(anime => {
                console.log(`- ${anime.title} (Jam: ${anime.releaseTime || 'TBA'})`);
            });
        }
    } catch (error) {
        console.error('Error Schedule:', error.message);
    }
}

// 2. Mengambil Anime Trending (Paling Populer)
async function getTrendingExample() {
    try {
        console.log(`\n--- Mengambil Anime Trending ---`);
        const response = await fetch(`${BASE_URL}/trending`);
        const result = await response.json();
        
        if (result.success) {
            console.log(`Trending hari ini (${result.total} anime):`);
            result.data.slice(0, 5).forEach((anime, i) => {
                console.log(`${i+1}. ${anime.title} (${anime.views} views)`);
            });
        }
    } catch (error) {
        console.error('Error Trending:', error.message);
    }
}

// 3. Pencarian Anime (Search)
async function searchAnimeExample(query = 'one piece') {
    try {
        console.log(`\n--- Mencari: "${query}" ---`);
        const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        if (result.success) {
            console.log(`Ditemukan ${result.total} hasil.`);
            result.data.slice(0, 3).forEach(anime => {
                console.log(`- ${anime.title} [ID: ${anime.animeId}]`);
            });
        }
    } catch (error) {
        console.error('Error Search:', error.message);
    }
}

// 4. Mengambil Detail & Link Streaming
async function getDetailExample(animeId = '341') {
    try {
        console.log(`\n--- Mengambil Detail Anime ID: ${animeId} ---`);
        const response = await fetch(`${BASE_URL}/detail?slug=${animeId}`);
        const result = await response.json();
        
        if (result.success) {
            console.log(`Judul: ${result.data.title}`);
            console.log(`Total Episode: ${result.data.episodes.length}`);
            console.log(`Status: ${result.data.status}`);
        }
    } catch (error) {
        console.error('Error Detail:', error.message);
    }
}

// Jalankan Demo (Node.js environment)
async function runDemo() {
    console.log('🚀 Memulai Demo Penggunaan AnimeAPI...');
    
    await getScheduleExample('senin');
    await getTrendingExample();
    await searchAnimeExample('naruto');
    await getDetailExample('341'); // Contoh ID One Piece atau lainnya
    
    console.log('\n✅ Demo Selesai.');
}

// Catatan: Jika ingin menggunakan di browser, hapus baris di bawah ini 
// dan panggil fungsinya secara manual.
if (typeof window === 'undefined') {
    runDemo();
}
