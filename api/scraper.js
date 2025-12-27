const axios = require('axios');
const cheerio = require('cheerio');
const { chromium } = require('playwright');
const helpers = require('./scraper_helpers');

const BASE_URL = 'https://s7.nontonanimeid.boats';
const ANIMEINWEB_URL = 'https://animeinweb.com';

// Fungsi untuk scrape dengan Playwright (hanya fallback jika benar-benar butuh)
async function scrapeWithPlaywright(url) {
  // DI VERCEL: Gunakan axios sebagai pengganti karena playwright terlalu berat
  if (process.env.VERCEL) {
    console.log('Vercel detected, using Axios instead of Playwright for:', url);
    return scrapeWithAxios(url);
  }

  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const content = await page.content();
    await browser.close();
    return cheerio.load(content);
  } catch (error) {
    console.log('Playwright failed, falling back to Axios:', error.message);
    return scrapeWithAxios(url);
  }
}

// Fungsi untuk scrape dengan axios (lebih cepat untuk static content)
async function scrapeWithAxios(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return cheerio.load(response.data);
  } catch (error) {
    throw error;
  }
}

// Ambil episode terbaru - Ambil SEMUA data yang ada
async function getLatestEpisodes() {
  try {
    const $ = await scrapeWithPlaywright(`${BASE_URL}/`);
    const episodes = [];
    const seenLinks = new Set(); // Untuk avoid duplicate

    // Cari semua card episode terbaru dengan berbagai selector yang mungkin
    // JANGAN break, ambil SEMUA data dari semua selector
    const selectors = [
      '.episode-item',
      '.latest-episode',
      '.episode-card',
      '.episode',
      '[class*="episode"]',
      '[class*="latest"]',
      '.item',
      '.card',
      'article',
      '.post',
      '.entry',
      'li',
      'div[class*="ep"]',
      '[data-episode]'
    ];

    // Coba setiap selector - JANGAN break, ambil semua
    for (const selector of selectors) {
      $(selector).each((i, elem) => {
        try {
          const $elem = $(elem);
          
          // Cari link dulu (penting untuk deduplication)
          let link = $elem.find('a').first().attr('href') || 
                     $elem.closest('a').attr('href') ||
                     $elem.attr('href');
          
          if (link) {
            link = helpers.normalizeUrl(link, BASE_URL);
            // Skip jika sudah ada
            if (seenLinks.has(link)) return;
            seenLinks.add(link);
          }
          
          // Cari title dengan berbagai cara
          let title = $elem.find('h1, h2, h3, h4, h5, .title, [class*="title"], a').first().text().trim();
          
          // Jika title kosong, coba ambil dari text content
          if (!title || title.length < 3) {
            const allText = $elem.text().trim();
            const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            title = lines.find(l => l.length > 3 && !l.match(/^(home|about|contact|login|register|menu|search)$/i)) || 
                   lines[0] || 
                   allText.substring(0, 100).trim();
          }
          
          // Skip jika title tidak valid
          if (!title || title.length < 2 || title.match(/^(home|about|contact|login|register|menu|search|next|previous)$/i)) {
            return;
          }
          
          // Extract episode number dengan helper (return number, bukan string)
          const episodeNum = helpers.extractEpisodeNumber(title, link);
          const episode = episodeNum ? `episode ${episodeNum}` : 'episode unknown';
          
          // Extract anime slug dari link
          const animeSlug = helpers.extractAnimeSlug(link);
          
          // Extract anime title (clean title)
          const animeTitle = helpers.extractAnimeTitle(title, link);
          
          // Generate link episode sesuai format website jika belum ada atau perlu diperbaiki
          let episodeLink = link;
          if (animeSlug && episodeNum && (!link || link.includes('/anime/'))) {
            // Generate link episode: /watari-kun-no-xx-ga-houkai-sunzen-episode-26/
            episodeLink = helpers.generateEpisodeLink(animeSlug, episodeNum, BASE_URL);
          }
          
          // Generate link anime detail jika belum ada
          let animeLink = null;
          if (animeSlug && !link.includes('/anime/')) {
            animeLink = `${BASE_URL}/anime/${animeSlug}/`;
          } else if (link && link.includes('/anime/')) {
            animeLink = link;
          }
          
          // Extract thumbnail dengan helper
          const thumbnail = helpers.extractThumbnail($elem, BASE_URL);
          
          // Extract resolution dengan helper
          const resolution = helpers.extractResolution($elem);
          
          // Extract date dengan helper
          const date = helpers.extractDate($elem);
          
          // Buat episode object
          const episodeData = {
            title: animeTitle.toLowerCase() || title.toLowerCase(),
            episode: episode.toLowerCase(),
            thumbnail: thumbnail,
            link: episodeLink, // Link ke halaman episode
            animeLink: animeLink, // Link ke halaman detail anime
            resolution: resolution,
            releaseDate: date,
            slug: animeSlug || null
          };
          
          // Hanya tambahkan jika ada title atau link
          if (episodeData.title || episodeData.link) {
            episodes.push(episodeData);
          }
        } catch (err) {
          // Skip jika error pada element ini
          // console.error('Error processing element:', err);
        }
      });
    }

    // Fallback: cari semua link yang mengandung "episode" atau link ke anime
    $('a[href*="episode"], a[href*="/anime/"]').each((i, elem) => {
      try {
        const $link = $(elem);
        const href = $link.attr('href');
        const text = $link.text().trim() || $link.find('img').attr('alt') || '';
        
        if (href && (href.includes('episode') || href.includes('/anime/'))) {
          const normalizedLink = helpers.normalizeUrl(href, BASE_URL);
          
          if (!seenLinks.has(normalizedLink)) {
            seenLinks.add(normalizedLink);
            
            const episodeNum = helpers.extractEpisodeNumber(text, href);
            const episode = episodeNum ? `episode ${episodeNum}` : 'episode unknown';
            const animeSlug = helpers.extractAnimeSlug(href);
            const animeTitle = helpers.extractAnimeTitle(text, href);
            const thumbnail = helpers.extractThumbnail($link, BASE_URL);
            
            // Generate link episode jika perlu
            let episodeLink = normalizedLink;
            if (animeSlug && episodeNum && (!normalizedLink || normalizedLink.includes('/anime/'))) {
              episodeLink = helpers.generateEpisodeLink(animeSlug, episodeNum, BASE_URL);
            }
            
            // Generate link anime detail
            let animeLink = null;
            if (animeSlug) {
              animeLink = normalizedLink.includes('/anime/') ? normalizedLink : `${BASE_URL}/anime/${animeSlug}/`;
            }
            
            if (animeTitle || text) {
              episodes.push({
                title: animeTitle.toLowerCase() || text.toLowerCase(),
                episode: episode.toLowerCase(),
                thumbnail: thumbnail,
                link: episodeLink, // Link ke halaman episode
                animeLink: animeLink, // Link ke halaman detail anime
                resolution: helpers.extractResolution($link),
                releaseDate: helpers.extractDate($link),
                slug: animeSlug || null
              });
            }
          }
        }
      } catch (err) {
        // Skip error
      }
    });

    // Remove duplicates berdasarkan link atau title+episode
    const uniqueEpisodes = [];
    const seen = new Set();
    
    for (const ep of episodes) {
      const key = ep.link || `${ep.title}-${ep.episode}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEpisodes.push(ep);
      }
    }

    console.log(`Found ${uniqueEpisodes.length} unique episodes`);
    
    return uniqueEpisodes;
  } catch (error) {
    console.error('Error fetching latest episodes:', error);
    throw new Error(`Gagal mengambil episode terbaru: ${error.message}`);
  }
}

// Ambil detail anime berdasarkan URL atau slug
async function getAnimeDetail(urlOrSlug) {
  try {
    const url = urlOrSlug.startsWith('http') ? urlOrSlug : `${BASE_URL}/${urlOrSlug}`;
    const $ = await scrapeWithPlaywright(url);

    const anime = {
      title: '',
      originalTitle: '',
      synopsis: '',
      rating: null,
      releaseDate: '',
      schedule: '',
      studio: '',
      genres: [],
      episodes: [],
      resolution: [],
      thumbnail: '',
      status: ''
    };

    // Extract judul
    anime.title = $('h1, .anime-title, [class*="title"]').first().text().trim().toLowerCase();
    anime.originalTitle = $('.original-title, [class*="original"]').text().trim().toLowerCase() || anime.title;

    // Extract sinopsis
    anime.synopsis = $('.synopsis, .description, [class*="synopsis"], [class*="description"]').text().trim().toLowerCase();

    // Extract rating
    const ratingText = $('.rating, [class*="rating"]').text().trim();
    anime.rating = parseFloat(ratingText) || null;

    // Extract tanggal rilis
    anime.releaseDate = $('.release-date, [data-release], [class*="release"]').text().trim().toLowerCase();

    // Extract jadwal rilis
    anime.schedule = $('.schedule, [class*="schedule"]').text().trim().toLowerCase();

    // Extract studio
    anime.studio = $('.studio, [class*="studio"]').text().trim().toLowerCase();

    // Extract genre
    $('.genre, .genres, [class*="genre"] a, [class*="tag"]').each((i, elem) => {
      const genre = $(elem).text().trim().toLowerCase();
      if (genre && !anime.genres.includes(genre)) {
        anime.genres.push(genre);
      }
    });

    // Extract thumbnail
    anime.thumbnail = $('.anime-thumbnail img, .poster img, [class*="thumbnail"] img').first().attr('src') || 
                      $('.anime-thumbnail img, .poster img, [class*="thumbnail"] img').first().attr('data-src') || '';
    if (anime.thumbnail && !anime.thumbnail.startsWith('http')) {
      anime.thumbnail = BASE_URL + anime.thumbnail;
    }

    // Extract status
    anime.status = $('.status, [class*="status"]').text().trim().toLowerCase();

    // Extract episode list
    $('.episode-list .episode, [class*="episode-item"]').each((i, elem) => {
      const $ep = $(elem);
      const epNumber = $ep.find('.ep-number, [class*="number"]').text().trim().toLowerCase();
      const epTitle = $ep.find('.ep-title, [class*="title"]').text().trim().toLowerCase();
      const epLink = $ep.find('a').attr('href');
      const epResolution = $ep.find('.resolution, [class*="resolution"]').text().trim().toLowerCase();
      const epDate = $ep.find('.date, [class*="date"]').text().trim().toLowerCase();

      if (epNumber || epTitle) {
        anime.episodes.push({
          number: epNumber,
          title: epTitle,
          link: epLink ? (epLink.startsWith('http') ? epLink : BASE_URL + epLink) : null,
          resolution: epResolution || null,
          releaseDate: epDate || null
        });
      }
    });

    // Extract resolusi yang tersedia
    $('.resolution-option, [class*="resolution"]').each((i, elem) => {
      const res = $(elem).text().trim().toLowerCase();
      if (res && !anime.resolution.includes(res)) {
        anime.resolution.push(res);
      }
    });

    return anime;
  } catch (error) {
    console.error('Error fetching anime detail:', error);
    throw error;
  }
}

// Cari anime berdasarkan keyword/judul (menggunakan API internal animeinweb.com)
async function searchAnime(keyword) {
  try {
    if (!keyword || keyword.trim().length === 0) {
      throw new Error('Keyword pencarian tidak boleh kosong');
    }
    
    console.log(`Searching anime dengan keyword: ${keyword}`);
    
    // Gunakan API internal animeinweb.com untuk search
    const searchApiUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/explore/movie?page=0&sort=views&keyword=${encodeURIComponent(keyword)}`;
    console.log(`Fetching from API: ${searchApiUrl}`);
    
    const response = await axios.get(searchApiUrl);
    const apiData = response.data;
    
    if (!apiData || apiData.error || !apiData.data || !apiData.data.movie) {
      console.log('No results from API, trying fallback...');
      // Coba fallback dengan scraping jika API tidak ada hasil
      throw new Error('Tidak ada hasil dari API, coba lagi atau gunakan keyword yang berbeda');
    }
    
    const movies = apiData.data.movie;
    const results = [];
    
    movies.forEach(movie => {
      // Parse genres
      const genres = movie.genre ? movie.genre.split(',').map(g => g.trim().toLowerCase()) : [];
      
      results.push({
        animeId: movie.id,
        title: (movie.title || '').toLowerCase(),
        alternativeTitle: (movie.synonyms || '').toLowerCase(),
        synopsis: (movie.synopsis || '').toLowerCase(),
        type: (movie.type || '').toLowerCase(),
        status: (movie.status || '').toLowerCase(),
        year: movie.year || '',
        day: movie.day || '',
        views: movie.views || '0',
        favorites: movie.favorites || '0',
        genres: genres,
        poster: movie.image_poster || '',
        cover: movie.image_cover || '',
        thumbnail: movie.image_poster || movie.image_cover || '',
        link: `${ANIMEINWEB_URL}/anime/${movie.id}`,
        airedStart: movie.aired_start || ''
      });
    });
    
    console.log(`✅ Found ${results.length} results for "${keyword}"`);
    return results;
  } catch (error) {
    console.error('Error searching anime:', error);
    throw new Error(`Gagal mencari anime: ${error.message}`);
  }
}

// Ambil semua series/anime list
async function getAnimeList(page = 1) {
  try {
    const url = page > 1 ? `${BASE_URL}/page/${page}` : BASE_URL;
    const $ = await scrapeWithPlaywright(url);
    const animeList = [];

    // Coba berbagai selector
    const selectors = [
      '.anime-item',
      '.series-item',
      '.anime-card',
      '[class*="anime"]',
      '.item',
      '.card',
      'article',
      '.post'
    ];

    for (const selector of selectors) {
      $(selector).each((i, elem) => {
        const $elem = $(elem);
        
        const title = $elem.find('h1, h2, h3, h4, .title, [class*="title"], a').first().text().trim().toLowerCase();
        const thumbnail = $elem.find('img').first().attr('src') || 
                         $elem.find('img').first().attr('data-src') ||
                         $elem.find('img').first().attr('data-lazy-src');
        const link = $elem.find('a').first().attr('href') || $elem.closest('a').attr('href');
        const rating = $elem.find('.rating, [class*="rating"], .score').text().trim();
        const status = $elem.find('.status, [class*="status"]').text().trim().toLowerCase();

        if (title && title.length > 2) {
          animeList.push({
            title: title,
            thumbnail: thumbnail ? (thumbnail.startsWith('http') ? thumbnail : BASE_URL + thumbnail) : null,
            link: link ? (link.startsWith('http') ? link : BASE_URL + link) : null,
            rating: parseFloat(rating) || null,
            status: status || null
          });
        }
      });

      if (animeList.length > 0) break;
    }

    if (animeList.length === 0) {
      throw new Error('Tidak ada anime ditemukan di halaman ini');
    }
    return animeList;
  } catch (error) {
    console.error('Error fetching anime list:', error);
    throw error;
  }
}

// Ambil data video per episode dengan resolusi dan semua server
async function getEpisodeVideo(episodeUrl) {
  try {
    const url = episodeUrl.startsWith('http') ? episodeUrl : `${BASE_URL}/${episodeUrl}`;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Gunakan domcontentloaded untuk lebih cepat, lalu wait manual
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait untuk video player dan iframe load
    await page.waitForTimeout(3000);
    
    // Wait untuk iframe muncul (optional, tidak block)
    try {
      await page.waitForSelector('iframe', { timeout: 5000 }).catch(() => {});
    } catch (e) {}
    
    // Scroll untuk trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(2000);
    
    // Scroll lagi ke atas untuk trigger semua lazy load
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);
    
    // Get content setelah semua load
    const content = await page.content();
    
    // Extract data dari page context (untuk data yang di-render JavaScript)
    const pageData = await page.evaluate(() => {
      const data = {
        title: '',
        alternativeTitle: '',
        synopsis: '',
        status: '',
        type: '',
        airedStart: '',
        airedEnd: '',
        studios: [],
        genres: [],
        currentEpisode: null,
        videoSrc: '',
        episodes: []
      };
      
      // Extract title
      const h1 = document.querySelector('h1');
      if (h1) data.title = h1.textContent.trim();
      
      // Extract semua text untuk parsing
      const allText = document.body.textContent || '';
      
      // Extract status (FINISHED, ONGOING, dll)
      const statusMatch = allText.match(/\b(FINISHED|ONGOING|COMPLETE|AIRING)\b/i);
      if (statusMatch) data.status = statusMatch[1].toLowerCase();
      
      // Extract type (SERIES, MOVIE, dll)
      const typeMatch = allText.match(/\b(SERIES|MOVIE|OVA|SPECIAL)\b/i);
      if (typeMatch) data.type = typeMatch[1].toLowerCase();
      
      // Helper untuk cek apakah URL iklan - filter sangat ketat
      const isAdUrl = (url) => {
        if (!url) return true;
        const lowerUrl = url.toLowerCase();
        
        // Skip semua yang ada di folder /ads/ (paling penting!)
        if (lowerUrl.match(/\/ads\//)) return true;
        
        // Skip yang mengandung kata-kata produk/iklan
        const adKeywords = [
          'advertisement', 'baju', 'fragrance', 'parfum', 'kaos', 'deformed',
          'figur', 'pokemon', 'pokeball', 'kamb', 'setelan', 'joging',
          'olahraga', 'pria', 'celana', 'badminton', 'oversize', 'heavyweight',
          'cyfersia', 'chopper', 'tempest', 'islan', 'vanilla', 'breeze',
          'extrait', '5star', 'msw100', 'tebal', 'oscc104', 'figuremiku',
          'miku', 'figure', 'setelan', 'joging', 'olahraga', 'badminton'
        ];
        
        for (const keyword of adKeywords) {
          if (lowerUrl.includes(keyword)) return true;
        }
        
        // Skip URL yang mengandung banyak kata dengan spasi (biasanya nama produk)
        const wordCount = (lowerUrl.match(/[a-z]+\s+[a-z]+\s+[a-z]+/g) || []).length;
        if (wordCount > 0 && lowerUrl.includes('storages.animein.net')) {
          // Jika ada 3+ kata dan dari storages.animein.net, kemungkinan besar iklan
          return true;
        }
        
        return false;
      };
      
      // Extract video src - cari yang bukan iklan
      const video = document.querySelector('video');
      if (video) {
        // Cek source tags dulu (biasanya resolusi berbeda)
        const sources = video.querySelectorAll('source');
        sources.forEach(source => {
          const src = source.src || source.getAttribute('src');
          if (src && !isAdUrl(src) && !data.videoSrc) {
            data.videoSrc = src; // Ambil yang pertama yang bukan iklan
          }
        });
        
        // Fallback ke video src langsung
        if (!data.videoSrc) {
          const videoSrc = video.src || video.getAttribute('src') || '';
          if (videoSrc && !isAdUrl(videoSrc)) {
            data.videoSrc = videoSrc;
          }
        }
      }
      
      // Juga cari dari semua script yang mungkin contain video URL
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const content = script.textContent || script.innerHTML || '';
        // Cari semua video URL, tapi skip yang ada di /ads/
        const videoMatches = content.match(/https?:\/\/storages\.animein\.net\/[^"'\s]+/gi);
        if (videoMatches) {
          videoMatches.forEach(url => {
            // Pastikan benar-benar bukan iklan
            if (!url.toLowerCase().includes('/ads/') && 
                !isAdUrl(url) && 
                !data.videoSrc) {
              data.videoSrc = url;
            }
          });
        }
      });
      
      // Pastikan videoSrc yang ditemukan bukan iklan
      if (data.videoSrc && data.videoSrc.toLowerCase().includes('/ads/')) {
        data.videoSrc = '';
      }
      
      // Extract current episode
      const epText = allText.match(/episode\s*(\d+)/i);
      if (epText) {
        data.currentEpisode = {
          number: parseInt(epText[1]),
          title: epText[0]
        };
      }
      
      return data;
    });
    
    await browser.close();
    const $ = cheerio.load(content);
    

    const episodeData = {
      title: '',
      episodeNumber: '',
      animeTitle: '',
      releaseDate: '',
      status: '',
      videoServers: [],
      resolutions: [],
      thumbnail: '',
      description: '',
      breadcrumb: []
    };

    // Extract judul episode
    episodeData.title = $('h1, .episode-title, [class*="episode-title"]').first().text().trim().toLowerCase() ||
                       $('title').text().split('|')[0].trim().toLowerCase();
    
    // Extract nomor episode dari title atau URL
    const episodeMatch = episodeData.title.match(/episode\s*(\d+)/i) || 
                        url.match(/episode[-\s]*(\d+)/i);
    episodeData.episodeNumber = episodeMatch ? episodeMatch[1] : '';

    // Extract judul anime dari breadcrumb atau title
    const breadcrumb = $('.breadcrumb, [class*="breadcrumb"], nav').text().trim();
    episodeData.breadcrumb = breadcrumb.split('>').map(b => b.trim().toLowerCase()).filter(b => b);
    
    const animeTitleMatch = breadcrumb.match(/anime[>\s]+([^>]+)/i) ||
                          episodeData.title.match(/^(.+?)\s+episode/i);
    episodeData.animeTitle = animeTitleMatch ? animeTitleMatch[1].trim().toLowerCase() : 
                            $('.anime-title, [class*="anime-name"]').text().trim().toLowerCase() || 
                            episodeData.breadcrumb[episodeData.breadcrumb.length - 2] || '';

    // Extract release date
    const dateText = $('[class*="date"], time, [datetime]').first().text().trim() ||
                    $('[datetime]').attr('datetime') ||
                    $('time').attr('datetime');
    episodeData.releaseDate = dateText ? dateText.toLowerCase() : '';

    // Extract status (Tamat, Ongoing, dll)
    const statusText = $('[class*="status"], [class*="tamat"]').text().trim() ||
                      episodeData.title.match(/\[(tamat|ongoing|complete)\]/i)?.[1] || '';
    episodeData.status = statusText.toLowerCase();

    // Extract thumbnail
    episodeData.thumbnail = $('.episode-thumbnail img, .player-thumbnail img, [class*="thumbnail"] img, .poster img').first().attr('src') || 
                            $('.episode-thumbnail img, .player-thumbnail img, [class*="thumbnail"] img, .poster img').first().attr('data-src') || 
                            $('meta[property="og:image"]').attr('content') || '';
    if (episodeData.thumbnail && !episodeData.thumbnail.startsWith('http')) {
      episodeData.thumbnail = BASE_URL + episodeData.thumbnail;
    }

    // Extract description
    episodeData.description = $('.episode-description, [class*="description"], .synopsis').text().trim().toLowerCase() ||
                             $('meta[name="description"]').attr('content')?.toLowerCase() || '';

    // Extract semua server video yang tersedia
    const servers = [];
    const serverMap = new Map(); // Untuk track server yang sudah ditemukan
    
    // Cari button server dengan berbagai selector
    const serverSelectors = [
      'button[class*="server"]',
      'a[class*="server"]',
      '[class*="server-btn"]',
      '[data-server]',
      'button:contains("S-")',
      'a:contains("S-")',
      '[onclick*="server"]',
      '[onclick*="Server"]'
    ];
    
    for (const selector of serverSelectors) {
      $(selector).each((i, elem) => {
        try {
          const $btn = $(elem);
          let serverName = $btn.text().trim() || 
                          $btn.attr('data-server') || 
                          $btn.attr('title') || 
                          $btn.attr('aria-label') ||
                          $btn.find('span, div').first().text().trim();
          
          // Clean server name
          serverName = serverName.replace(/^S-/, '').trim();
          if (!serverName || serverName.length < 2) return;
          
          // Skip jika sudah ada
          const serverKey = serverName.toLowerCase();
          if (serverMap.has(serverKey)) return;
          
          const serverId = $btn.attr('data-server') || 
                          $btn.attr('id') || 
                          serverKey.replace(/[^a-z0-9]/g, '-');
          const isActive = $btn.hasClass('active') || 
                         $btn.hasClass('selected') || 
                         $btn.hasClass('current') ||
                         $btn.attr('aria-checked') === 'true' ||
                         $btn.css('background-color')?.includes('green');
          
          servers.push({
            name: serverName.toLowerCase(),
            id: serverId,
            active: isActive,
            element: $btn
          });
          
          serverMap.set(serverKey, true);
        } catch (err) {
          // Skip error
        }
      });
    }
    
    // Cari dari text yang mengandung "Server Video" atau button dengan text "S-"
    if (servers.length === 0) {
      $('*').each((i, elem) => {
        const $elem = $(elem);
        const text = $elem.text().trim();
        
        // Pattern: "S-Kotakvideo", "S-Streamku", dll
        const serverMatches = text.match(/S-([A-Za-z0-9-]+)/g);
        if (serverMatches) {
          serverMatches.forEach(match => {
            const serverName = match.replace('S-', '').trim().toLowerCase();
            if (serverName && !serverMap.has(serverName)) {
              servers.push({
                name: serverName,
                id: `server-${serverName}`,
                active: false,
                element: $elem
              });
              serverMap.set(serverName, true);
            }
          });
        }
      });
    }
    
    // Jika masih tidak ada, cari dari iframe atau embed
    if (servers.length === 0) {
      $('iframe[class*="player"], iframe[class*="embed"], iframe[src*="video"], iframe[src*="embed"]').each((i, elem) => {
        const $iframe = $(elem);
        const iframeSrc = $iframe.attr('src') || '';
        const iframeTitle = $iframe.attr('title') || '';
        
        if (iframeSrc) {
          // Extract server name dari title atau src
          let serverName = 'default';
          if (iframeSrc.includes('kotak')) serverName = 'kotakvideo';
          else if (iframeSrc.includes('streamku')) serverName = 'streamku';
          else if (iframeSrc.includes('cepat')) serverName = 'cepat';
          else if (iframeSrc.includes('nontonku')) serverName = 'nontonku';
          else if (iframeSrc.includes('nonton')) serverName = 'nonton';
          else if (iframeSrc.includes('lokal')) serverName = 'lokal-c';
          else if (iframeTitle) serverName = iframeTitle.toLowerCase().replace(/server\s*/i, '');
          
          if (!serverMap.has(serverName)) {
            servers.push({
              name: serverName,
              id: `server-${i + 1}`,
              active: i === 0,
              iframeSrc: iframeSrc,
              element: $iframe
            });
            serverMap.set(serverName, true);
          }
        }
      });
    }

    // Extract resolusi dan video sources untuk setiap server
    const allResolutions = new Set();
    const videoSources = []; // Akan diisi dari berbagai method
    
    // PRE-EXTRACT: Tambahkan iframe yang ditemukan dari page.evaluate (sebelum extract lainnya)
    if (iframeUrls && iframeUrls.length > 0) {
      iframeUrls.forEach(({ src, title }) => {
        if (src && (src.includes('video') || src.includes('embed') || src.includes('kotak') || src.includes('streamku') ||
            src.includes('cepat') || src.includes('nonton') || src.includes('lokal'))) {
          let serverName = 'default';
          if (title) {
            const titleMatch = title.match(/server\s+([a-z]+)/i);
            if (titleMatch) serverName = titleMatch[1].toLowerCase();
            else serverName = title.toLowerCase().replace(/server\s*/i, '').replace(/\s+/g, '-');
          }
          if (serverName === 'default' || serverName.length < 2) {
            if (src.includes('kotak')) serverName = 'kotakvideo';
            else if (src.includes('streamku')) serverName = 'streamku';
            else if (src.includes('cepat')) serverName = 'cepat';
            else if (src.includes('nontonku')) serverName = 'nontonku';
            else if (src.includes('nonton') && !src.includes('nontonku')) serverName = 'nonton';
            else if (src.includes('lokal')) serverName = 'lokal-c';
          }
          
          // Cek apakah sudah ada
          const exists = videoSources.some(vs => vs.url === src.toLowerCase());
          if (!exists) {
            videoSources.push({
              url: src.toLowerCase(),
              resolution: 'iframe',
              type: 'iframe',
              quality: 'iframe',
              server: serverName,
              iframe: true
            });
          }
        }
      });
      console.log(`Pre-extracted ${videoSources.length} video sources from page.evaluate`);
    } else {
      console.log('No iframes found from page.evaluate');
    }

    // Method 1: Cari dari quality/resolution buttons di player (720p, 360p, dll)
    const qualitySelectors = [
      'button[aria-label*="p"]',
      'button[aria-label*="P"]',
      'button[class*="quality"]',
      '[class*="resolution"]',
      '[data-quality]',
      '[data-resolution]',
      'button:contains("p")',
      '[id*="quality"]',
      '[id*="resolution"]'
    ];
    
    for (const selector of qualitySelectors) {
      $(selector).each((i, elem) => {
        const $btn = $(elem);
        const quality = $btn.attr('aria-label') || 
                       $btn.attr('aria-checked') ||
                       $btn.text().trim() || 
                       $btn.attr('data-quality') ||
                       $btn.attr('data-resolution') ||
                       $btn.attr('label');
        
        if (quality) {
          const resMatch = quality.match(/(\d+p)/i);
          if (resMatch) {
            allResolutions.add(resMatch[1].toLowerCase());
          }
        }
      });
    }
    
    // Cari dari text content yang mengandung resolusi
    const pageText = $('body').text();
    const resMatches = pageText.match(/(\d+p)/gi);
    if (resMatches) {
      resMatches.forEach(match => {
        if (match.match(/\d+p/i)) {
          allResolutions.add(match.toLowerCase());
        }
      });
    }

    // Method 2: Cari dari video tag sources
    $('video source').each((i, elem) => {
      const $source = $(elem);
      const src = $source.attr('src');
      const type = $source.attr('type') || 'video/mp4';
      const res = $source.attr('data-resolution') || 
                 $source.attr('data-quality') ||
                 $source.attr('label') ||
                 'auto';
      
      if (src) {
        const videoUrl = helpers.normalizeUrl(src, BASE_URL);
        videoSources.push({
          url: videoUrl.toLowerCase(),
          resolution: res.toLowerCase(),
          type: type.toLowerCase(),
          quality: res.toLowerCase(),
          server: 'default'
        });
        
        if (res.match(/\d+p/i)) {
          allResolutions.add(res.toLowerCase());
        }
      }
    });

    // Method 3: Cari dari iframe player (kotakanimeid, dll)
    $('iframe[src*="video"], iframe[src*="embed"], iframe[class*="player"]').each((i, elem) => {
      const $iframe = $(elem);
      const iframeSrc = $iframe.attr('src') || '';
      const iframeTitle = $iframe.attr('title') || '';
      
      if (iframeSrc) {
        // Extract server name
        let serverName = 'default';
        if (iframeSrc.includes('kotak')) serverName = 's-kotakvideo';
        else if (iframeSrc.includes('streamku')) serverName = 's-streamku';
        else if (iframeSrc.includes('cepat')) serverName = 's-cepat';
        else if (iframeSrc.includes('nontonku')) serverName = 's-nontonku';
        else if (iframeSrc.includes('nonton')) serverName = 's-nonton';
        else if (iframeSrc.includes('lokal')) serverName = 's-lokal-c';
        
        videoSources.push({
          url: iframeSrc.toLowerCase(),
          resolution: 'iframe',
          type: 'iframe',
          quality: 'iframe',
          server: serverName,
          iframe: true
        });
      }
    });

    // Method 4: Cari dari script yang contain video URL
    $('script').each((i, script) => {
      const scriptContent = $(script).html() || '';
      
      // Pattern untuk video URL di script
      const patterns = [
        /(?:src|url|source|file)["\s:=]+(https?:\/\/[^"'\s]+\.(?:mp4|m3u8|webm|mkv))/gi,
        /(?:video|player)["\s:=]+(https?:\/\/[^"'\s]+)/gi,
        /(?:1080p|720p|480p|360p)["\s:=]+(https?:\/\/[^"'\s]+)/gi,
        /videoplayback[^"'\s]+/gi
      ];

      for (const pattern of patterns) {
        const matches = scriptContent.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const url = match.replace(/^[^:]+["\s:=]+/, '').replace(/["'\s]+$/, '');
            if (url.startsWith('http') && (url.includes('video') || url.includes('playback') || url.match(/\.(mp4|m3u8|webm|mkv)/i))) {
              const res = url.match(/(\d+p)/i)?.[1] || 'auto';
              videoSources.push({
                url: url.toLowerCase(),
                resolution: res.toLowerCase(),
                type: 'video/mp4',
                quality: res.toLowerCase(),
                server: 'default'
              });
              
              if (res !== 'auto' && res.match(/\d+p/i)) {
                allResolutions.add(res.toLowerCase());
              }
            }
          });
        }
      }
    });

    // Method 5: Cari dari data attributes di player container
    $('[data-video], [data-src], [data-url], [class*="player"]').each((i, elem) => {
      const $player = $(elem);
      const dataUrl = $player.attr('data-video') || 
                     $player.attr('data-src') || 
                     $player.attr('data-url');
      const dataRes = $player.attr('data-resolution') || 
                    $player.attr('data-quality');
      
      if (dataUrl && dataUrl.startsWith('http')) {
        videoSources.push({
          url: dataUrl.toLowerCase(),
          resolution: dataRes ? dataRes.toLowerCase() : 'auto',
          type: 'video/mp4',
          quality: dataRes ? dataRes.toLowerCase() : 'auto',
          server: 'default'
        });
        
        if (dataRes && dataRes.match(/\d+p/i)) {
          allResolutions.add(dataRes.toLowerCase());
        }
      }
    });

    // Extract iframe untuk setiap server yang ditemukan
    // Cari semua iframe yang ada (termasuk yang pakai data-src untuk lazy loading)
    const iframes = [];
    
    // Method 1: Cari dari iframe tag (src atau data-src)
    $('iframe').each((i, elem) => {
      const $iframe = $(elem);
      // Cek src atau data-src (untuk lazy loading)
      let iframeSrc = $iframe.attr('src') || $iframe.attr('data-src') || '';
      const iframeTitle = $iframe.attr('title') || '';
      const iframeClass = $iframe.attr('class') || '';
      
      // Jika pakai data-src, mungkin perlu normalize
      if (!iframeSrc.startsWith('http') && iframeSrc) {
        iframeSrc = helpers.normalizeUrl(iframeSrc, BASE_URL);
      }
      
      if (iframeSrc && (iframeSrc.includes('video') || iframeSrc.includes('embed') || iframeSrc.includes('player') || 
          iframeSrc.includes('kotak') || iframeSrc.includes('streamku') || iframeSrc.includes('cepat') ||
          iframeSrc.includes('nonton') || iframeSrc.includes('lokal') || iframeSrc.includes('embed'))) {
        
        // Tentukan server name dari iframe title atau src
        let serverName = 'default';
        if (iframeTitle) {
          // Extract dari title: "Server KotakVideo" -> "kotakvideo"
          const titleMatch = iframeTitle.match(/server\s+([a-z]+)/i);
          if (titleMatch) {
            serverName = titleMatch[1].toLowerCase();
          } else {
            serverName = iframeTitle.toLowerCase().replace(/server\s*/i, '').replace(/\s+/g, '-');
          }
        }
        
        // Fallback: cek dari URL
        if (serverName === 'default' || serverName.length < 2) {
          if (iframeSrc.includes('kotak')) serverName = 'kotakvideo';
          else if (iframeSrc.includes('streamku')) serverName = 'streamku';
          else if (iframeSrc.includes('cepat')) serverName = 'cepat';
          else if (iframeSrc.includes('nontonku')) serverName = 'nontonku';
          else if (iframeSrc.includes('nonton') && !iframeSrc.includes('nontonku')) serverName = 'nonton';
          else if (iframeSrc.includes('lokal')) serverName = 'lokal-c';
        }
        
        iframes.push({
          url: iframeSrc.toLowerCase(),
          title: iframeTitle.toLowerCase(),
          server: serverName,
          element: $iframe
        });
        
        videoSources.push({
          url: iframeSrc.toLowerCase(),
          resolution: 'iframe',
          type: 'iframe',
          quality: 'iframe',
          server: serverName,
          iframe: true
        });
      }
    });
    
    // Method 2: Cari dari script yang contain iframe URL
    $('script').each((i, script) => {
      const scriptContent = $(script).html() || '';
      // Pattern untuk iframe src di script
      const iframePatterns = [
        /iframe.*?src["\s:=]+(https?:\/\/[^"'\s]+)/gi,
        /data-src["\s:=]+(https?:\/\/[^"'\s]+)/gi,
        /kotakanimeid\.link[^"'\s]+/gi,
        /video-embed[^"'\s]+/gi
      ];
      
      for (const pattern of iframePatterns) {
        const matches = scriptContent.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const url = match.replace(/^[^:]+["\s:=]+/, '').replace(/["'\s]+$/, '').split('"')[0].split("'")[0];
            if (url.startsWith('http') && (url.includes('video') || url.includes('embed') || url.includes('kotak'))) {
              let serverName = 'default';
              if (url.includes('kotak')) serverName = 'kotakvideo';
              else if (url.includes('streamku')) serverName = 'streamku';
              else if (url.includes('cepat')) serverName = 'cepat';
              else if (url.includes('nontonku')) serverName = 'nontonku';
              else if (url.includes('nonton')) serverName = 'nonton';
              else if (url.includes('lokal')) serverName = 'lokal-c';
              
              // Cek apakah sudah ada
              if (!iframes.find(iframe => iframe.url === url.toLowerCase())) {
                iframes.push({
                  url: url.toLowerCase(),
                  title: '',
                  server: serverName,
                  element: null
                });
                
                videoSources.push({
                  url: url.toLowerCase(),
                  resolution: 'iframe',
                  type: 'iframe',
                  quality: 'iframe',
                  server: serverName,
                  iframe: true
                });
              }
            }
          });
        }
      }
    });
    
    console.log(`Found ${iframes.length} iframes, ${videoSources.length} total video sources`);
    
    // Debug: log semua video sources yang ditemukan
    if (videoSources.length > 0) {
      console.log('Video sources found:', videoSources.map(vs => ({ server: vs.server, url: vs.url.substring(0, 50) })));
    } else {
      console.log('WARNING: No video sources found!');
    }

    // Organize video sources by server dengan matching yang lebih baik
    const serversWithSources = servers.map(server => {
      const serverName = server.name.toLowerCase();
      
      // Cari sources yang match dengan server ini
      let serverSources = videoSources.filter(vs => {
        const vsServer = vs.server.toLowerCase();
        
        // Exact match
        if (vsServer === serverName) return true;
        
        // Partial match
        if (vsServer.includes(serverName) || serverName.includes(vsServer)) return true;
        
        // Match dari iframe title
        if (vs.iframe && vs.url) {
          // Cek jika iframe URL match dengan server name
          if (serverName === 'kotakvideo' && vs.url.includes('kotak')) return true;
          if (serverName === 'streamku' && vs.url.includes('streamku')) return true;
          if (serverName === 'cepat' && vs.url.includes('cepat')) return true;
          if (serverName === 'nontonku' && vs.url.includes('nontonku')) return true;
          if (serverName === 'nonton' && vs.url.includes('nonton') && !vs.url.includes('nontonku')) return true;
          if (serverName === 'lokal-c' && vs.url.includes('lokal')) return true;
        }
        
        return false;
      });
      
      // Jika masih tidak ada, cari dari iframes yang sudah di-extract
      if (serverSources.length === 0) {
        const matchedIframes = iframes.filter(iframe => {
          const iframeServer = iframe.server.toLowerCase();
          return iframeServer === serverName || 
                 iframeServer.includes(serverName) ||
                 serverName.includes(iframeServer);
        });
        
        if (matchedIframes.length > 0) {
          serverSources = matchedIframes.map(iframe => ({
            url: iframe.url,
            resolution: 'iframe',
            type: 'iframe',
            quality: 'iframe',
            server: server.name,
            iframe: true
          }));
        }
      }
      
      // Jika masih tidak ada, coba cari iframe di sekitar element server
      if (serverSources.length === 0 && server.element) {
        try {
          const $serverElem = server.element;
          const relatedIframe = $serverElem.closest('div, section, article').find('iframe').first();
          if (relatedIframe.length) {
            const iframeSrc = relatedIframe.attr('src') || relatedIframe.attr('data-src');
            if (iframeSrc) {
              serverSources.push({
                url: iframeSrc.toLowerCase(),
                resolution: 'iframe',
                type: 'iframe',
                quality: 'iframe',
                server: server.name,
                iframe: true
              });
            }
          }
        } catch (err) {
          // Skip error
        }
      }
      
      // Extract resolusi dari sources
      const serverResolutions = [...new Set(serverSources
        .map(s => s.resolution)
        .filter(r => r && r.match(/\d+p/i))
        .map(r => r.toLowerCase()))];
      
      return {
        name: server.name,
        id: server.id,
        active: server.active,
        sources: serverSources.length > 0 ? serverSources : [],
        resolutions: serverResolutions.length > 0 ? serverResolutions : []
      };
    });

    // Jika tidak ada server ditemukan tapi ada video sources, buat default server
    if (serversWithSources.length === 0 && videoSources.length > 0) {
      serversWithSources.push({
        name: 'default',
        id: 'default',
        active: true,
        sources: videoSources,
        resolutions: Array.from(allResolutions)
      });
    }
    
    // Fallback: Jika server tidak punya sources, assign iframe yang sudah ditemukan
    if (serversWithSources.length > 0 && serversWithSources.some(s => s.sources.length === 0)) {
      // Assign iframe ke server yang sesuai
      iframes.forEach(iframe => {
        const iframeServer = iframe.server.toLowerCase();
        const matchedServer = serversWithSources.find(s => {
          const serverName = s.name.toLowerCase();
          return serverName === iframeServer || 
                 serverName.includes(iframeServer) ||
                 iframeServer.includes(serverName);
        });
        
        if (matchedServer && matchedServer.sources.length === 0) {
          matchedServer.sources.push({
            url: iframe.url,
            resolution: 'iframe',
            type: 'iframe',
            quality: 'iframe',
            server: matchedServer.name,
            iframe: true
          });
        }
      });
    }
    
    // Jika masih kosong, buat server dari semua iframe yang ditemukan
    if (serversWithSources.length === 0 || serversWithSources.every(s => s.sources.length === 0)) {
      // Gunakan iframes yang sudah di-extract
      if (iframes.length > 0) {
        iframes.forEach((iframe, i) => {
          serversWithSources.push({
            name: iframe.server,
            id: `server-${iframe.server}`,
            active: i === 0,
            sources: [{
              url: iframe.url,
              resolution: 'iframe',
              type: 'iframe',
              quality: 'iframe',
              server: iframe.server,
              iframe: true
            }],
            resolutions: []
          });
        });
      } else {
        // Fallback: cari semua iframe yang ada
        $('iframe').each((i, elem) => {
          const $iframe = $(elem);
          const iframeSrc = $iframe.attr('src') || $iframe.attr('data-src');
          if (iframeSrc && (iframeSrc.includes('video') || iframeSrc.includes('embed') || iframeSrc.includes('player') ||
              iframeSrc.includes('kotak') || iframeSrc.includes('streamku'))) {
            let serverName = 'server-' + (i + 1);
            if (iframeSrc.includes('kotak')) serverName = 'kotakvideo';
            else if (iframeSrc.includes('streamku')) serverName = 'streamku';
            else if (iframeSrc.includes('cepat')) serverName = 'cepat';
            else if (iframeSrc.includes('nontonku')) serverName = 'nontonku';
            else if (iframeSrc.includes('nonton')) serverName = 'nonton';
            else if (iframeSrc.includes('lokal')) serverName = 'lokal-c';
            
            serversWithSources.push({
              name: serverName,
              id: serverName,
              active: i === 0,
              sources: [{
                url: iframeSrc.toLowerCase(),
                resolution: 'iframe',
                type: 'iframe',
                quality: 'iframe',
                server: serverName,
                iframe: true
              }],
              resolutions: []
            });
          }
        });
      }
    }

    episodeData.videoServers = serversWithSources;
    episodeData.resolutions = Array.from(allResolutions).sort((a, b) => {
      const numA = parseInt(a.replace('p', '')) || 0;
      const numB = parseInt(b.replace('p', '')) || 0;
      return numB - numA; // Sort dari tinggi ke rendah
    });

    // Jika tidak ada video source ditemukan, return link episode sebagai fallback
    if (videoSources.length === 0 && serversWithSources.length === 0) {
      episodeData.videoServers.push({
        name: 'webpage',
        id: 'webpage',
        active: true,
        sources: [{
          url: url.toLowerCase(),
          resolution: 'webpage',
          type: 'webpage',
          quality: 'webpage',
          server: 'webpage',
          note: 'video source tidak ditemukan, gunakan link episode untuk akses player'
        }],
        resolutions: []
      });
    }

    return episodeData;

    // Extract video player sources dan resolusi
    // Cari semua video source (bisa dari iframe, video tag, atau script)
    
    // Method 1: Cari dari video tag
    $('video source').each((i, elem) => {
      const $source = $(elem);
      const src = $source.attr('src');
      const type = $source.attr('type') || 'video/mp4';
      const res = $source.attr('data-resolution') || $source.attr('data-res') || '';
      
      if (src) {
        const videoUrl = src.startsWith('http') ? src : BASE_URL + src;
        episodeData.videoSources.push({
          url: videoUrl.toLowerCase(),
          resolution: res.toLowerCase() || 'auto',
          type: type.toLowerCase(),
          quality: res.toLowerCase() || 'auto'
        });
        
        if (res && !episodeData.resolutions.includes(res.toLowerCase())) {
          episodeData.resolutions.push(res.toLowerCase());
        }
      }
    });

    // Method 2: Cari dari iframe player (biasanya embed)
    $('iframe[src*="player"], iframe[src*="embed"], iframe[src*="video"]').each((i, elem) => {
      const iframeSrc = $(elem).attr('src');
      if (iframeSrc) {
        episodeData.videoSources.push({
          url: iframeSrc.toLowerCase(),
          resolution: 'iframe',
          type: 'iframe',
          quality: 'iframe'
        });
      }
    });

    // Method 3: Cari dari script yang contain video URL (biasanya JSON atau variable)
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const scriptContent = $(script).html() || '';
      
      // Cari pattern video URL di script
      const videoUrlPatterns = [
        /(?:src|url|source|file)["\s:=]+(https?:\/\/[^"'\s]+\.(?:mp4|m3u8|webm|mkv))/gi,
        /(?:video|player)["\s:=]+(https?:\/\/[^"'\s]+)/gi,
        /(?:1080p|720p|480p|360p)["\s:=]+(https?:\/\/[^"'\s]+)/gi
      ];

      for (const pattern of videoUrlPatterns) {
        const matches = scriptContent.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const url = match.replace(/^[^:]+["\s:=]+/, '').replace(/["'\s]+$/, '');
            if (url.startsWith('http')) {
              const res = url.match(/(\d+p)/i)?.[1] || 'auto';
              episodeData.videoSources.push({
                url: url.toLowerCase(),
                resolution: res.toLowerCase(),
                type: 'video/mp4',
                quality: res.toLowerCase()
              });
              
              if (res !== 'auto' && !episodeData.resolutions.includes(res.toLowerCase())) {
                episodeData.resolutions.push(res.toLowerCase());
              }
            }
          });
        }
      }
    }

    // Method 4: Cari dari button/select resolusi
    $('.resolution-btn, .quality-btn, [class*="resolution"], [class*="quality"]').each((i, elem) => {
      const $btn = $(elem);
      const res = $btn.text().trim().toLowerCase() || $btn.attr('data-resolution') || $btn.attr('data-quality') || '';
      const videoUrl = $btn.attr('data-url') || $btn.attr('data-src') || $btn.attr('href') || '';
      
      if (res && !episodeData.resolutions.includes(res)) {
        episodeData.resolutions.push(res);
      }
      
      if (videoUrl && videoUrl.startsWith('http')) {
        episodeData.videoSources.push({
          url: videoUrl.toLowerCase(),
          resolution: res || 'auto',
          type: 'video/mp4',
          quality: res || 'auto'
        });
      }
    });

    // Method 5: Cari dari data attributes di player container
    $('.player-container, .video-player, [class*="player"]').each((i, elem) => {
      const $player = $(elem);
      const dataUrl = $player.attr('data-url') || $player.attr('data-src') || $player.attr('data-video') || '';
      const dataRes = $player.attr('data-resolution') || $player.attr('data-quality') || '';
      
      if (dataUrl) {
        const videoUrl = dataUrl.startsWith('http') ? dataUrl : BASE_URL + dataUrl;
        episodeData.videoSources.push({
          url: videoUrl.toLowerCase(),
          resolution: dataRes.toLowerCase() || 'auto',
          type: 'video/mp4',
          quality: dataRes.toLowerCase() || 'auto'
        });
        
        if (dataRes && !episodeData.resolutions.includes(dataRes.toLowerCase())) {
          episodeData.resolutions.push(dataRes.toLowerCase());
        }
      }
    });

    // Sort resolusi dari tinggi ke rendah
    episodeData.resolutions.sort((a, b) => {
      const numA = parseInt(a.replace('p', '')) || 0;
      const numB = parseInt(b.replace('p', '')) || 0;
      return numB - numA;
    });

    // Jika tidak ada video source ditemukan, return link episode sebagai fallback
    if (episodeData.videoSources.length === 0) {
      episodeData.videoSources.push({
        url: url.toLowerCase(),
        resolution: 'unknown',
        type: 'webpage',
        quality: 'unknown',
        note: 'video source tidak ditemukan, gunakan link episode untuk akses player'
      });
    }

    return episodeData;
  } catch (error) {
    console.error('Error fetching episode video:', error);
    throw error;
  }
}

// Ambil data dari animeinweb.com
async function getAnimeInWebData(animeIdOrUrl) {
  try {
    // Extract anime ID dari URL atau langsung pakai ID
    let animeId = animeIdOrUrl;
    if (animeIdOrUrl.startsWith('http')) {
      const match = animeIdOrUrl.match(/\/anime\/(\d+)/);
      if (match) animeId = match[1];
    }
    
    if (!animeId) {
      throw new Error('Anime ID tidak ditemukan');
    }
    
    console.log(`Fetching anime data for ID: ${animeId}`);
    
    // Gunakan API langsung untuk data lengkap
    const detailApiUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/movie/detail/${animeId}`;
    const episodeApiUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/movie/episode/${animeId}?page=0`;
    
    console.log(`Fetching from API: ${detailApiUrl}`);
    const detailResponse = await axios.get(detailApiUrl);
    const detailData = detailResponse.data;
    
    if (!detailData || detailData.error || !detailData.data) {
      throw new Error('Failed to fetch anime detail from API');
    }
    
    const movie = detailData.data.movie;
    const currentEpisode = detailData.data.episode;
    
    // Fetch episode list - AMBIL SEMUA PAGE untuk mendapatkan semua episode
    console.log(`Fetching episode list: ${episodeApiUrl}`);
    const episodes = [];
    let page = 0;
    let hasMore = true;
    const maxPages = 100; // Safety limit untuk menghindari infinite loop
    
    while (hasMore && page < maxPages) {
      const currentPageUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/movie/episode/${animeId}?page=${page}`;
      console.log(`Fetching episode page ${page}...`);
      
      try {
        const episodeResponse = await axios.get(currentPageUrl, { timeout: 15000 });
        const episodeData = episodeResponse.data;
        
        if (episodeData && episodeData.data && episodeData.data.episode && episodeData.data.episode.length > 0) {
          // Parse episodes dari page ini
          episodeData.data.episode.forEach(ep => {
            episodes.push({
              number: ep.index,
              episodeId: ep.id,
              title: ep.title.toLowerCase(),
              views: ep.views || '0',
              releaseDate: ep.key_time || '',
              thumbnail: ep.image ? (ep.image.startsWith('http') ? ep.image : `https://xyz-api.animein.net${ep.image}`) : null,
              isNew: ep.is_new === '1',
              link: `${ANIMEINWEB_URL}/anime/${animeId}?ep=${ep.index}`
            });
          });
          
          // Check apakah masih ada page berikutnya
          // Biasanya API return 30 episode per page, jika kurang dari 30 berarti sudah habis
          // Atau cek has_more jika ada di response
          const episodeCount = episodeData.data.episode.length;
          hasMore = episodeCount >= 30; // Jika dapat 30 episode, kemungkinan masih ada page berikutnya
          
          if (episodeData.data.has_more !== undefined) {
            hasMore = episodeData.data.has_more === true || episodeData.data.has_more === '1';
          }
          
          console.log(`  Page ${page}: ${episodeCount} episodes (Total: ${episodes.length})`);
          
          // Jika dapat kurang dari 30 episode, berarti sudah habis
          if (episodeCount < 30) {
            hasMore = false;
          }
          
          page++;
        } else {
          // Tidak ada episode di page ini, stop
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);
        // Jika error, coba lanjut ke page berikutnya (mungkin page tidak ada)
        if (page === 0) {
          // Jika page 0 error, throw error
          throw error;
        } else {
          // Jika page selanjutnya error, berarti sudah habis
          hasMore = false;
        }
      }
      
      // Small delay untuk menghindari rate limit
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`✅ Fetched ${episodes.length} episodes from ${page} page(s)`);
    
    // Sort episodes by number (latest first)
    episodes.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numB - numA;
    });
    
    // Parse genres
    const genres = movie.genre ? movie.genre.split(',').map(g => g.trim().toLowerCase()) : [];
    
    // Parse studios
    const studios = movie.studio ? [movie.studio.toLowerCase()] : [];
    
    const animeData = {
      title: (movie.title || '').toLowerCase(),
      alternativeTitle: (movie.synonyms || '').toLowerCase(),
      synopsis: (movie.synopsis || '').toLowerCase(),
      status: (movie.status || '').toLowerCase(),
      type: (movie.type || '').toLowerCase(),
      airedStart: (movie.aired_start || '').toLowerCase(),
      airedEnd: (movie.aired_end || '').toLowerCase(),
      studios: studios,
      genres: genres,
      author: '', // Tidak ada di API
      rating: '', // Tidak ada di API
      cover: movie.image_cover || '',
      poster: movie.image_poster || '',
      thumbnail: movie.image_cover || movie.image_poster || '',
      episodes: episodes,
      currentEpisode: currentEpisode ? {
        number: parseInt(currentEpisode.index) || 0,
        title: currentEpisode.title.toLowerCase(),
        episodeId: currentEpisode.id
      } : null,
      year: movie.year || '',
      day: movie.day || '',
      views: movie.views || '0',
      favorites: movie.favorites || '0',
      videoSources: [],
      resolutions: [],
      note: 'Video ada di halaman episode individual. Gunakan link episode untuk mendapatkan video.'
    };
    
    console.log(`✅ Success: ${episodes.length} episodes found`);
    return animeData;
  } catch (error) {
    console.error('Error fetching animeinweb data:', error);
    throw error;
  }
}

// Ambil data episode dari animeinweb.com (tanpa iklan) - menggunakan API internal (OPTIMASI: tanpa Playwright)
async function getAnimeInWebEpisode(animeId, episodeNumber) {
  try {
    console.log(`Fetching episode ${episodeNumber} from anime ${animeId}...`);
    
    // OPTIMASI: Ambil episode ID langsung dari episode list API (lebih cepat!)
    let episodeId = null;
    let episodeInfo = null; // Rename dari episodeData untuk avoid conflict
    let animeTitle = '';
    
    try {
      // Fetch semua page untuk mencari episode (atau bisa langsung cari di page yang tepat)
      // Untuk optimasi, kita coba page 0 dulu, kalau tidak ketemu baru cari di page lain
      let foundEpisode = false;
      let page = 0;
      const maxSearchPages = 5; // Limit search untuk menghindari terlalu lama
      
      while (!foundEpisode && page < maxSearchPages) {
        const episodeListUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/movie/episode/${animeId}?page=${page}`;
        console.log(`Searching episode in page ${page}: ${episodeListUrl}`);
        const episodeListResponse = await axios.get(episodeListUrl, { timeout: 10000 });
        const episodeListData = episodeListResponse.data;
        
        if (episodeListData && episodeListData.data && episodeListData.data.episode) {
          // Cari episode dengan nomor yang sesuai
          const targetEpisode = episodeListData.data.episode.find(ep => 
            ep.index === episodeNumber.toString() || ep.index === parseInt(episodeNumber).toString()
          );
          
          if (targetEpisode) {
            episodeId = targetEpisode.id;
            episodeInfo = targetEpisode;
            foundEpisode = true;
            console.log(`✅ Found episode ID ${episodeId} from page ${page} (FAST!)`);
            break;
          }
          
          // Jika episode di page ini lebih kecil dari yang dicari, berarti episode ada di page sebelumnya
          const minEpisodeInPage = Math.min(...episodeListData.data.episode.map(ep => parseInt(ep.index) || 0));
          if (parseInt(episodeNumber) < minEpisodeInPage) {
            // Episode ada di page sebelumnya, tapi kita sudah lewat, berarti tidak ada
            break;
          }
          
          page++;
        } else {
          break;
        }
      }
      
      // Ambil anime title dari detail API
      const detailUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/movie/detail/${animeId}`;
      const detailResponse = await axios.get(detailUrl, { timeout: 10000 });
      if (detailResponse.data && detailResponse.data.data && detailResponse.data.data.movie) {
        animeTitle = detailResponse.data.data.movie.title || '';
      }
    } catch (apiError) {
      console.log('Episode list API failed, falling back to Playwright...', apiError.message);
    }
    
    // Fallback ke Playwright jika episode ID tidak ditemukan dari API
    if (!episodeId) {
      console.log('Using Playwright fallback...');
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      
      // Array untuk track network requests
      const apiRequests = [];
      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/proxy/') || url.includes('/episode/streamnew/')) {
          apiRequests.push(url);
        }
      });
      
      // Navigate ke halaman episode
      const url = `${ANIMEINWEB_URL}/anime/${animeId}?ep=${episodeNumber}`;
      console.log(`Navigating to: ${url}`);
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000); // Kurangi wait time dari 10s ke 5s
      
      // Extract episode info dari page
      const pageInfo = await page.evaluate(() => {
        const data = {
          animeTitle: '',
          thumbnail: ''
        };
        
        // Extract title
        const h1 = document.querySelector('h1');
        if (h1) data.animeTitle = h1.textContent.trim();
        
        // Extract thumbnail
        const poster = document.querySelector('video')?.getAttribute('poster');
        if (poster && !poster.includes('bg_cover')) {
          data.thumbnail = poster;
        }
        
        return data;
      });
      
      animeTitle = pageInfo.animeTitle || animeTitle;
      
      await browser.close();
      
      // Extract episode ID dari API request
      for (const apiUrl of apiRequests) {
        const match = apiUrl.match(/\/episode\/streamnew\/(\d+)/);
        if (match) {
          episodeId = match[1];
          console.log(`Found episode ID: ${episodeId}`);
          break;
        }
      }
      
      if (!episodeId) {
        throw new Error(`Episode ID tidak ditemukan untuk anime ${animeId} episode ${episodeNumber}`);
      }
    }
    
    // Fetch data dari API internal
    const apiUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/episode/streamnew/${episodeId}`;
    console.log(`Fetching from API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl);
    const apiData = response.data;
    
    if (!apiData || apiData.error || !apiData.data) {
      throw new Error('Failed to fetch episode data from API');
    }
    
    const episodeApiData = apiData.data.episode; // Rename untuk avoid conflict
    const servers = apiData.data.server || [];
    
    // Filter dan format video sources (tanpa iklan)
    const videoSources = [];
    const resolutions = new Set();
    
    servers.forEach(server => {
      let link = server.link;
      const quality = server.quality || 'auto';
      const serverName = server.name || 'default';
      
      // Filter iklan - skip jika URL mengandung /ads/ atau kata-kata produk
      if (link && !link.toLowerCase().includes('/ads/')) {
        // Check apakah bukan iklan berdasarkan pattern
        const isAd = /(?:baju|kaos|fragrance|parfum|figure|pokemon|mouse|pad|kipas|setelan|joging|kizaru|hunter|killua|drinking|blokees|yiomio|kamb|cyfersia|chopper|tempest|islan|vanilla|breeze|extrait|5star|msw100|tebal|oscc104|figuremiku|miku|tyeso|aura|tumbler|handle|stainless|coffee|cup|900|ml|eyewear|isla|sunglasses)/i.test(link);
        
        if (!isAd) {
          // Decode URL jika masih encoded (untuk HTML5 video player)
          try {
            link = decodeURIComponent(link);
          } catch (e) {
            // Jika decode gagal, pakai URL asli
            console.log('URL decode failed, using original:', link.substring(0, 50));
          }
          
          // Detect MIME type dari URL extension atau pattern
          let mimeType = 'video/mp4'; // Default ke mp4
          const urlLower = link.toLowerCase();
          
          if (urlLower.includes('.mp4') || urlLower.match(/\.mp4[\?\/]/)) {
            mimeType = 'video/mp4';
          } else if (urlLower.includes('.webm') || urlLower.match(/\.webm[\?\/]/)) {
            mimeType = 'video/webm';
          } else if (urlLower.includes('.m3u8') || urlLower.match(/\.m3u8[\?\/]/)) {
            mimeType = 'application/x-mpegURL'; // HLS stream
          } else if (urlLower.includes('.m3u') || urlLower.match(/\.m3u[\?\/]/)) {
            mimeType = 'application/x-mpegURL';
          } else if (urlLower.includes('.flv') || urlLower.match(/\.flv[\?\/]/)) {
            mimeType = 'video/x-flv';
          } else if (urlLower.includes('.mkv') || urlLower.match(/\.mkv[\?\/]/)) {
            mimeType = 'video/x-matroska';
          } else if (server.type && server.type !== 'direct') {
            // Jika server.type sudah ada dan bukan 'direct', pakai itu
            mimeType = server.type;
          }
          
          // Prioritaskan server RAPSODI untuk semua resolusi
          const isRapsodi = serverName.toUpperCase().includes('RAPSODI');
          
          videoSources.push({
            url: link, // Pakai URL yang sudah di-decode, jangan lowercase karena bisa merusak URL
            resolution: quality.toLowerCase(),
            type: mimeType, // Pakai MIME type yang benar untuk HTML5 video
            quality: quality.toLowerCase(),
            server: serverName,
            fileSize: server.key_file_size || null,
            serverId: server.server_id || null,
            isRapsodi: isRapsodi
          });
          
          if (quality.match(/\d+p/i)) {
            resolutions.add(quality.toLowerCase());
          }
        }
      }
    });
    
    // Sort: RAPSODI server dulu, kemudian sort by resolution (highest first)
    videoSources.sort((a, b) => {
      // RAPSODI first
      if (a.isRapsodi && !b.isRapsodi) return -1;
      if (!a.isRapsodi && b.isRapsodi) return 1;
      
      // Then by resolution (highest first)
      const numA = parseInt(a.resolution.replace('p', '')) || 0;
      const numB = parseInt(b.resolution.replace('p', '')) || 0;
      return numB - numA;
    });
    
    // Sort resolutions
    const sortedResolutions = [...resolutions].sort((a, b) => {
      const numA = parseInt(a.replace('p', '')) || 0;
      const numB = parseInt(b.replace('p', '')) || 0;
      return numB - numA;
    });
    
    const result = {
      title: (episodeInfo && episodeInfo.title) ? episodeInfo.title.toLowerCase() : (episodeApiData && episodeApiData.title ? episodeApiData.title.toLowerCase() : `Episode ${episodeNumber}`),
      episodeNumber: episodeNumber.toString(),
      episodeId: episodeId,
      animeTitle: animeTitle || '',
      animeId: animeId.toString(),
      videoSources: videoSources,
      resolutions: sortedResolutions,
      thumbnail: (episodeInfo && episodeInfo.image) ? `${ANIMEINWEB_URL}${episodeInfo.image}` : (episodeApiData && episodeApiData.image ? `${ANIMEINWEB_URL}${episodeApiData.image}` : ''),
      views: (episodeInfo && episodeInfo.views) ? episodeInfo.views : (episodeApiData ? episodeApiData.views || '0' : '0'),
      releaseDate: (episodeInfo && episodeInfo.key_time) ? episodeInfo.key_time : (episodeApiData ? episodeApiData.key_time || '' : ''),
      nextEpisode: apiData.data.episode_next ? {
        number: apiData.data.episode_next.index,
        id: apiData.data.episode_next.id
      } : null
    };
    
    console.log(`✅ Success: ${videoSources.length} video sources, ${sortedResolutions.length} resolutions`);
    if (videoSources.length > 0) {
      console.log(`Sample video: ${videoSources[0].url.substring(0, 80)}...`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching animeinweb episode:', error);
    throw error;
  }
}

