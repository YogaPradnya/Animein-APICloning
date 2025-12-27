const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const NodeCache = require('node-cache');
const scraper = require('./api/scraper');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory cache (TTL: 1 jam default)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Monitoring Stats
const stats = {
  totalRequests: 0,
  endpoints: {},
  statusCodes: {},
  avgResponseTime: 0,
  totalResponseTime: 0,
  startTime: new Date(),
  lastRequests: []
};

// Middleware: Compression
app.use(compression());

// Middleware: Logging (Morgan)
app.use(morgan('dev'));

// Middleware: CORS dan JSON
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());

// Middleware: Monitoring
app.use((req, res, next) => {
  const start = Date.now();
  stats.totalRequests++;
  
  const path = req.path;
  stats.endpoints[path] = (stats.endpoints[path] || 0) + 1;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    stats.statusCodes[status] = (stats.statusCodes[status] || 0) + 1;
    stats.totalResponseTime += duration;
    stats.avgResponseTime = stats.totalResponseTime / stats.totalRequests;

    // Simpan 20 request terakhir
    stats.lastRequests.unshift({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: path,
      status: status,
      duration: duration,
      ip: req.ip
    });
    if (stats.lastRequests.length > 20) stats.lastRequests.pop();
  });
  
  next();
});

// Helper: Cache Middleware
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = cache.get(key);
    
    if (cachedBody) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedBody);
    } else {
      res.sendResponse = res.json;
      res.json = (body) => {
        if (res.statusCode === 200 && body && body.success) {
          cache.set(key, body, duration);
        }
        res.setHeader('X-Cache', 'MISS');
        res.sendResponse(body);
      };
      next();
    }
  };
};

// Helper function untuk handle endpoint dengan atau tanpa trailing slash + timeout
const handleEndpoint = (handler, timeoutMs = 30000) => {
  return async (req, res) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: `Request timeout setelah ${timeoutMs}ms. Endpoint ini mungkin memerlukan waktu lebih lama untuk scraping.`
        });
      }
    }, timeoutMs);
    
    try {
      const result = await handler(req, res);
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  };
};

