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
    const { id, url } = req.query;
    
    // Bisa pakai ID atau URL lengkap
    let identifier = '';
    
    if (url) {
      identifier = url;
    } else if (id) {
      identifier = id;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Parameter id atau url diperlukan. Contoh: /api/animeinweb?id=341 atau /api/animeinweb?url=https://animeinweb.com/anime/341'
      });
    }
    
    const animeData = await scraper.getAnimeInWebData(identifier);
    return res.status(200).json({
      success: true,
      data: animeData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

