const scraper = require('./scraper');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    return res.status(200).json({
      success: true,
      data: episodeData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