// Dashboard Page
app.get('/dashboard', (req, res) => {
  const uptime = Math.floor((new Date() - stats.startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AnimeAPI Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0b0e14; color: #e2e8f0; }
            .card { background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
            .status-ok { color: #10b981; }
            .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        </style>
        <script>
            setTimeout(() => location.reload(), 10000);
        </script>
    </head>
    <body class="p-4 md:p-8">
        <div class="max-w-7xl mx-auto">
            <header class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AnimeAPI Monitor</h1>
                    <p class="text-slate-400">Monitoring real-time request dan performa server</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="px-4 py-2 card rounded-xl flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full bg-green-500 pulse"></div>
                        <span class="font-semibold text-green-500">SERVER ONLINE</span>
                    </div>
                    <a href="/docs" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
                        <i class="fas fa-book mr-2"></i>API DOCS
                    </a>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="card p-6 rounded-2xl">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 bg-blue-500/10 rounded-xl"><i class="fas fa-exchange-alt text-blue-400 text-xl"></i></div>
                        <span class="text-xs text-slate-500">Total Requests</span>
                    </div>
                    <h3 class="text-3xl font-bold">${stats.totalRequests.toLocaleString()}</h3>
                    <p class="text-sm text-slate-400 mt-1">Sejak server aktif</p>
                </div>
                <div class="card p-6 rounded-2xl">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 bg-purple-500/10 rounded-xl"><i class="fas fa-bolt text-purple-400 text-xl"></i></div>
                        <span class="text-xs text-slate-500">Avg. Latency</span>
                    </div>
                    <h3 class="text-3xl font-bold">${Math.round(stats.avgResponseTime)}ms</h3>
                    <p class="text-sm text-slate-400 mt-1">Response time rata-rata</p>
                </div>
                <div class="card p-6 rounded-2xl">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 bg-orange-500/10 rounded-xl"><i class="fas fa-clock text-orange-400 text-xl"></i></div>
                        <span class="text-xs text-slate-500">Uptime</span>
                    </div>
                    <h3 class="text-3xl font-bold">${hours}h ${minutes}m</h3>
                    <p class="text-sm text-slate-400 mt-1">Aktif selama ${uptime} detik</p>
                </div>
                <div class="card p-6 rounded-2xl">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 bg-green-500/10 rounded-xl"><i class="fas fa-hdd text-green-400 text-xl"></i></div>
                        <span class="text-xs text-slate-500">Cache Keys</span>
                    </div>
                    <h3 class="text-3xl font-bold">${cache.keys().length}</h3>
                    <p class="text-sm text-slate-400 mt-1">Data tersimpan di memori</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 card rounded-2xl overflow-hidden">
                    <div class="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 class="text-xl font-bold"><i class="fas fa-history mr-2 text-blue-400"></i>Request Terbaru</h2>
                        <span class="text-xs text-slate-500">Auto-refresh setiap 10 detik</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-white/5 text-slate-400 text-xs uppercase">
                                <tr>
                                    <th class="px-6 py-4 font-semibold">Waktu</th>
                                    <th class="px-6 py-4 font-semibold">Method</th>
                                    <th class="px-6 py-4 font-semibold">Endpoint</th>
                                    <th class="px-6 py-4 font-semibold">Status</th>
                                    <th class="px-6 py-4 font-semibold">Latency</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                ${stats.lastRequests.map(r => `
                                    <tr class="hover:bg-white/5 transition-colors">
                                        <td class="px-6 py-4 text-sm text-slate-400">${r.timestamp.split('T')[1].split('.')[0]}</td>
                                        <td class="px-6 py-4">
                                            <span class="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded">${r.method}</span>
                                        </td>
                                        <td class="px-6 py-4 text-sm font-medium text-slate-200">${r.path}</td>
                                        <td class="px-6 py-4">
                                            <span class="px-2 py-1 ${r.status < 400 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} text-[10px] font-bold rounded">${r.status}</span>
                                        </td>
                                        <td class="px-6 py-4 text-sm font-mono ${r.duration > 1000 ? 'text-orange-400' : 'text-slate-400'}">${r.duration}ms</td>
                                    </tr>
                                `).join('')}
                                ${stats.lastRequests.length === 0 ? '<tr><td colspan="5" class="px-6 py-12 text-center text-slate-500 italic">Belum ada request masuk...</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="space-y-8">
                    <div class="card p-6 rounded-2xl">
                        <h2 class="text-xl font-bold mb-6"><i class="fas fa-chart-pie mr-2 text-purple-400"></i>Top Endpoints</h2>
                        <div class="space-y-4">
                            ${Object.entries(stats.endpoints).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([path, count]) => `
                                <div>
                                    <div class="flex justify-between text-sm mb-2">
                                        <span class="text-slate-300 font-medium truncate w-40">${path}</span>
                                        <span class="text-slate-500">${count} reqs</span>
                                    </div>
                                    <div class="w-full bg-white/5 rounded-full h-2">
                                        <div class="bg-blue-500 h-2 rounded-full" style="width: ${Math.min((count / stats.totalRequests) * 100, 100)}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="card p-6 rounded-2xl">
                        <h2 class="text-xl font-bold mb-6"><i class="fas fa-server mr-2 text-green-400"></i>Server Info</h2>
                        <div class="space-y-4 text-sm">
                            <div class="flex justify-between">
                                <span class="text-slate-500">Node Version</span>
                                <span class="text-slate-300">${process.version}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Platform</span>
                                <span class="text-slate-300 uppercase">${process.platform}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Memory Usage</span>
                                <span class="text-slate-300">${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Compression</span>
                                <span class="text-green-500">ENABLED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer class="mt-12 pt-8 border-t border-white/5 text-center text-slate-500 text-sm">
                <p>&copy; 2025 AnimeAPI Monitor &bull; Made with <i class="fas fa-heart text-red-500/50"></i> for Raisyahah</p>
            </footer>
        </div>
    </body>
    </html>
  `);
});

// Documentation Page (Modern UI)
app.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AnimeAPI Documentation</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0b0e14; color: #e2e8f0; scroll-behavior: smooth; }
            .sidebar { background: #0f172a; border-right: 1px solid rgba(255,255,255,0.05); }
            .endpoint-card { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; overflow: hidden; }
            code { background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 0.3rem; font-family: monospace; color: #38bdf8; }
            pre { background: #0f172a; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; border: 1px solid rgba(255,255,255,0.05); }
            .method-get { background: #0ea5e9; color: white; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-weight: 800; font-size: 0.75rem; }
            .api-url { color: #94a3b8; font-size: 0.9rem; }
            .tag { padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
        </style>
    </head>
    <body class="flex flex-col md:flex-row min-h-screen">
        <!-- Sidebar -->
        <aside class="w-full md:w-72 sidebar p-6 md:fixed md:h-full overflow-y-auto z-50">
            <div class="flex items-center gap-3 mb-10">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                    <i class="fas fa-play text-white"></i>
                </div>
                <h1 class="text-xl font-extrabold tracking-tight">AnimeAPI</h1>
            </div>
            
            <nav class="space-y-2">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Pengenalan</p>
                <a href="#intro" class="block px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 font-medium">Memulai</a>
                <a href="#base-url" class="block px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all">Base URL</a>
                
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-8 mb-4">Endpoints</p>
                <div class="space-y-1">
                    <a href="#latest" class="block px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all text-sm">Episode Terbaru</a>
                    <a href="#search" class="block px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all text-sm">Pencarian</a>
                    <a href="#detail" class="block px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all text-sm">Detail Anime</a>
                    <a href="#schedule" class="block px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all text-sm">Jadwal Rilis</a>
                    <a href="#trending" class="block px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all text-sm">Sedang Hangat</a>
                    <a href="#episode" class="block px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all text-sm">Video Streaming</a>
                    <a href="#download" class="block px-4 py-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all text-sm">Direct Download</a>
                </div>

                <div class="mt-10 pt-10 border-t border-white/5">
                    <a href="/dashboard" class="flex items-center gap-2 text-slate-400 hover:text-white transition-all">
                        <i class="fas fa-chart-line"></i>
                        <span class="text-sm font-medium">Buka Dashboard</span>
                    </a>
                </div>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 md:ml-72 p-6 md:p-12 max-w-5xl">
            <section id="intro" class="mb-16">
                <span class="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">v1.0.0</span>
                <h2 class="text-4xl font-extrabold mt-4 mb-6">Dokumentasi API Anime</h2>
                <p class="text-slate-400 text-lg leading-relaxed mb-8">
                    Selamat datang di API Anime terlengkap. API ini menyediakan data real-time dari berbagai sumber anime populer dengan performa tinggi dan filter iklan otomatis.
                </p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 bg-white/5 border border-white/5 rounded-xl">
                        <i class="fas fa-bolt text-yellow-500 mb-2"></i>
                        <h4 class="font-bold text-sm">Super Cepat</h4>
                        <p class="text-xs text-slate-500">Load data di bawah 1 detik dengan caching pintar.</p>
                    </div>
                    <div class="p-4 bg-white/5 border border-white/5 rounded-xl">
                        <i class="fas fa-shield-alt text-green-500 mb-2"></i>
                        <h4 class="font-bold text-sm">Tanpa Iklan</h4>
                        <p class="text-xs text-slate-500">Filter otomatis link iklan dan pop-up.</p>
                    </div>
                    <div class="p-4 bg-white/5 border border-white/5 rounded-xl">
                        <i class="fas fa-video text-purple-500 mb-2"></i>
                        <h4 class="font-bold text-sm">HD Quality</h4>
                        <p class="text-xs text-slate-500">Support berbagai resolusi hingga 1080p.</p>
                    </div>
                </div>
            </section>

            <section id="base-url" class="mb-16">
                <h3 class="text-2xl font-bold mb-4">Base URL</h3>
                <div class="bg-slate-900 border border-white/10 p-4 rounded-xl flex items-center justify-between group">
                    <code class="text-lg text-blue-400">http://localhost:3000/api/v1</code>
                    <button onclick="navigator.clipboard.writeText('http://localhost:3000/api/v1')" class="text-slate-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </section>

            <div class="space-y-12">
                <!-- Endpoint: Latest -->
                <section id="latest" class="endpoint-card">
                    <div class="p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="method-get">GET</span>
                            <span class="api-url">/latest</span>
                            <span class="tag bg-green-500/10 text-green-500">Cached</span>
                        </div>
                        <h4 class="text-xl font-bold mb-2">Anime Terbaru</h4>
                        <p class="text-slate-400 text-sm mb-6">Mendapatkan daftar episode anime yang baru rilis.</p>
                        
                        <h5 class="text-xs font-bold text-slate-500 uppercase mb-3">Request Example</h5>
                        <pre>curl -X GET "http://localhost:3000/api/v1/latest"</pre>
                    </div>
                </section>

                <!-- Endpoint: Search -->
                <section id="search" class="endpoint-card">
                    <div class="p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="method-get">GET</span>
                            <span class="api-url">/search?q={judul}</span>
                        </div>
                        <h4 class="text-xl font-bold mb-2">Cari Anime</h4>
                        <p class="text-slate-400 text-sm mb-6">Pencarian anime berdasarkan judul atau keyword.</p>
                        
                        <div class="space-y-4 mb-6">
                            <h5 class="text-xs font-bold text-slate-500 uppercase">Parameter</h5>
                            <div class="bg-black/20 rounded-lg p-3 text-sm">
                                <div class="flex justify-between border-b border-white/5 pb-2 mb-2">
                                    <span class="font-mono text-blue-400">q</span>
                                    <span class="text-slate-500 italic">String (Wajib)</span>
                                </div>
                                <p class="text-slate-400">Judul anime yang ingin dicari.</p>
                            </div>
                        </div>

                        <h5 class="text-xs font-bold text-slate-500 uppercase mb-3">Request Example</h5>
                        <pre>curl -X GET "http://localhost:3000/api/v1/search?q=naruto"</pre>
                    </div>
                </section>

                <!-- Endpoint: Schedule -->
                <section id="schedule" class="endpoint-card">
                    <div class="p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="method-get">GET</span>
                            <span class="api-url">/animeinweb/schedule</span>
                            <span class="tag bg-green-500/10 text-green-500">Fast</span>
                        </div>
                        <h4 class="text-xl font-bold mb-2">Jadwal Rilis</h4>
                        <p class="text-slate-400 text-sm mb-6">Jadwal update anime harian dengan info lengkap.</p>
                        
                        <pre>curl -X GET "http://localhost:3000/api/v1/animeinweb/schedule?day=senin"</pre>
                    </div>
                </section>

                <!-- Endpoint: Episode -->
                <section id="episode" class="endpoint-card">
                    <div class="p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="method-get">GET</span>
                            <span class="api-url">/animeinweb/episode</span>
                        </div>
                        <h4 class="text-xl font-bold mb-2">Streaming Video</h4>
                        <p class="text-slate-400 text-sm mb-6">Mendapatkan link video dan resolusi per episode.</p>
                        
                        <pre>curl -X GET "http://localhost:3000/api/v1/animeinweb/episode?animeId=341&episodeNumber=500"</pre>
                    </div>
                </section>
            </div>

            <footer class="mt-20 pt-10 border-t border-white/5 text-slate-500 text-sm flex justify-between">
                <p>&copy; 2025 AnimeAPI Documentation</p>
                <div class="flex gap-4">
                    <a href="#" class="hover:text-white"><i class="fab fa-github"></i></a>
                    <a href="#" class="hover:text-white"><i class="fab fa-discord"></i></a>
                </div>
            </footer>
        </main>
    </body>
    </html>
  `);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Anime API - NontonAnimeID & AnimeInWeb',
    status: 'online',
    version: '1.0.0',
    monitoring: `http://localhost:${PORT}/dashboard`,
    documentation: `http://localhost:${PORT}/docs`,
    baseUrl: `http://localhost:${PORT}/api/v1`,
    author: 'Raisyahah',
    uptime: `${Math.floor((new Date() - stats.startTime) / 1000)}s`
  });
});

// Test endpoint dengan mock data (untuk testing frontend)
app.get('/api/v1/test', handleEndpoint(async (req, res) => {
  const mockLatestEpisodes = [
    {
      title: "one piece",
      episode: "episode 1000",
      thumbnail: "https://via.placeholder.com/300x400",
      link: "https://s7.nontonanimeid.boats/anime/one-piece/episode-1000",
      resolution: "1080p",
      releaseDate: "2024-01-15"
    },
    {
      title: "demon slayer",
      episode: "episode 12",
      thumbnail: "https://via.placeholder.com/300x400",
      link: "https://s7.nontonanimeid.boats/anime/demon-slayer/episode-12",
      resolution: "720p",
      releaseDate: "2024-01-14"
    }
  ];

  const mockSearchResults = [
    {
      title: "one piece",
      thumbnail: "https://via.placeholder.com/300x400",
      link: "https://s7.nontonanimeid.boats/anime/one-piece",
      rating: 9.5
    }
  ];

  const endpoint = req.query.endpoint || 'latest';

  try {
    if (endpoint === 'latest') {
      return res.json({
        success: true,
        data: mockLatestEpisodes,
        total: mockLatestEpisodes.length,
        note: 'Ini adalah mock data untuk testing. Update selector CSS di scraper.js untuk mendapatkan data real.'
      });
    } else if (endpoint === 'search') {
      return res.json({
        success: true,
        data: mockSearchResults,
        total: mockSearchResults.length,
        query: req.query.q || '',
        note: 'Ini adalah mock data untuk testing.'
      });
    } else {
      return res.json({
        success: true,
        message: 'Test endpoint',
        availableEndpoints: ['latest', 'search']
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

app.get('/api/v1/test/', handleEndpoint(async (req, res) => {
  // Same handler as above
  const mockLatestEpisodes = [
    {
      title: "one piece",
      episode: "episode 1000",
      thumbnail: "https://via.placeholder.com/300x400",
      link: "https://s7.nontonanimeid.boats/anime/one-piece/episode-1000",
      resolution: "1080p",
      releaseDate: "2024-01-15"
    }
  ];

  const endpoint = req.query.endpoint || 'latest';
  return res.json({
    success: true,
    data: endpoint === 'latest' ? mockLatestEpisodes : [],
    total: mockLatestEpisodes.length,
    note: 'Mock data untuk testing'
  });
}));

// Endpoint untuk episode terbaru (dengan dan tanpa trailing slash)
app.get('/api/v1/latest', cacheMiddleware(600), handleEndpoint(async (req, res) => {
  try {
    const episodes = await scraper.getLatestEpisodes();
    res.json({
      success: true,
      data: episodes,
      total: episodes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

app.get('/api/v1/latest/', cacheMiddleware(600), handleEndpoint(async (req, res) => {
  try {
    const episodes = await scraper.getLatestEpisodes();
    res.json({
      success: true,
      data: episodes,
      total: episodes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Endpoint untuk detail anime (dengan dan tanpa trailing slash)
app.get('/api/v1/detail', cacheMiddleware(1800), handleEndpoint(async (req, res) => {
  try {
    const { slug, url } = req.query;
    const identifier = slug || url;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Parameter slug atau url diperlukan. Contoh: /api/detail?slug=nama-anime atau /api/detail?url=https://...'
      });
    }
    
    const anime = await scraper.getAnimeDetail(identifier);
    res.json({
      success: true,
      data: anime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

app.get('/api/v1/detail/', cacheMiddleware(1800), handleEndpoint(async (req, res) => {
  try {
    const { slug, url } = req.query;
    const identifier = slug || url;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Parameter slug atau url diperlukan. Contoh: /api/detail?slug=nama-anime atau /api/detail?url=https://...'
      });
    }
    
    const anime = await scraper.getAnimeDetail(identifier);
    res.json({
      success: true,
      data: anime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Endpoint untuk search anime (dengan dan tanpa trailing slash)
app.get('/api/v1/search', cacheMiddleware(300), handleEndpoint(async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Parameter q (query) diperlukan'
      });
    }
    const results = await scraper.searchAnime(q);
    res.json({
      success: true,
      data: results,
      total: results.length,
      query: q
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

app.get('/api/v1/search/', cacheMiddleware(300), handleEndpoint(async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Parameter q (query) diperlukan'
      });
    }
    const results = await scraper.searchAnime(q);
    res.json({
      success: true,
      data: results,
      total: results.length,
      query: q
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Endpoint untuk list semua anime (dengan dan tanpa trailing slash)
app.get('/api/v1/list', cacheMiddleware(1800), handleEndpoint(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const animeList = await scraper.getAnimeList(page);
    res.json({
      success: true,
      data: animeList,
      total: animeList.length,
      page: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

app.get('/api/v1/list/', cacheMiddleware(1800), handleEndpoint(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const animeList = await scraper.getAnimeList(page);
    res.json({
      success: true,
      data: animeList,
      total: animeList.length,
      page: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Endpoint untuk animeinweb.com
app.get('/api/v1/animeinweb', cacheMiddleware(1800), handleEndpoint(async (req, res) => {
  try {
    const { id, url } = req.query;
    
    const identifier = url || id;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Parameter id atau url diperlukan. Contoh: /api/animeinweb?id=341'
      });
    }
    
    const animeData = await scraper.getAnimeInWebData(identifier);
    res.json({
      success: true,
      data: animeData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

app.get('/api/v1/animeinweb/', cacheMiddleware(1800), handleEndpoint(async (req, res) => {
  try {
    const { id, url } = req.query;
    
    const identifier = url || id;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Parameter id atau url diperlukan. Contoh: /api/animeinweb?id=341'
      });
    }
    
    const animeData = await scraper.getAnimeInWebData(identifier);
    res.json({
      success: true,
      data: animeData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Endpoint untuk animeinweb.com episode (video per episode)
app.get(['/api/v1/animeinweb/episode', '/api/v1/animeinweb/episode/'], cacheMiddleware(3600), handleEndpoint(async (req, res) => {
  const { animeId, episodeNumber } = req.query;
  
  if (!animeId || !episodeNumber) {
    return {
      success: false,
      error: 'Parameter animeId dan episodeNumber diperlukan. Contoh: /api/animeinweb/episode?animeId=341&episodeNumber=500'
    };
  }
  
  const episodeData = await scraper.getAnimeInWebEpisode(animeId, episodeNumber);
  return {
    success: true,
    data: episodeData
  };
}));

// Endpoint untuk schedule anime (jadwal rilis per hari)
app.get(['/api/v1/animeinweb/schedule', '/api/v1/animeinweb/schedule/'], cacheMiddleware(3600), handleEndpoint(async (req, res) => {
  const { day } = req.query; // Optional: senin, selasa, rabu, kamis, jumat, sabtu, minggu, random
  
  const scheduleData = await scraper.getSchedule(day);
  return {
    success: true,
    data: scheduleData
  };
}));

// Endpoint untuk anime trending/popular (sedang hangat) - dengan timeout lebih lama
app.get(['/api/v1/animeinweb/trending', '/api/v1/animeinweb/trending/'], cacheMiddleware(3600), handleEndpoint(async (req, res) => {
  const trendingData = await scraper.getTrending();
  return {
    success: true,
    data: trendingData,
    total: trendingData.length
  };
}, 20000)); // 20 detik timeout

// Endpoint untuk anime baru ditambahkan - dengan timeout lebih lama
app.get(['/api/v1/animeinweb/new', '/api/v1/animeinweb/new/'], cacheMiddleware(3600), handleEndpoint(async (req, res) => {
  const newData = await scraper.getNew();
  return {
    success: true,
    data: newData,
    total: newData.length
  };
}, 20000)); // 20 detik timeout

// Endpoint untuk anime hari ini - dengan timeout lebih lama
app.get(['/api/v1/animeinweb/today', '/api/v1/animeinweb/today/'], cacheMiddleware(3600), handleEndpoint(async (req, res) => {
  const todayData = await scraper.getToday();
  return {
    success: true,
    data: todayData
  };
}, 20000)); // 20 detik timeout

// Endpoint untuk download episode (return download link)
app.get(['/api/v1/download/episode', '/api/v1/download/episode/'], handleEndpoint(async (req, res) => {
  const { animeId, episodeNumber, resolution } = req.query;
  
  if (!animeId || !episodeNumber) {
    throw new Error('Parameter animeId dan episodeNumber diperlukan. Contoh: /api/v1/download/episode?animeId=341&episodeNumber=500&resolution=1080p');
  }
  
  // Get episode data
  const episodeData = await scraper.getAnimeInWebEpisode(animeId, episodeNumber);
  
  if (!episodeData || !episodeData.videoSources || episodeData.videoSources.length === 0) {
    throw new Error('Video source tidak ditemukan untuk episode ini');
  }
  
  // Pilih video source berdasarkan resolution atau ambil yang tertinggi
  let selectedVideo = episodeData.videoSources[0]; // Default: RAPSODI tertinggi
  
  if (resolution) {
    const foundVideo = episodeData.videoSources.find(v => 
      v.resolution.toLowerCase() === resolution.toLowerCase() || 
      v.quality.toLowerCase() === resolution.toLowerCase()
    );
    if (foundVideo) {
      selectedVideo = foundVideo;
    }
  }
  
  // Return download info
  return {
    success: true,
    data: {
      animeId: animeId,
      animeTitle: episodeData.animeTitle,
      episodeNumber: episodeNumber,
      episodeTitle: episodeData.title,
      downloadUrl: selectedVideo.url, // URL sudah di-decode
      resolution: selectedVideo.resolution,
      quality: selectedVideo.quality,
      server: selectedVideo.server,
      fileSize: selectedVideo.fileSize || null,
      type: selectedVideo.type,
      note: 'Gunakan downloadUrl untuk download video. URL sudah di-decode dan siap digunakan.'
    }
  };
}, 30000)); // 30 detik timeout

// Endpoint untuk batch download semua episode (return list download links)
app.get(['/api/v1/download/batch', '/api/v1/download/batch/'], handleEndpoint(async (req, res) => {
  const { animeId, resolution, startEpisode, endEpisode } = req.query;
  
  if (!animeId) {
    throw new Error('Parameter animeId diperlukan. Contoh: /api/v1/download/batch?animeId=341&resolution=1080p&startEpisode=1&endEpisode=500');
  }
  
  // Get anime info untuk mendapatkan list episode
  const animeData = await scraper.getAnimeInWebData(animeId);
  
  if (!animeData || !animeData.episodes || animeData.episodes.length === 0) {
    throw new Error('Episode list tidak ditemukan untuk anime ini');
  }
  
  // Filter episode berdasarkan range (jika ada)
  let episodesToDownload = animeData.episodes;
  if (startEpisode || endEpisode) {
    const start = startEpisode ? parseInt(startEpisode) : 1;
    const end = endEpisode ? parseInt(endEpisode) : episodesToDownload.length;
    episodesToDownload = episodesToDownload.filter(ep => {
      const epNum = parseInt(ep.number) || 0;
      return epNum >= start && epNum <= end;
    });
  }
  
  // Get download links untuk setiap episode (limit untuk menghindari timeout)
  const maxEpisodes = 50; // Limit untuk menghindari timeout
  const episodesToProcess = episodesToDownload.slice(0, maxEpisodes);
  
  const downloadLinks = [];
  let processed = 0;
  let failed = 0;
  
  for (const episode of episodesToProcess) {
    try {
      const episodeData = await scraper.getAnimeInWebEpisode(animeId, episode.number);
      
      if (episodeData && episodeData.videoSources && episodeData.videoSources.length > 0) {
        // Pilih video source berdasarkan resolution atau ambil yang tertinggi
        let selectedVideo = episodeData.videoSources[0];
        
        if (resolution) {
          const foundVideo = episodeData.videoSources.find(v => 
            v.resolution.toLowerCase() === resolution.toLowerCase() || 
            v.quality.toLowerCase() === resolution.toLowerCase()
          );
          if (foundVideo) {
            selectedVideo = foundVideo;
          }
        }
        
        downloadLinks.push({
          episodeNumber: episode.number,
          episodeTitle: episodeData.title,
          downloadUrl: selectedVideo.url,
          resolution: selectedVideo.resolution,
          quality: selectedVideo.quality,
          server: selectedVideo.server,
          fileSize: selectedVideo.fileSize || null,
          type: selectedVideo.type
        });
        processed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Error fetching episode ${episode.number}:`, error.message);
      failed++;
    }
    
    // Small delay untuk menghindari rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return {
    success: true,
    data: {
      animeId: animeId,
      animeTitle: animeData.title,
      totalEpisodes: episodesToDownload.length,
      processedEpisodes: processed,
      failedEpisodes: failed,
      downloadLinks: downloadLinks,
      note: episodesToDownload.length > maxEpisodes 
        ? `Hanya memproses ${maxEpisodes} episode pertama. Gunakan parameter startEpisode dan endEpisode untuk batch lainnya.`
        : 'Semua episode berhasil diproses. Gunakan downloadUrl untuk download video.'
    }
  };
}, 300000)); // 5 menit timeout untuk batch

// Endpoint untuk get video episode dengan resolusi (dengan dan tanpa trailing slash)
app.get('/api/v1/episode', handleEndpoint(async (req, res) => {
  try {
    const { url, slug, episode } = req.query;
    
    // Bisa pakai url lengkap, slug, atau kombinasi slug + episode
    let episodeUrl = '';
    
    if (url) {
      episodeUrl = url;
    } else if (slug && episode) {
      episodeUrl = `${slug}/episode-${episode}`;
    } else if (slug) {
      episodeUrl = slug;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Parameter url, atau slug+episode diperlukan. Contoh: /api/episode?url=https://... atau /api/episode?slug=one-piece&episode=1'
      });
    }
    
    const episodeData = await scraper.getEpisodeVideo(episodeUrl);
    res.json({
      success: true,
      data: episodeData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

app.get('/api/v1/episode/', handleEndpoint(async (req, res) => {
  try {
    const { url, slug, episode } = req.query;
    
    // Bisa pakai url lengkap, slug, atau kombinasi slug + episode
    let episodeUrl = '';
    
    if (url) {
      episodeUrl = url;
    } else if (slug && episode) {
      episodeUrl = `${slug}/episode-${episode}`;
    } else if (slug) {
      episodeUrl = slug;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Parameter url, atau slug+episode diperlukan. Contoh: /api/episode?url=https://... atau /api/episode?slug=one-piece&episode=1'
      });
    }
    
    const episodeData = await scraper.getEpisodeVideo(episodeUrl);
    res.json({
      success: true,
      data: episodeData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Start server
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Base URL: http://localhost:${PORT}/api/v1/`);
    console.log(`\n📖 Endpoints:`);
    console.log(`   GET /api/v1/latest - Episode terbaru`);
    console.log(`   GET /api/v1/detail?slug=... - Detail anime`);
    console.log(`   GET /api/v1/search?q=... - Pencarian anime`);
    console.log(`   GET /api/v1/list?page=1 - List anime`);
    console.log(`   GET /api/v1/episode?url=... - Video episode`);
    console.log(`   GET /api/v1/animeinweb?id=... - Info anime dari animeinweb.com`);
    console.log(`   GET /api/v1/animeinweb/episode?animeId=...&episodeNumber=... - Video episode animeinweb`);
    console.log(`   GET /api/v1/animeinweb/schedule?day=... - Jadwal anime (day: senin/selasa/rabu/kamis/jumat/sabtu/minggu/random)`);
    console.log(`   GET /api/v1/animeinweb/trending - Anime sedang hangat/popular`);
    console.log(`   GET /api/v1/animeinweb/new - Anime baru ditambahkan`);
    console.log(`   GET /api/v1/animeinweb/today - Anime hari ini`);
    console.log(`   GET /api/v1/download/episode?animeId=...&episodeNumber=...&resolution=... - Download link per episode`);
    console.log(`   GET /api/v1/download/batch?animeId=...&resolution=...&startEpisode=...&endEpisode=... - Download link batch\n`);
  });
}

module.exports = app;

