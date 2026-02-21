/**
 * cf-fetch.js — Cloudflare-Bypass HTTP Client
 * 
 * Menggunakan `undici` (Node.js built-in HTTP client) karena:
 * 1. Mendukung HTTP/2 → TLS fingerprint berbeda dari axios (lebih sulit dideteksi CF)
 * 2. Rotating User-Agent → menghindari pattern detection
 * 3. Cookie jar in-memory → session priming bypass Cloudflare
 * 4. Retry logic bawaan → lebih robust saat CF challenge
 */

const { fetch: undiciF, Agent, CookieAgent } = require('undici');
const https = require('https');

// === ROTATING USER AGENTS ===
// Pool User-Agent Chrome berbeda-beda untuk menghindari deteksi pola
const USER_AGENTS = [
  // Chrome Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.216 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.160 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36',
  // Chrome macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  // Chrome Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Firefox Windows (sebagai variasi)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
];

// === SEC-CH-UA berdasarkan User-Agent ===
function getSecChUa(userAgent) {
  if (userAgent.includes('Chrome/120')) {
    return '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
  } else if (userAgent.includes('Chrome/121')) {
    return '"Not_A Brand";v="8", "Chromium";v="121", "Google Chrome";v="121"';
  } else if (userAgent.includes('Chrome/122')) {
    return '"Not_A Brand";v="8", "Chromium";v="122", "Google Chrome";v="122"';
  } else if (userAgent.includes('Firefox')) {
    return null; // Firefox tidak punya sec-ch-ua
  }
  return '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
}

// === COOKIE JAR ===
let cookieJar = new Map(); // domain -> cookies string
let lastUserAgentIndex = 0;

function getNextUserAgent() {
  // Rotate: round-robin across all user agents
  lastUserAgentIndex = (lastUserAgentIndex + 1) % USER_AGENTS.length;
  return USER_AGENTS[lastUserAgentIndex];
}

function getCookiesForDomain(urlStr) {
  try {
    const url = new URL(urlStr);
    const domain = url.hostname;
    // Cari cookie yang cocok (exact domain atau parent domain)
    for (const [d, cookies] of cookieJar) {
      if (domain === d || domain.endsWith('.' + d)) {
        return cookies;
      }
    }
  } catch (e) {}
  return '';
}

function updateCookieJar(urlStr, setCookieHeaders) {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return;
  try {
    const url = new URL(urlStr);
    const domain = url.hostname;
    
    // Parse dan simpan cookies
    const newCookies = [];
    setCookieHeaders.forEach(raw => {
      const parts = raw.split(';');
      const cookiePart = (parts[0] || '').trim();
      if (cookiePart) newCookies.push(cookiePart);
    });
    
    if (newCookies.length > 0) {
      // Gabungkan dengan cookie yang ada
      const existing = cookieJar.get(domain) || '';
      const existingPairs = existing ? existing.split('; ').reduce((acc, pair) => {
        const [key] = pair.split('=');
        if (key) acc[key.trim()] = pair;
        return acc;
      }, {}) : {};
      
      newCookies.forEach(pair => {
        const [key] = pair.split('=');
        if (key) existingPairs[key.trim()] = pair;
      });
      
      const merged = Object.values(existingPairs).join('; ');
      cookieJar.set(domain, merged);
      console.log(`🍪 [cf-fetch] Cookies updated for ${domain}: ${newCookies.map(c => c.split('=')[0]).join(', ')}`);
    }
  } catch (e) {
    console.log('[cf-fetch] Cookie update error:', e.message);
  }
}

// === UNDICI AGENT (support HTTP/2 & PROXY) ===
let undiciAgent = null;
function getAgent() {
  if (!undiciAgent) {
    if (process.env.PROXY_URL) {
      console.log('🌐 [cf-fetch] Routing via PROXY:', process.env.PROXY_URL.replace(/:[^:]+@/, ':***@'));
      const { ProxyAgent } = require('undici');
      undiciAgent = new ProxyAgent({
        uri: process.env.PROXY_URL,
        requestTls: { rejectUnauthorized: false },
        allowH2: true, // Attempt HTTP/2 over proxy if supported
        keepAliveTimeout: 10000,
      });
    } else {
      undiciAgent = new Agent({
        connect: {
          rejectUnauthorized: false, // Bypass self-signed SSL
        },
        allowH2: true, // Enable HTTP/2 - TLS fingerprint berbeda dari axios!
        keepAliveTimeout: 10000,
        keepAliveMaxTimeout: 30000,
      });
    }
  }
  return undiciAgent;
}

