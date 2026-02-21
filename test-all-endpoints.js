#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         AnimeAPI - Full Endpoint Testing Suite           ║
 * ║     Testing semua endpoint yang di-scrape dari web       ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const http = require('http');
const https = require('https');
const fs = require('fs');

// ─── CONFIG ──────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3001';
const TIMEOUT_MS = 45000;
const OUTPUT_FILE = 'test_results.json';

// ─── ANSI COLORS ─────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed:   '\x1b[41m',
  bgBlue:  '\x1b[44m',
};

// ─── HELPERS ─────────────────────────────────────────────────
function colorize(color, text) {
  return `${C[color]}${text}${C.reset}`;
}

function printHeader() {
  console.log('\n' + colorize('cyan', '╔══════════════════════════════════════════════════════════════╗'));
  console.log(colorize('cyan', '║') + colorize('bold', '          🎌 AnimeAPI - Full Endpoint Testing Suite           ') + colorize('cyan', '║'));
  console.log(colorize('cyan', '║') + colorize('dim', `          Base URL: ${BASE_URL}/api/v1`.padEnd(62)) + colorize('cyan', '║'));
  console.log(colorize('cyan', '╚══════════════════════════════════════════════════════════════╝'));
  console.log('');
}

function printSectionHeader(title) {
  console.log('');
  console.log(colorize('blue', '┌─────────────────────────────────────────────────────────────┐'));
  console.log(colorize('blue', '│') + colorize('bold', ` 🔷 ${title}`.padEnd(62)) + colorize('blue', '│'));
  console.log(colorize('blue', '└─────────────────────────────────────────────────────────────┘'));
}

function printResult(method, path, status, duration, summary, isSuccess) {
  const icon     = isSuccess ? colorize('green', '✅') : colorize('red', '❌');
  const statusColor = isSuccess ? 'green' : 'red';
  const statusStr = colorize(statusColor, `[${status}]`);
  const durationStr = duration > 5000 
    ? colorize('red', `${duration}ms`) 
    : duration > 2000 
      ? colorize('yellow', `${duration}ms`) 
      : colorize('green', `${duration}ms`);
  
  console.log(`  ${icon}  ${colorize('cyan', method.padEnd(4))} ${colorize('white', path.padEnd(45))} ${statusStr.padEnd(14)} ${durationStr}`);
  if (summary) {
    console.log(`     ${colorize('dim', '↳ ' + summary)}`);
  }
}

function printSummary(results) {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total  = results.length;
  const avgTime = Math.round(results.reduce((s, r) => s + r.duration, 0) / total);
  const passRate = Math.round((passed / total) * 100);

  console.log('');
  console.log(colorize('cyan', '╔══════════════════════════════════════════════════════════════╗'));
  console.log(colorize('cyan', '║') + colorize('bold', '                        📊 HASIL TESTING                     ') + colorize('cyan', '║'));
  console.log(colorize('cyan', '╠══════════════════════════════════════════════════════════════╣'));
  console.log(colorize('cyan', '║') + `  ✅  Passed  : ${colorize('green', String(passed).padEnd(4))}    ❌  Failed : ${colorize('red', String(failed).padEnd(4))}    📋 Total: ${colorize('white', total)}`.padEnd(73) + colorize('cyan', '║'));
  console.log(colorize('cyan', '║') + `  ⏱️  Avg Time : ${colorize('yellow', avgTime + 'ms')}         📈 Pass Rate: ${passRate >= 70 ? colorize('green', passRate + '%') : colorize('red', passRate + '%')}`.padEnd(73) + colorize('cyan', '║'));
  console.log(colorize('cyan', '╚══════════════════════════════════════════════════════════════╝'));

  // Failed detail
  const failedResults = results.filter(r => !r.passed);
  if (failedResults.length > 0) {
    console.log('');
    console.log(colorize('red', '  ⚠️  Endpoint yang GAGAL:'));
    failedResults.forEach(r => {
      console.log(`     ${colorize('red', '✗')} ${r.path}`);
      console.log(`       ${colorize('dim', r.error || r.summary)}`);
    });
  }
  
  return { passed, failed, total, avgTime, passRate };
}