// Ambil jadwal anime per hari dari animeinweb.com
async function getSchedule(day = null) {
  // Di Vercel: SELALU pakai API internal (tanpa browser automation)
  // Browser automation (Playwright/Puppeteer) sering timeout/error di serverless
  const isVercel = process.env.VERCEL;
  
  // Check if we can use playwright (hanya untuk local development)
  let usePlaywright = false;
  if (!isVercel) {
    try {
      require.resolve('playwright');
      usePlaywright = true;
    } catch (e) {}
  }

  // Untuk Vercel atau jika Playwright tidak tersedia: pakai API internal
  if (isVercel || !usePlaywright) {
    console.log('[Schedule] Using API internal (Vercel/no Playwright)...');
    // Langsung pakai API explore karena HTML schedule pakai Next.js (client-side rendering)
    try {
      const data = { currentDay: day || 'HARI INI', schedule: [] };
      const seenIds = new Set();
      
      // Langsung fetch dari API explore - lebih reliable daripada scraping HTML Next.js
      console.log(`[Schedule] Fetching from API explore for day: ${day || 'all'}`);
      const exploreUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/explore/movie?page=0&sort=update&keyword=`;
      const exploreResponse = await axios.get(exploreUrl, { timeout: 10000 });
      
      if (exploreResponse.data && exploreResponse.data.data && exploreResponse.data.data.movie) {
        const movies = exploreResponse.data.data.movie;
        const dayMap = {
          'senin': 'MONDAY', 'monday': 'MONDAY', 'SEN': 'MONDAY',
          'selasa': 'TUESDAY', 'tuesday': 'TUESDAY', 'SEL': 'TUESDAY',
          'rabu': 'WEDNESDAY', 'wednesday': 'WEDNESDAY', 'RAB': 'WEDNESDAY',
          'kamis': 'THURSDAY', 'thursday': 'THURSDAY', 'KAM': 'THURSDAY',
          'jumat': 'FRIDAY', 'friday': 'FRIDAY', 'JUM': 'FRIDAY',
          'sabtu': 'SATURDAY', 'saturday': 'SATURDAY', 'SAB': 'SATURDAY',
          'minggu': 'SUNDAY', 'sunday': 'SUNDAY', 'MIN': 'SUNDAY',
          'random': 'RANDOM', 'RANDOM': 'RANDOM'
        };
        
        const targetDay = day ? dayMap[day.toLowerCase()] || day.toUpperCase() : null;
        
        // Filter berdasarkan day jika ada
        // Catatan: API internal tidak punya data jadwal per hari (semua day: RANDOM)
        // Jadi kita return anime terbaru saja
        let filteredMovies = movies;
        if (targetDay && targetDay !== 'RANDOM') {
          // Coba filter dulu, kalau kosong ambil semua
          const dayFiltered = movies.filter(m => {
            const movieDay = (m.day || '').toUpperCase();
            return movieDay === targetDay;
          });
          
          if (dayFiltered.length > 0) {
            filteredMovies = dayFiltered.slice(0, 100);
          } else {
            // Tidak ada anime untuk hari ini dari API, return semua anime terbaru
            console.log(`[Schedule] No anime found for ${targetDay}, returning latest anime instead`);
            filteredMovies = movies.slice(0, 60);
          }
        } else {
          filteredMovies = movies.slice(0, 60);
        }
        
        console.log(`[Schedule] Found ${filteredMovies.length} anime from API`);
        
        filteredMovies.forEach(movie => {
          if (!seenIds.has(movie.id)) {
            seenIds.add(movie.id);
            const genres = movie.genre ? movie.genre.split(',').map(g => g.trim().toLowerCase()) : [];
            data.schedule.push({
              animeId: movie.id,
              title: (movie.title || '').toLowerCase(),
              genre: genres[0] || null,
              views: movie.views || '0',
              favorite: movie.favorites || '0',
              releaseTime: null,
              link: `${ANIMEINWEB_URL}/anime/${movie.id}`,
              thumbnail: movie.image_poster || '',
              cover: movie.image_cover || '',
              poster: movie.image_poster || '',
              isNew: false,
              status: (movie.status || '').toLowerCase()
            });
          }
        });
        
        // Update currentDay
        if (day) {
          const dayNames = {
            'MONDAY': 'SEN', 'TUESDAY': 'SEL', 'WEDNESDAY': 'RAB',
            'THURSDAY': 'KAM', 'FRIDAY': 'JUM', 'SATURDAY': 'SAB', 'SUNDAY': 'MIN'
          };
          data.currentDay = dayNames[targetDay] || day.toUpperCase();
        } else {
          // Coba detect dari data pertama
          if (filteredMovies.length > 0 && filteredMovies[0].day) {
            const firstDay = filteredMovies[0].day.toUpperCase();
            const dayNames = {
              'MONDAY': 'SEN', 'TUESDAY': 'SEL', 'WEDNESDAY': 'RAB',
              'THURSDAY': 'KAM', 'FRIDAY': 'JUM', 'SATURDAY': 'SAB', 'SUNDAY': 'MIN'
            };
            data.currentDay = dayNames[firstDay] || firstDay;
          }
        }
      }
      
      console.log(`[Schedule] Total found: ${data.schedule.length} schedule items`);
      
      // Fetch cover/poster dari API untuk anime yang tidak punya image (batch, max 20)
      const animeWithoutImage = data.schedule.filter(a => !a.thumbnail && !a.cover && !a.poster).slice(0, 20);
      if (animeWithoutImage.length > 0) {
        console.log(`Fetching cover/poster untuk ${animeWithoutImage.length} anime...`);
        const imagePromises = animeWithoutImage.map(async (anime) => {
          try {
            const detailUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/movie/detail/${anime.animeId}`;
            const detailResponse = await axios.get(detailUrl, { timeout: 5000 });
            if (detailResponse.data && detailResponse.data.data && detailResponse.data.data.movie) {
              const movie = detailResponse.data.data.movie;
              return {
                animeId: anime.animeId,
                cover: movie.image_cover || '',
                poster: movie.image_poster || '',
                thumbnail: movie.image_cover || movie.image_poster || ''
              };
            }
          } catch (error) {
            console.log(`Failed to fetch image for anime ${anime.animeId}:`, error.message);
          }
          return null;
        });
        
        const imageResults = await Promise.all(imagePromises);
        imageResults.forEach(result => {
          if (result) {
            const scheduleItem = data.schedule.find(a => a.animeId === result.animeId);
            if (scheduleItem) {
              scheduleItem.cover = result.cover;
              scheduleItem.poster = result.poster;
              scheduleItem.thumbnail = result.thumbnail;
            }
          }
        });
      }
      
      return data;
    } catch (e) {
      console.error('Error in API fallback for schedule:', e.message);
      throw new Error(`Gagal mengambil data schedule: ${e.message}`);
    }
  }

  // Gunakan Playwright untuk local development (bukan Vercel)
  if (usePlaywright) {
    try {
      const { chromium } = require('playwright');
      const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    // Block images, CSS, fonts untuk lebih cepat
    await page.route('**/*.{png,jpg,jpeg,gif,svg,webp,css,woff,woff2,ttf}', route => route.abort());
    
    await page.goto(`${ANIMEINWEB_URL}/schedule`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    // Tidak perlu wait, langsung evaluate karena sudah domcontentloaded
    
    // Jika day diberikan, klik tab hari tersebut
    if (day) {
      const dayMap = {
        'senin': 'SEN', 'monday': 'SEN',
        'selasa': 'SEL', 'tuesday': 'SEL',
        'rabu': 'RAB', 'wednesday': 'RAB',
        'kamis': 'KAM', 'thursday': 'KAM',
        'jumat': 'JUM', 'friday': 'JUM',
        'sabtu': 'SAB', 'saturday': 'SAB',
        'minggu': 'MIN', 'sunday': 'MIN',
        'random': 'RANDOM'
      };
      
      const dayTab = dayMap[day.toLowerCase()] || day.toUpperCase();
      try {
        // Coba click langsung tanpa wait terlalu lama
        await Promise.race([
          page.click(`button:has-text("${dayTab}")`, { timeout: 1000 }),
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);
        await page.waitForTimeout(300); // Minimal wait untuk content load
      } catch (e) {
        console.log(`Tab ${dayTab} tidak ditemukan, menggunakan default`);
      }
    }
    
    const scheduleData = await page.evaluate(() => {
      const data = {
        currentDay: '',
        schedule: []
      };
      
      // Extract current active tab
      const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
      if (activeTab) {
        data.currentDay = activeTab.textContent.trim();
      }
      
      // Extract semua anime dari schedule
      const animeLinks = document.querySelectorAll('a[href*="/anime/"]');
      animeLinks.forEach(link => {
        const href = link.href;
        const text = link.textContent.trim();
        
        // Extract image (cover/poster/thumbnail) dari link atau parent element
        let thumbnail = '';
        let cover = '';
        let poster = '';
        
        // Cari image di dalam link atau parent
        const img = link.querySelector('img');
        if (img) {
          thumbnail = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
          cover = thumbnail;
          poster = thumbnail;
        } else {
          // Cari di parent element
          const parent = link.closest('div, article, section, li');
          if (parent) {
            const parentImg = parent.querySelector('img');
            if (parentImg) {
              thumbnail = parentImg.src || parentImg.getAttribute('data-src') || parentImg.getAttribute('data-lazy-src') || '';
              cover = thumbnail;
              poster = thumbnail;
            }
          }
        }
        
        // Extract info dari text (genre, views, favorite, waktu)
        const parts = text.split(/\s+/);
        let genre = '';
        let views = '';
        let favorite = '';
        let time = '';
        let title = '';
        
        // Parse text untuk extract data
        const viewMatch = text.match(/([\d.]+)\s*view/i);
        const favMatch = text.match(/([\d.]+)\s*favorite/i);
        const timeMatch = text.match(/(\d+[hj]\s*\d+[jm]|\d+[hj]|\d+[jm]|tunda|tamat|new\s*!!)/i);
        
        if (viewMatch) views = viewMatch[1];
        if (favMatch) favorite = favMatch[1];
        if (timeMatch) time = timeMatch[0];
        
        // Extract title - PERBAIKAN: lebih agresif menghapus views/favorites
        // Pattern di website: "title98.515 views6.273 favoritesnew !!" atau "title genre views favorites waktu"
        let cleanText = text;
        
        // Hapus semua angka yang diikuti "views" atau "favorites" (termasuk tanpa spasi)
        cleanText = cleanText.replace(/[\d.]+?\s*views?/gi, '');
        cleanText = cleanText.replace(/[\d.]+?\s*favorites?/gi, '');
        cleanText = cleanText.replace(/[\d.]+views?/gi, ''); // Tanpa spasi
        cleanText = cleanText.replace(/[\d.]+favorites?/gi, ''); // Tanpa spasi
        
        // Hapus waktu pattern (angka+h/j angka+m, tunda, tamat, new !!)
        cleanText = cleanText.replace(/\d+[hj]\s*\d+[jm]|\d+[hj]|\d+[jm]|tunda|tamat|new\s*!!/gi, '');
        
        // Hapus angka yang berdiri sendiri di akhir (biasanya views/favorites yang sudah dihapus)
        cleanText = cleanText.replace(/\s+[\d.]+\s*$/g, '');
        
        // Extract genre dulu (jika ada) - lebih lengkap
        const genrePattern = /^(Action|Comedy|Drama|Fantasy|Adventure|Seinen|Game|Historical|Romance|Sci-Fi|Slice of Life|Sports|Supernatural|Thriller|Horror|Mystery|Music|School|Shounen|Shoujo|Ecchi|Harem|Mecha|Military|Parody|Samurai|Space|Super Power|Vampire|Yaoi|Yuri|Comedy|Action|Drama)/i;
        const genreMatchResult = cleanText.match(genrePattern);
        if (genreMatchResult) {
          genre = genreMatchResult[1];
          cleanText = cleanText.replace(new RegExp(genre, 'gi'), '').trim();
        }
        
        // Hapus karakter aneh dan whitespace berlebih
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
        cleanText = cleanText.replace(/[^\w\s\-:()]/g, '').trim(); // Hapus karakter khusus kecuali yang penting
        
        // Title adalah sisa text setelah dibersihkan
        title = cleanText.trim();
        
        // Jika masih kosong atau terlalu pendek, coba extract dari awal sampai angka pertama
        if (!title || title.length < 3) {
          // Coba ambil dari awal sampai ketemu angka atau keyword
          const titleMatch = text.match(/^([A-Za-z\s\-:()]+?)(?:\s*[\d.]|view|favorite|new|tunda|tamat)/i);
          if (titleMatch) {
            title = titleMatch[1].trim();
          } else {
            // Ambil sampai angka pertama
            const parts = text.split(/\d/);
            title = parts[0].trim();
          }
        }
        
        // Final cleanup - hapus genre jika masih ada di title
        if (genre && title.toLowerCase().includes(genre.toLowerCase())) {
          title = title.replace(new RegExp(genre, 'gi'), '').trim();
        }
        
        // Extract genre (biasanya di awal)
        const genrePattern2 = /^(Action|Comedy|Drama|Fantasy|Adventure|Seinen|Game|Historical|Romance|Sci-Fi|Slice of Life|Sports|Supernatural|Thriller|Horror|Mystery|Music|School|Shounen|Shoujo|Ecchi|Harem|Mecha|Military|Parody|Samurai|Space|Super Power|Vampire|Yaoi|Yuri)/i;
        const genreMatchResult2 = text.match(genrePattern2);
        if (genreMatchResult2) {
          genre = genreMatchResult2[1];
          title = title.replace(genre, '').trim();
        }
        
        // Extract anime ID dari URL
        const idMatch = href.match(/\/anime\/(\d+)/);
        const animeId = idMatch ? idMatch[1] : null;
        
        if (animeId && title) {
          data.schedule.push({
            animeId: animeId,
            title: title.toLowerCase(),
            genre: genre.toLowerCase() || null,
            views: views || '0',
            favorite: favorite || '0',
            releaseTime: time.toLowerCase() || null,
            link: href,
            thumbnail: thumbnail || '',
            cover: cover || '',
            poster: poster || '',
            isNew: text.includes('new !!'),
            status: text.includes('tamat') ? 'finished' : text.includes('tunda') ? 'on hold' : 'ongoing'
          });
        }
      });
      
      return data;
    });
    
    await browser.close();
    
    // Deduplicate berdasarkan animeId
    const uniqueSchedule = [];
    const seenIds = new Set();
    scheduleData.schedule.forEach(anime => {
      if (!seenIds.has(anime.animeId)) {
        seenIds.add(anime.animeId);
        uniqueSchedule.push(anime);
      }
    });
    
    scheduleData.schedule = uniqueSchedule;
    
    // OPTIMASI: Fetch cover/poster dari API detail untuk anime yang tidak punya image (batch)
    // Tapi untuk menghindari terlalu lama, kita hanya fetch untuk beberapa anime pertama yang tidak punya image
    const animeWithoutImage = scheduleData.schedule.filter(a => !a.thumbnail && !a.cover && !a.poster).slice(0, 10);
    
    if (animeWithoutImage.length > 0) {
      console.log(`Fetching cover/poster untuk ${animeWithoutImage.length} anime yang tidak punya image...`);
      
      // Fetch secara parallel dengan Promise.all
      const imagePromises = animeWithoutImage.map(async (anime) => {
        try {
          const detailUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/movie/detail/${anime.animeId}`;
          const detailResponse = await axios.get(detailUrl, { timeout: 5000 });
          
          if (detailResponse.data && detailResponse.data.data && detailResponse.data.data.movie) {
            const movie = detailResponse.data.data.movie;
            return {
              animeId: anime.animeId,
              cover: movie.image_cover || '',
              poster: movie.image_poster || '',
              thumbnail: movie.image_cover || movie.image_poster || ''
            };
          }
        } catch (error) {
          console.log(`Failed to fetch image for anime ${anime.animeId}:`, error.message);
        }
        return null;
      });
      
      const imageResults = await Promise.all(imagePromises);
      
      // Update schedule dengan image yang ditemukan
      imageResults.forEach(result => {
        if (result) {
          const scheduleItem = scheduleData.schedule.find(a => a.animeId === result.animeId);
          if (scheduleItem) {
            scheduleItem.cover = result.cover;
            scheduleItem.poster = result.poster;
            scheduleItem.thumbnail = result.thumbnail;
          }
        }
      });
    }
    
    return scheduleData;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  }
  
  // Jika sampai sini berarti tidak ada browser automation yang tersedia
  throw new Error('Browser automation tidak tersedia. Schedule hanya tersedia dengan Playwright atau Puppeteer.');
}

// Ambil anime trending/popular dari homepage - menggunakan API internal untuk lebih cepat
async function getTrending() {
  try {
    console.log('Fetching trending anime...');
    // Gunakan API internal dengan sort=views untuk trending/popular
    const apiUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/explore/movie?page=0&sort=views&keyword=`;
    console.log(`Fetching from API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, { timeout: 15000 });
    const apiData = response.data;

    if (!apiData || apiData.error || !apiData.data || !apiData.data.movie) {
      console.log('No results found from API, falling back to scraping...');
      // Fallback ke scraping jika API gagal
      return await getTrendingFallback();
    }

    const results = apiData.data.movie.slice(0, 30).map(movie => ({
      animeId: movie.id,
      title: (movie.title || '').toLowerCase(),
      thumbnail: movie.image_poster || movie.image_cover || '',
      link: `${ANIMEINWEB_URL}/anime/${movie.id}`,
      views: movie.views || '0',
      favorites: movie.favorites || '0',
      year: movie.year || '',
      type: movie.type || ''
    }));

    console.log(`✅ Found ${results.length} trending anime`);
    return results;
  } catch (error) {
    console.error('Error fetching trending from API:', error.message);
    // Fallback ke scraping jika API error
    return await getTrendingFallback();
  }
}

// Fallback scraping jika API gagal
async function getTrendingFallback() {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(`${ANIMEINWEB_URL}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // Kurangi wait time
    
    const trendingData = await page.evaluate(() => {
      const data = [];
      
      // Cari section "Sedang Hangat" atau "Trending"
      const sections = document.querySelectorAll('section, div[class*="section"], div[class*="trending"], div[class*="popular"]');
      
      sections.forEach(section => {
        const heading = section.querySelector('h1, h2, h3, [class*="title"], [class*="heading"]');
        if (heading && (heading.textContent.includes('Hangat') || heading.textContent.includes('Trending') || heading.textContent.includes('Populer'))) {
          const links = section.querySelectorAll('a[href*="/anime/"]');
          links.forEach(link => {
            const href = link.href;
            const idMatch = href.match(/\/anime\/(\d+)/);
            if (idMatch) {
              const img = link.querySelector('img');
              data.push({
                animeId: idMatch[1],
                title: link.textContent.trim().toLowerCase() || (img ? img.alt.toLowerCase() : ''),
                thumbnail: img ? img.src : null,
                link: href
              });
            }
          });
        }
      });
      
      return data;
    });
    
    await browser.close();
    
    // Deduplicate
    const unique = [];
    const seen = new Set();
    trendingData.forEach(item => {
      if (!seen.has(item.animeId)) {
        seen.add(item.animeId);
        unique.push(item);
      }
    });
    
    return unique;
  } catch (error) {
    console.error('Error in fallback scraping:', error);
    throw error;
  }
}

// Ambil anime baru ditambahkan - menggunakan API internal untuk lebih cepat
async function getNew() {
  try {
    console.log('Fetching new anime...');
    // Gunakan API internal dengan sort=update untuk anime baru
    const apiUrl = `${ANIMEINWEB_URL}/api/proxy/3/2/explore/movie?page=0&sort=update&keyword=`;
    console.log(`Fetching from API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, { timeout: 15000 });
    const apiData = response.data;

    if (!apiData || apiData.error || !apiData.data || !apiData.data.movie) {
      console.log('No results found from API, falling back to scraping...');
      return await getNewFallback();
    }

    const results = apiData.data.movie.slice(0, 30).map(movie => ({
      animeId: movie.id,
      title: (movie.title || '').toLowerCase(),
      thumbnail: movie.image_poster || movie.image_cover || '',
      link: `${ANIMEINWEB_URL}/anime/${movie.id}`,
      views: movie.views || '0',
      favorites: movie.favorites || '0',
      year: movie.year || '',
      type: movie.type || ''
    }));

    console.log(`✅ Found ${results.length} new anime`);
    return results;
  } catch (error) {
    console.error('Error fetching new anime from API:', error.message);
    return await getNewFallback();
  }
}

// Fallback scraping jika API gagal
async function getNewFallback() {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(`${ANIMEINWEB_URL}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const newData = await page.evaluate(() => {
      const data = [];
      
      // Cari section "Baru ditambahkan" atau "New"
      const sections = document.querySelectorAll('section, div[class*="section"], div[class*="new"], div[class*="latest"]');
      
      sections.forEach(section => {
        const heading = section.querySelector('h1, h2, h3, [class*="title"], [class*="heading"]');
        if (heading && (heading.textContent.includes('Baru') || heading.textContent.includes('New') || heading.textContent.includes('Latest'))) {
          const links = section.querySelectorAll('a[href*="/anime/"]');
          links.forEach(link => {
            const href = link.href;
            const idMatch = href.match(/\/anime\/(\d+)/);
            if (idMatch) {
              const img = link.querySelector('img');
              data.push({
                animeId: idMatch[1],
                title: link.textContent.trim().toLowerCase() || (img ? img.alt.toLowerCase() : ''),
                thumbnail: img ? img.src : null,
                link: href
              });
            }
          });
        }
      });
      
      return data;
    });
    
    await browser.close();
    
    // Deduplicate
    const unique = [];
    const seen = new Set();
    newData.forEach(item => {
      if (!seen.has(item.animeId)) {
        seen.add(item.animeId);
        unique.push(item);
      }
    });
    
    return unique;
  } catch (error) {
    console.error('Error in fallback scraping:', error);
    throw error;
  }
}

// Ambil anime hari ini (dari schedule hari ini)
async function getToday() {
  try {
    const today = new Date();
    const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const todayName = dayNames[today.getDay()];
    
    const schedule = await getSchedule(todayName);
    return {
      day: todayName,
      date: today.toISOString().split('T')[0],
      anime: schedule.schedule
    };
  } catch (error) {
    console.error('Error fetching today anime:', error);
    throw error;
  }
}

module.exports = {
  getLatestEpisodes,
  getAnimeDetail,
  searchAnime,
  getAnimeList,
  getEpisodeVideo,
  getAnimeInWebData,
  getAnimeInWebEpisode,
  getSchedule,
  getTrending,
  getNew,
  getToday
};