/**
 * Fetch URL dengan bypass Cloudflare menggunakan undici (HTTP/2)
 * @param {string} url - URL yang akan di-fetch
 * @param {Object} options - Options tambahan
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.extraHeaders={}] - Headers tambahan
 * @param {number} [options.timeout=20000] - Timeout dalam ms
 * @param {boolean} [options.returnText=false] - Return text instead of parsed JSON
 * @returns {Promise<any>} Parsed JSON atau text
 */
async function cfFetch(url, options = {}) {
  const {
    method = 'GET',
    extraHeaders = {},
    timeout = 20000,
    returnText = false,
    returnBuffer = false,
  } = options;

  const userAgent = getNextUserAgent();
  const secChUa = getSecChUa(userAgent);
  const isFirefox = userAgent.includes('Firefox');
  const existingCookies = getCookiesForDomain(url);

  // Build browser-like headers
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    ...(!isFirefox && secChUa ? {
      'Sec-Ch-Ua': secChUa,
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Priority': 'u=1, i',
    } : {}),
    ...(existingCookies ? { 'Cookie': existingCookies } : {}),
    ...extraHeaders,
  };

  // Extract base URL untuk Referer & Origin
  try {
    const urlObj = new URL(url);
    headers['Referer'] = urlObj.origin + '/';
    headers['Origin'] = urlObj.origin;
  } catch (e) {}

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`🌐 [cf-fetch] ${method} ${url.substring(0, 80)}... (UA: ${userAgent.substring(13, 50)})`);
    
    const response = await undiciF(url, {
      method,
      headers,
      dispatcher: getAgent(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Update cookie dari response
    const setCookieHeader = response.headers.getSetCookie ? 
      response.headers.getSetCookie() : 
      (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);
    
    if (setCookieHeader && setCookieHeader.length > 0) {
      updateCookieJar(url, setCookieHeader);
    }

    if (!response.ok && response.status !== 200) {
      const errText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status} for ${url.split('?')[0]}: ${errText.substring(0, 100)}`);
    }

    if (returnBuffer) {
      return Buffer.from(await response.arrayBuffer());
    }

    if (returnText) {
      return await response.text();
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      // Kalau bukan JSON (mungkin HTML Cloudflare challenge)
      if (text.includes('cloudflare') || text.includes('Just a moment') || text.includes('cf-browser-verification')) {
        throw new Error(`Cloudflare challenge detected for ${url.split('?')[0]}`);
      }
      if (returnText) return text;
      throw new Error(`Non-JSON response from ${url.split('?')[0]}: ${text.substring(0, 100)}`);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout (${timeout}ms) for ${url.split('?')[0]}`);
    }
    throw err;
  }
}

/**
 * Fetch dengan retry otomatis
 * @param {string} url
 * @param {Object} options
 * @param {number} [maxRetries=2]
 */
async function cfFetchWithRetry(url, options = {}, maxRetries = 2) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await cfFetch(url, options);
      return result;
    } catch (err) {
      lastError = err;
      const isCloudflare = err.message.includes('403') || 
                           err.message.includes('Cloudflare') || 
                           err.message.includes('520') ||
                           err.message.includes('521') ||
                           err.message.includes('522');
      
      console.log(`⚠️  [cf-fetch] Attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      
      if (attempt < maxRetries) {
        // Delay sebelum retry (lebih lama jika CF block)
        const delay = isCloudflare ? 2000 * attempt : 1000;
        console.log(`⏳ [cf-fetch] Waiting ${delay}ms before retry...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Reset cookie jar (berguna untuk force re-prime session)
 */
function resetCookies() {
  cookieJar.clear();
  console.log('🗑️  [cf-fetch] Cookie jar cleared');
}

/**
 * Get current cookies untuk domain tertentu
 */
function getCookies(domain) {
  return cookieJar.get(domain) || '';
}

module.exports = {
  cfFetch,
  cfFetchWithRetry,
  resetCookies,
  getCookies,
  updateCookieJar,
};
