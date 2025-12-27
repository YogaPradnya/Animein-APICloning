// Helper functions untuk scraper

// Extract episode number dari berbagai format
function extractEpisodeNumber(text, link) {
  if (!text && !link) return null;
  
  const sources = [text || '', link || ''];
  
  for (const source of sources) {
    // Pattern: "Episode 1", "EP 1", "Ep.1", "E01", "episode-1", "26 - tamat", dll
    // Juga pattern dari URL: /watari-kun-episode-26/
    const patterns = [
      /episode[-\s]*(\d+)/i, // episode-26 atau episode 26
      /ep\s*[:\-]?\s*(\d+)/i,
      /e(\d+)/i,
      /(\d+)\s*-\s*tamat/i,
      /(\d+)\s*episode/i,
      /^(\d+)\s*-/i, // "26 - tamat"
      /-(\d+)$/i, // "episode-1"
      /(\d+)$/i // angka di akhir
    ];
    
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (num > 0 && num <= 10000) { // Valid episode number
          return num; // Return number saja, bukan string "episode X"
        }
      }
    }
  }
  
  return null;
}

// Generate episode link sesuai format website
function generateEpisodeLink(animeSlug, episodeNumber, baseUrl) {
  if (!animeSlug || !episodeNumber) return null;
  
  // Format: /watari-kun-no-xx-ga-houkai-sunzen-episode-26/
  const slug = animeSlug.toLowerCase().replace(/\s+/g, '-');
  return `${baseUrl}/${slug}-episode-${episodeNumber}/`;
}

// Extract anime slug dari link
function extractAnimeSlug(link) {
  if (!link) return null;
  
  // Pattern 1: /anime/watari-kun-no-xx-ga-houkai-sunzen/
  let match = link.match(/\/anime\/([^\/]+)/);
  if (match) {
    return match[1];
  }
  
  // Pattern 2: /watari-kun-no-xx-ga-houkai-sunzen-episode-26/
  match = link.match(/\/([^\/]+)-episode-\d+/);
  if (match) {
    return match[1];
  }
  
  // Pattern 3: /watari-kun-no-xx-ga-houkai-sunzen/
  match = link.match(/\/([^\/]+)\/?$/);
  if (match && !match[1].includes('episode')) {
    return match[1];
  }
  
  return null;
}

// Extract anime title dari link atau text (clean title)
function extractAnimeTitle(text, link) {
  let title = '';
  
  // Extract dari URL: /anime/nama-anime/episode-1
  if (link) {
    const urlMatch = link.match(/\/anime\/([^\/]+)/);
    if (urlMatch) {
      title = urlMatch[1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize each word
        .trim();
    }
  }
  
  // Extract dari text, hilangkan episode number dan "tamat"
  if (text) {
    let cleanText = text
      .replace(/episode\s*\d+/i, '')
      .replace(/\d+\s*-\s*tamat/i, '')
      .replace(/\d+\s*episode/i, '')
      .replace(/ep\s*\d+/i, '')
      .replace(/^\d+\s*-\s*/, '')
      .replace(/\s*-\s*tamat\s*$/i, '')
      .replace(/tamat/gi, '')
      .trim();
    
    if (cleanText.length > 2) {
      title = cleanText;
    }
  }
  
  return title || text || '';
}

// Normalize URL
function normalizeUrl(url, baseUrl) {
  if (!url) return null;
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  if (url.startsWith('/')) {
    return baseUrl + url;
  }
  
  return baseUrl + '/' + url;
}

// Extract thumbnail dengan berbagai cara
function extractThumbnail($elem, baseUrl) {
  // Cari dari img tag dengan berbagai attribute
  const imgSelectors = [
    'img[src]',
    'img[data-src]',
    'img[data-lazy-src]',
    'img[data-original]',
    'img[loading]'
  ];
  
  for (const selector of imgSelectors) {
    const img = $elem.find(selector).first();
    if (img.length) {
      const src = img.attr('src') || 
                  img.attr('data-src') || 
                  img.attr('data-lazy-src') ||
                  img.attr('data-original');
      if (src) {
        return normalizeUrl(src, baseUrl);
      }
    }
  }
  
  // Cari dari background image style
  const bgElements = $elem.find('[style*="background"], [style*="url"]');
  for (let i = 0; i < bgElements.length; i++) {
    const style = $(bgElements[i]).attr('style') || '';
    const bgMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (bgMatch && bgMatch[1]) {
      return normalizeUrl(bgMatch[1], baseUrl);
    }
  }
  
  // Cari dari parent elements
  const parent = $elem.parent();
  if (parent.length) {
    const parentImg = parent.find('img').first();
    if (parentImg.length) {
      const src = parentImg.attr('src') || parentImg.attr('data-src');
      if (src) {
        return normalizeUrl(src, baseUrl);
      }
    }
  }
  
  return null;
}

// Extract resolution dari text atau element
function extractResolution($elem) {
  // Cari dari class atau text
  const resolution = $elem.find('.resolution, [class*="resolution"], [class*="quality"]').text().trim();
  if (resolution) {
    const match = resolution.match(/(\d+p|1080p|720p|480p|360p|hd|sd|full hd)/i);
    if (match) return match[0].toLowerCase();
  }
  
  // Cari dari text content
  const textContent = $elem.text();
  const resMatch = textContent.match(/(\d+p|1080p|720p|480p|360p|hd|sd|full hd)/i);
  if (resMatch) return resMatch[0].toLowerCase();
  
  return null;
}

// Extract date dari element
function extractDate($elem) {
  // Cari dari time tag atau date class
  let date = $elem.find('time[datetime]').attr('datetime') ||
             $elem.find('[datetime]').attr('datetime') ||
             $elem.find('.date, [class*="date"]').text().trim();
  
  if (date) {
    // Normalize date format
    date = date.replace(/\s+/g, ' ').trim();
    return date.toLowerCase();
  }
  
  // Cari dari text content
  const textContent = $elem.text();
  const dateMatch = textContent.match(/(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}|\d{1,2}\s+\w+\s+\d{4})/);
  if (dateMatch) {
    return dateMatch[0].toLowerCase();
  }
  
  return null;
}

module.exports = {
  extractEpisodeNumber,
  extractAnimeTitle,
  normalizeUrl,
  extractThumbnail,
  extractResolution,
  extractDate,
  generateEpisodeLink,
  extractAnimeSlug
};

