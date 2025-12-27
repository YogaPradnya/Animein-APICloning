// Endpoint test untuk mock data (untuk testing frontend)
// Bisa dihapus setelah scraper berfungsi dengan benar

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Mock data untuk testing
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
    },
    {
      title: "jujutsu kaisen",
      episode: "episode 24",
      thumbnail: "https://via.placeholder.com/300x400",
      link: "https://s7.nontonanimeid.boats/anime/jujutsu-kaisen/episode-24",
      resolution: "1080p",
      releaseDate: "2024-01-13"
    }
  ];

  const mockSearchResults = [
    {
      title: "one piece",
      thumbnail: "https://via.placeholder.com/300x400",
      link: "https://s7.nontonanimeid.boats/anime/one-piece",
      rating: 9.5
    },
    {
      title: "one piece film red",
      thumbnail: "https://via.placeholder.com/300x400",
      link: "https://s7.nontonanimeid.boats/anime/one-piece-film-red",
      rating: 8.9
    }
  ];

  const endpoint = req.query.endpoint || 'latest';

  try {
    if (endpoint === 'latest') {
      return res.status(200).json({
        success: true,
        data: mockLatestEpisodes,
        total: mockLatestEpisodes.length,
        note: 'Ini adalah mock data untuk testing. Update selector CSS di scraper.js untuk mendapatkan data real.'
      });
    } else if (endpoint === 'search') {
      return res.status(200).json({
        success: true,
        data: mockSearchResults,
        total: mockSearchResults.length,
        query: req.query.q || '',
        note: 'Ini adalah mock data untuk testing.'
      });
    } else {
      return res.status(200).json({
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
};

