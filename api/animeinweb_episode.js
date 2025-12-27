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
    const { animeId, episodeNumber } = req.query;
    
    if (!animeId || !episodeNumber) {
      return res.status(400).json({
        success: false,
        error: 'Parameter animeId dan episodeNumber diperlukan. Contoh: /api/animeinweb/episode?animeId=341&episodeNumber=500'
      });
    }
    
    const episodeData = await scraper.getAnimeInWebEpisode(animeId, episodeNumber);
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