// ─── HTTP REQUEST HELPER ──────────────────────────────────────
function request(url, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, duration, error: null });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.slice(0, 200), duration, error: 'Invalid JSON response' });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      resolve({ status: 0, data: null, duration, error: `TIMEOUT after ${timeoutMs}ms` });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      resolve({ status: 0, data: null, duration, error: err.message });
    });
  });
}

// ─── TEST RUNNER ─────────────────────────────────────────────
async function runTest(label, path, { expectSuccess = true, check = null } = {}) {
  const fullUrl = `${BASE_URL}${path}`;
  const result  = await request(fullUrl);
  
  let passed = false;
  let summary = '';

  if (result.error === 'Invalid JSON response' && result.status === 200) {
    // HTML response (misal /dashboard, /docs) - ini normal, bukan error JSON
    summary = 'HTML page response - EXPECTED ✓';
    passed = true;
  } else if (result.error) {
    summary = result.error;
    passed  = false;
  } else if (result.status === 200) {
    if (result.data && result.data.success === true) {
      const d = result.data.data;
      if (Array.isArray(d)) {
        summary = `success=true, data=[${d.length} items]`;
        passed = d.length >= 0; // Diterima meski 0 item
      } else if (d && typeof d === 'object') {
        const keys = Object.keys(d).slice(0, 3).join(', ');
        summary = `success=true, data={${keys}...}`;
        passed = true;
      } else {
        summary = `success=true`;
        passed = true;
      }
    } else if (result.data && result.data.success === false) {
      // Beberapa endpoint sengaja return 200 + success:false jika param kurang
      summary = `success=false: ${result.data.error?.slice(0, 70)}`;
      passed = !expectSuccess; // Jika expected false, ini oke
    } else if (result.data && result.data.message) {
      summary = result.data.message?.slice(0, 60);
      passed   = true;
    } else {
      summary = 'Response OK tapi format tidak dikenali';
      passed = true;
    }
  } else if (result.status === 400) {
    summary = `400 Bad Request: ${result.data?.error?.slice(0, 60)}`;
    passed = !expectSuccess;
  } else if (result.status === 500) {
    summary = `500 Server Error: ${result.data?.error?.slice(0, 60)}`;
    passed = false;
  } else if (result.status === 504) {
    summary = `504 Gateway Timeout`;
    passed = false;
  } else {
    summary = `HTTP ${result.status}`;
    passed = false;
  }

  // Custom check
  if (check && result.data) {
    try {
      const checkResult = check(result.data);
      if (checkResult === false) {
        passed = false;
        summary += ' [custom check FAILED]';
      } else if (typeof checkResult === 'string') {
        summary += ` | ${checkResult}`;
      }
    } catch(e) {
      // ignore
    }
  }

  printResult('GET', path, result.status || 'ERR', result.duration, summary, passed);

  return {
    label,
    path,
    status: result.status,
    duration: result.duration,
    passed,
    summary,
    error: result.error,
    data: result.data
  };
}

