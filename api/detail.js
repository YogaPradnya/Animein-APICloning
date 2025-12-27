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
    const { slug, url } = req.query;
    const identifier = slug || url;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Parameter slug atau url diperlukan. Contoh: /api/detail?slug=nama-anime atau /api/detail?url=https://...'
      });
    }
    
    const anime = await scraper.getAnimeDetail(identifier);
    return res.status(200).json({
      success: true,
      data: anime
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