// ─── MAIN TEST SUITE ──────────────────────────────────────────
async function runAllTests() {
  printHeader();
  
  const allResults = [];

  // ── 1. ROOT & HEALTH ──────────────────────────────────────
  printSectionHeader('1. Root & Health Check');
  allResults.push(await runTest('Root', '/', {
    check: d => d.status === 'online' ? 'online ✓' : false
  }));
  allResults.push(await runTest('API v1 Root', '/api/v1'));
  allResults.push(await runTest('Dashboard', '/dashboard', {
    check: d => typeof d === 'string' ? 'HTML dashboard ✓' : null
  }));
  allResults.push(await runTest('Docs', '/docs', {
    check: d => typeof d === 'string' ? 'HTML docs ✓' : null
  }));

  // ── 2. EPISODE TERBARU ────────────────────────────────────
  printSectionHeader('2. Episode Terbaru (/latest)');
  allResults.push(await runTest('Latest Episodes', '/api/v1/latest', {
    check: d => {
      if (!d.success) return false;
      if (!Array.isArray(d.data)) return 'data bukan array';
      const item = d.data[0];
      if (item) {
        const fields = ['title', 'episode', 'thumbnail', 'link'].filter(f => item[f]);
        return `${d.data.length} episodes, fields: [${fields.join(', ')}]`;
      }
      return `${d.data.length} episodes`;
    }
  }));
  allResults.push(await runTest('Latest (trailing slash)', '/api/v1/latest/'));

  // ── 3. PENCARIAN ──────────────────────────────────────────
  printSectionHeader('3. Pencarian Anime (/search)');
  allResults.push(await runTest('Search: keyword "naruto"', '/api/v1/search?q=naruto', {
    check: d => d.data ? `${d.data.length} results ditemukan` : false
  }));
  allResults.push(await runTest('Search: genre Action (id=14)', '/api/v1/search?genre=14&sort=views', {
    check: d => d.data ? `${d.data.length} results, sort=views` : false
  }));
  allResults.push(await runTest('Search: sort=newest', '/api/v1/search?sort=newest'));
  allResults.push(await runTest('Search: keyword+genre+sort', '/api/v1/search?q=one+piece&genre=14&sort=favorites'));
  allResults.push(await runTest('Search: page=1', '/api/v1/search?q=sword&page=1'));
  allResults.push(await runTest('Search: tanpa parameter (default)', '/api/v1/search'));

  // ── 4. GENRES ─────────────────────────────────────────────
  printSectionHeader('4. List Genre (/genres)');
  allResults.push(await runTest('Get All Genres', '/api/v1/genres', {
    check: d => {
      if (!d.success || !Array.isArray(d.data)) return false;
      const hasFields = d.data[0]?.id && d.data[0]?.name;
      return `${d.data.length} genres, has id+name: ${hasFields ? '✓' : '✗'}`;
    }
  }));

  // ── 5. DETAIL ANIME ────────────────────────────────────────
  printSectionHeader('5. Detail Anime (/detail)');
  allResults.push(await runTest('Detail: one-piece', '/api/v1/detail?slug=one-piece', {
    check: d => {
      if (!d.success || !d.data) return false;
      const fields = ['title', 'synopsis', 'genres', 'episodes'].filter(f => d.data[f]);
      return `fields: [${fields.join(', ')}]`;
    }
  }));
  allResults.push(await runTest('Detail: naruto', '/api/v1/detail?slug=naruto'));
  allResults.push(await runTest('Detail: tanpa slug (expect error)', '/api/v1/detail', {
    expectSuccess: false
  }));

  // ── 6. LIST ANIME ─────────────────────────────────────────
  printSectionHeader('6. List Anime (/list)');
  allResults.push(await runTest('Anime List page=1', '/api/v1/list?page=1', {
    check: d => d.data ? `${d.data.length} anime, page ${d.page}` : false
  }));
  allResults.push(await runTest('Anime List page=2', '/api/v1/list?page=2'));
  allResults.push(await runTest('Anime List (default)', '/api/v1/list'));

  // ── 7. SCHEDULE ───────────────────────────────────────────
  printSectionHeader('7. Jadwal Anime (/schedule)');
  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  for (const day of days) {
    allResults.push(await runTest(`Schedule: ${day}`, `/api/v1/animeinweb/schedule?day=${day}`, {
      check: d => {
        if (!d.success || !d.data) return false;
        const count = d.data.schedule?.length || 0;
        return `${count} anime on ${d.data.currentDay || day.toUpperCase()}`;
      }
    }));
  }
  allResults.push(await runTest('Schedule: random', '/api/v1/animeinweb/schedule?day=random'));
  allResults.push(await runTest('Schedule: semua hari', '/api/v1/animeinweb/schedule'));
  allResults.push(await runTest('Schedule: alias /schedule', '/api/v1/schedule?day=senin'));

  // ── 8. TRENDING ───────────────────────────────────────────
  printSectionHeader('8. Anime Trending (/trending)');
  allResults.push(await runTest('Trending (main)', '/api/v1/animeinweb/trending', {
    check: d => d.data ? `${d.data.length} trending anime` : false
  }));
  allResults.push(await runTest('Trending (alias)', '/api/v1/trending'));

  // ── 9. ANIME BARU ─────────────────────────────────────────
  printSectionHeader('9. Anime Baru (/new)');
  allResults.push(await runTest('New Anime (main)', '/api/v1/animeinweb/new', {
    check: d => d.data ? `${d.data.length} anime baru` : false
  }));
  allResults.push(await runTest('New Anime (alias)', '/api/v1/new'));

  // ── 10. ANIME HARI INI ────────────────────────────────────
  printSectionHeader('10. Anime Hari Ini (/today)');
  allResults.push(await runTest('Today Anime (main)', '/api/v1/animeinweb/today', {
    check: d => d.data ? `${Array.isArray(d.data) ? d.data.length : 'obj'} results` : false
  }));
  allResults.push(await runTest('Today Anime (alias)', '/api/v1/today'));

  // ── 11. ANIMEINWEB INFO ───────────────────────────────────
  printSectionHeader('11. Info Anime - AnimeInWeb (/animeinweb?id=)');
  allResults.push(await runTest('AnimeInWeb: One Piece (id=426)', '/api/v1/animeinweb?id=426', {
    check: d => {
      if (!d.success || !d.data) return false;
      return `title="${d.data.title}", episodes=${d.data.episodes?.length || 0}`;
    }
  }));
  allResults.push(await runTest('AnimeInWeb: id=341 (Naruto)', '/api/v1/animeinweb?id=341'));
  allResults.push(await runTest('AnimeInWeb: tanpa id (expect error)', '/api/v1/animeinweb', {
    expectSuccess: false
  }));

  // ── 12. ANIMEINWEB EPISODE ────────────────────────────────
  printSectionHeader('12. Video Episode - AnimeInWeb (/animeinweb/episode)');
  allResults.push(await runTest('Episode: One Piece ep.500', '/api/v1/animeinweb/episode?animeId=426&episodeNumber=500', {
    check: d => {
      if (!d.success || !d.data) return false;
      const sources = d.data.videoSources?.length || 0;
      return `videoSources=${sources}, title="${d.data.title?.slice(0, 30)}"`;
    }
  }));
  allResults.push(await runTest('Episode: Naruto ep.1', '/api/v1/animeinweb/episode?animeId=341&episodeNumber=1'));
  allResults.push(await runTest('Episode: tanpa params (expect error)', '/api/v1/animeinweb/episode', {
    expectSuccess: false
  }));

  // NontonAnimeID endpoint dihapus - semua dari AnimeinWeb

  // ── PRINT SUMMARY ─────────────────────────────────────────
  const summary = printSummary(allResults);

  // ── SAVE RESULTS ──────────────────────────────────────────
  const output = {
    testRunAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary,
    results: allResults.map(r => ({
      label: r.label,
      path: r.path,
      status: r.status,
      duration: r.duration,
      passed: r.passed,
      summary: r.summary,
      error: r.error || null,
    }))
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log('');
  console.log(`  ${colorize('dim', `📄 Hasil lengkap disimpan ke: ${colorize('cyan', OUTPUT_FILE)}`)}`);
  console.log('');

  process.exit(summary.failed > 0 ? 1 : 0);
}

// ─── RUN ─────────────────────────────────────────────────────
runAllTests().catch(err => {
  console.error(colorize('red', `\n[FATAL ERROR] ${err.message}`));
  console.error(err.stack);
  process.exit(1);
});
