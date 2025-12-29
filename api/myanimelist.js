/**
 * MyAnimeList API Integration
 * 
 * Integrasi dengan MyAnimeList API v2 untuk:
 * - OAuth2 Authentication (login user)
 * - Get user anime list (bookmark, stats)
 * - Get anime detail dari MAL
 * - Sync bookmark ke database
 * 
 * Dokumentasi: https://myanimelist.net/apiconfig/references/api/v2
 */

const axios = require('axios');
const crypto = require('crypto');

// MAL API Endpoints
const MAL_API_BASE = 'https://api.myanimelist.net/v2';
const MAL_AUTH_BASE = 'https://myanimelist.net/v1/oauth2';

// Environment variables
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;
const MAL_CLIENT_SECRET = process.env.MAL_CLIENT_SECRET;
const MAL_REDIRECT_URI = process.env.MAL_REDIRECT_URI || 'http://localhost:3000/api/v1/mal/callback';

// In-memory storage untuk PKCE code verifier (idealnya pakai Redis/database)
const codeVerifierStore = new Map();

// In-memory storage untuk user tokens (idealnya pakai database)
const userTokenStore = new Map();

/**
 * Generate random string untuk PKCE
 */
function generateRandomString(length = 128) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Generate code challenge dari code verifier (PKCE)
 */
function generateCodeChallenge(codeVerifier) {
  // MAL menggunakan plain code challenge (tidak di-hash)
  return codeVerifier;
}

/**
 * Generate OAuth2 authorization URL
 * User harus diarahkan ke URL ini untuk login
 */
function getAuthorizationUrl(state = null) {
  if (!MAL_CLIENT_ID) {
    throw new Error('MAL_CLIENT_ID belum di-set di environment variables');
  }

  // Generate code verifier untuk PKCE
  const codeVerifier = generateRandomString(128);
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Generate state jika tidak ada
  const authState = state || generateRandomString(32);
  
  // Simpan code verifier (pakai state sebagai key)
  codeVerifierStore.set(authState, codeVerifier);
  
  // Buat authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: MAL_CLIENT_ID,
    redirect_uri: MAL_REDIRECT_URI,
    state: authState,
    code_challenge: codeChallenge,
    code_challenge_method: 'plain'
  });

  return {
    url: `${MAL_AUTH_BASE}/authorize?${params.toString()}`,
    state: authState,
    codeVerifier: codeVerifier
  };
}

/**
 * Exchange authorization code untuk access token
 */
async function exchangeCodeForToken(code, state) {
  if (!MAL_CLIENT_ID || !MAL_CLIENT_SECRET) {
    throw new Error('MAL_CLIENT_ID atau MAL_CLIENT_SECRET belum di-set');
  }

  // Ambil code verifier dari store
  const codeVerifier = codeVerifierStore.get(state);
  if (!codeVerifier) {
    throw new Error('Invalid state atau code verifier tidak ditemukan');
  }

  try {
    const response = await axios.post(`${MAL_AUTH_BASE}/token`, 
      new URLSearchParams({
        client_id: MAL_CLIENT_ID,
        client_secret: MAL_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: MAL_REDIRECT_URI,
        code_verifier: codeVerifier
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Hapus code verifier dari store (sudah dipakai)
    codeVerifierStore.delete(state);

    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in,
      expires_at: Date.now() + (response.data.expires_in * 1000)
    };

    return tokenData;
  } catch (error) {
    console.error('[MAL] Token exchange error:', error.response?.data || error.message);
    throw new Error(`Gagal exchange token: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken) {
  if (!MAL_CLIENT_ID || !MAL_CLIENT_SECRET) {
    throw new Error('MAL_CLIENT_ID atau MAL_CLIENT_SECRET belum di-set');
  }

  try {
    const response = await axios.post(`${MAL_AUTH_BASE}/token`,
      new URLSearchParams({
        client_id: MAL_CLIENT_ID,
        client_secret: MAL_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in,
      expires_at: Date.now() + (response.data.expires_in * 1000)
    };
  } catch (error) {
    console.error('[MAL] Token refresh error:', error.response?.data || error.message);
    throw new Error(`Gagal refresh token: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Get user profile dari MAL
 */
async function getUserProfile(accessToken) {
  try {
    const response = await axios.get(`${MAL_API_BASE}/users/@me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        fields: 'anime_statistics'
      }
    });

    const userData = response.data;
    
    return {
      id: userData.id,
      name: userData.name,
      picture: userData.picture || null,
      gender: userData.gender || null,
      birthday: userData.birthday || null,
      location: userData.location || null,
      joined_at: userData.joined_at || null,
      anime_statistics: userData.anime_statistics ? {
        num_items_watching: userData.anime_statistics.num_items_watching || 0,
        num_items_completed: userData.anime_statistics.num_items_completed || 0,
        num_items_on_hold: userData.anime_statistics.num_items_on_hold || 0,
        num_items_dropped: userData.anime_statistics.num_items_dropped || 0,
        num_items_plan_to_watch: userData.anime_statistics.num_items_plan_to_watch || 0,
        num_items: userData.anime_statistics.num_items || 0,
        num_days_watched: userData.anime_statistics.num_days_watched || 0,
        num_days_watching: userData.anime_statistics.num_days_watching || 0,
        num_days_completed: userData.anime_statistics.num_days_completed || 0,
        num_days_on_hold: userData.anime_statistics.num_days_on_hold || 0,
        num_days_dropped: userData.anime_statistics.num_days_dropped || 0,
        num_days: userData.anime_statistics.num_days || 0,
        num_episodes: userData.anime_statistics.num_episodes || 0,
        num_times_rewatched: userData.anime_statistics.num_times_rewatched || 0,
        mean_score: userData.anime_statistics.mean_score || 0
      } : null
    };
  } catch (error) {
    console.error('[MAL] Get user profile error:', error.response?.data || error.message);
    throw new Error(`Gagal ambil profil user: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Get user anime list (bookmark)
 * @param {string} accessToken - Access token
 * @param {string} status - Filter status: watching, completed, on_hold, dropped, plan_to_watch, atau null untuk semua
 * @param {string} sort - Sort: list_score, list_updated_at, anime_title, anime_start_date, anime_id
 * @param {number} limit - Jumlah anime per page (max 1000)
 * @param {number} offset - Offset untuk pagination
 */
async function getUserAnimeList(accessToken, status = null, sort = 'list_updated_at', limit = 100, offset = 0) {
  try {
    const params = {
      fields: 'list_status,num_episodes,synopsis,mean,genres,studios,status,start_date,end_date,start_season,broadcast,media_type,rating,pictures,related_anime,recommendations',
      sort: sort,
      limit: Math.min(limit, 1000),
      offset: offset
    };

    if (status) {
      params.status = status;
    }

    const response = await axios.get(`${MAL_API_BASE}/users/@me/animelist`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: params
    });

    const animeList = response.data.data.map(item => {
      const anime = item.node;
      const listStatus = item.list_status;

      return {
        mal_id: anime.id,
        title: (anime.title || '').toLowerCase(),
        main_picture: {
          medium: anime.main_picture?.medium || null,
          large: anime.main_picture?.large || null
        },
        synopsis: anime.synopsis || null,
        mean_score: anime.mean || null,
        genres: (anime.genres || []).map(g => g.name.toLowerCase()),
        studios: (anime.studios || []).map(s => ({
          id: s.id,
          name: s.name.toLowerCase()
        })),
        status: anime.status || null,
        num_episodes: anime.num_episodes || 0,
        start_date: anime.start_date || null,
        end_date: anime.end_date || null,
        start_season: anime.start_season ? {
          year: anime.start_season.year,
          season: anime.start_season.season
        } : null,
        broadcast: anime.broadcast ? {
          day_of_the_week: anime.broadcast.day_of_the_week,
          start_time: anime.broadcast.start_time
        } : null,
        media_type: anime.media_type || null,
        rating: anime.rating || null,
        // User list status
        list_status: {
          status: listStatus.status,
          score: listStatus.score || 0,
          num_episodes_watched: listStatus.num_episodes_watched || 0,
          is_rewatching: listStatus.is_rewatching || false,
          updated_at: listStatus.updated_at,
          start_date: listStatus.start_date || null,
          finish_date: listStatus.finish_date || null,
          priority: listStatus.priority || 0,
          num_times_rewatched: listStatus.num_times_rewatched || 0,
          rewatch_value: listStatus.rewatch_value || 0,
          tags: listStatus.tags || [],
          comments: listStatus.comments || ''
        }
      };
    });

    return {
      data: animeList,
      paging: {
        previous: response.data.paging?.previous || null,
        next: response.data.paging?.next || null
      }
    };
  } catch (error) {
    console.error('[MAL] Get anime list error:', error.response?.data || error.message);
    throw new Error(`Gagal ambil anime list: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Get anime detail dari MAL by ID
 */
async function getAnimeDetail(animeId, accessToken = null) {
  try {
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (MAL_CLIENT_ID) {
      headers['X-MAL-CLIENT-ID'] = MAL_CLIENT_ID;
    } else {
      throw new Error('Perlu access token atau MAL_CLIENT_ID');
    }

    const response = await axios.get(`${MAL_API_BASE}/anime/${animeId}`, {
      headers: headers,
      params: {
        fields: 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics'
      }
    });

    const anime = response.data;

    return {
      mal_id: anime.id,
      title: (anime.title || '').toLowerCase(),
      alternative_titles: {
        synonyms: anime.alternative_titles?.synonyms || [],
        en: anime.alternative_titles?.en || null,
        ja: anime.alternative_titles?.ja || null
      },
      main_picture: {
        medium: anime.main_picture?.medium || null,
        large: anime.main_picture?.large || null
      },
      synopsis: anime.synopsis || null,
      mean_score: anime.mean || null,
      rank: anime.rank || null,
      popularity: anime.popularity || null,
      num_list_users: anime.num_list_users || 0,
      num_scoring_users: anime.num_scoring_users || 0,
      media_type: anime.media_type || null,
      status: anime.status || null,
      genres: (anime.genres || []).map(g => g.name.toLowerCase()),
      studios: (anime.studios || []).map(s => ({
        id: s.id,
        name: s.name.toLowerCase()
      })),
      num_episodes: anime.num_episodes || 0,
      start_date: anime.start_date || null,
      end_date: anime.end_date || null,
      start_season: anime.start_season ? {
        year: anime.start_season.year,
        season: anime.start_season.season
      } : null,
      broadcast: anime.broadcast ? {
        day_of_the_week: anime.broadcast.day_of_the_week,
        start_time: anime.broadcast.start_time
      } : null,
      source: anime.source || null,
      average_episode_duration: anime.average_episode_duration || null,
      rating: anime.rating || null,
      pictures: (anime.pictures || []).map(p => ({
        medium: p.medium,
        large: p.large
      })),
      background: anime.background || null,
      related_anime: (anime.related_anime || []).map(r => ({
        mal_id: r.node.id,
        title: (r.node.title || '').toLowerCase(),
        main_picture: r.node.main_picture,
        relation_type: r.relation_type,
        relation_type_formatted: r.relation_type_formatted
      })),
      recommendations: (anime.recommendations || []).slice(0, 10).map(r => ({
        mal_id: r.node.id,
        title: (r.node.title || '').toLowerCase(),
        main_picture: r.node.main_picture,
        num_recommendations: r.num_recommendations
      })),
      statistics: anime.statistics ? {
        status: {
          watching: anime.statistics.status.watching,
          completed: anime.statistics.status.completed,
          on_hold: anime.statistics.status.on_hold,
          dropped: anime.statistics.status.dropped,
          plan_to_watch: anime.statistics.status.plan_to_watch
        },
        num_list_users: anime.statistics.num_list_users
      } : null,
      // User list status jika login
      my_list_status: anime.my_list_status ? {
        status: anime.my_list_status.status,
        score: anime.my_list_status.score || 0,
        num_episodes_watched: anime.my_list_status.num_episodes_watched || 0,
        is_rewatching: anime.my_list_status.is_rewatching || false,
        updated_at: anime.my_list_status.updated_at
      } : null
    };
  } catch (error) {
    console.error('[MAL] Get anime detail error:', error.response?.data || error.message);
    throw new Error(`Gagal ambil detail anime: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Search anime di MAL
 */
async function searchAnime(query, limit = 10, accessToken = null) {
  try {
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (MAL_CLIENT_ID) {
      headers['X-MAL-CLIENT-ID'] = MAL_CLIENT_ID;
    } else {
      throw new Error('Perlu access token atau MAL_CLIENT_ID');
    }

    const response = await axios.get(`${MAL_API_BASE}/anime`, {
      headers: headers,
      params: {
        q: query,
        limit: Math.min(limit, 100),
        fields: 'id,title,main_picture,synopsis,mean,genres,studios,status,num_episodes,start_date,end_date,start_season,media_type,rating'
      }
    });

    const animeList = response.data.data.map(item => {
      const anime = item.node;
      return {
        mal_id: anime.id,
        title: (anime.title || '').toLowerCase(),
        main_picture: {
          medium: anime.main_picture?.medium || null,
          large: anime.main_picture?.large || null
        },
        synopsis: anime.synopsis || null,
        mean_score: anime.mean || null,
        genres: (anime.genres || []).map(g => g.name.toLowerCase()),
        studios: (anime.studios || []).map(s => ({
          id: s.id,
          name: s.name.toLowerCase()
        })),
        status: anime.status || null,
        num_episodes: anime.num_episodes || 0,
        start_date: anime.start_date || null,
        end_date: anime.end_date || null,
        start_season: anime.start_season ? {
          year: anime.start_season.year,
          season: anime.start_season.season
        } : null,
        media_type: anime.media_type || null,
        rating: anime.rating || null
      };
    });

    return {
      data: animeList,
      paging: {
        next: response.data.paging?.next || null
      }
    };
  } catch (error) {
    console.error('[MAL] Search anime error:', error.response?.data || error.message);
    throw new Error(`Gagal search anime: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Get anime ranking dari MAL
 * @param {string} rankingType - ranking_type: all, airing, upcoming, tv, ova, movie, special, bypopularity, favorite
 */
async function getAnimeRanking(rankingType = 'all', limit = 10, offset = 0, accessToken = null) {
  try {
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (MAL_CLIENT_ID) {
      headers['X-MAL-CLIENT-ID'] = MAL_CLIENT_ID;
    } else {
      throw new Error('Perlu access token atau MAL_CLIENT_ID');
    }

    const response = await axios.get(`${MAL_API_BASE}/anime/ranking`, {
      headers: headers,
      params: {
        ranking_type: rankingType,
        limit: Math.min(limit, 500),
        offset: offset,
        fields: 'id,title,main_picture,synopsis,mean,genres,studios,status,num_episodes,start_date,end_date,start_season,media_type,rating,rank,popularity'
      }
    });

    const animeList = response.data.data.map(item => {
      const anime = item.node;
      return {
        rank: item.ranking.rank,
        mal_id: anime.id,
        title: (anime.title || '').toLowerCase(),
        main_picture: {
          medium: anime.main_picture?.medium || null,
          large: anime.main_picture?.large || null
        },
        synopsis: anime.synopsis || null,
        mean_score: anime.mean || null,
        genres: (anime.genres || []).map(g => g.name.toLowerCase()),
        studios: (anime.studios || []).map(s => ({
          id: s.id,
          name: s.name.toLowerCase()
        })),
        status: anime.status || null,
        num_episodes: anime.num_episodes || 0,
        start_date: anime.start_date || null,
        end_date: anime.end_date || null,
        start_season: anime.start_season ? {
          year: anime.start_season.year,
          season: anime.start_season.season
        } : null,
        media_type: anime.media_type || null,
        rating: anime.rating || null,
        popularity: anime.popularity || null
      };
    });

    return {
      data: animeList,
      paging: {
        previous: response.data.paging?.previous || null,
        next: response.data.paging?.next || null
      }
    };
  } catch (error) {
    console.error('[MAL] Get anime ranking error:', error.response?.data || error.message);
    throw new Error(`Gagal ambil anime ranking: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Get seasonal anime dari MAL
 */
async function getSeasonalAnime(year, season, sort = 'anime_score', limit = 10, offset = 0, accessToken = null) {
  try {
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (MAL_CLIENT_ID) {
      headers['X-MAL-CLIENT-ID'] = MAL_CLIENT_ID;
    } else {
      throw new Error('Perlu access token atau MAL_CLIENT_ID');
    }

    const response = await axios.get(`${MAL_API_BASE}/anime/season/${year}/${season}`, {
      headers: headers,
      params: {
        sort: sort,
        limit: Math.min(limit, 500),
        offset: offset,
        fields: 'id,title,main_picture,synopsis,mean,genres,studios,status,num_episodes,start_date,end_date,start_season,broadcast,media_type,rating'
      }
    });

    const animeList = response.data.data.map(item => {
      const anime = item.node;
      return {
        mal_id: anime.id,
        title: (anime.title || '').toLowerCase(),
        main_picture: {
          medium: anime.main_picture?.medium || null,
          large: anime.main_picture?.large || null
        },
        synopsis: anime.synopsis || null,
        mean_score: anime.mean || null,
        genres: (anime.genres || []).map(g => g.name.toLowerCase()),
        studios: (anime.studios || []).map(s => ({
          id: s.id,
          name: s.name.toLowerCase()
        })),
        status: anime.status || null,
        num_episodes: anime.num_episodes || 0,
        start_date: anime.start_date || null,
        end_date: anime.end_date || null,
        start_season: anime.start_season ? {
          year: anime.start_season.year,
          season: anime.start_season.season
        } : null,
        broadcast: anime.broadcast ? {
          day_of_the_week: anime.broadcast.day_of_the_week,
          start_time: anime.broadcast.start_time
        } : null,
        media_type: anime.media_type || null,
        rating: anime.rating || null
      };
    });

    return {
      season: { year, season },
      data: animeList,
      paging: {
        previous: response.data.paging?.previous || null,
        next: response.data.paging?.next || null
      }
    };
  } catch (error) {
    console.error('[MAL] Get seasonal anime error:', error.response?.data || error.message);
    throw new Error(`Gagal ambil seasonal anime: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Update anime list status (add/update bookmark)
 */
async function updateAnimeListStatus(accessToken, animeId, status, score = null, numEpisodesWatched = null) {
  try {
    const data = new URLSearchParams();
    data.append('status', status);
    
    if (score !== null) {
      data.append('score', score);
    }
    if (numEpisodesWatched !== null) {
      data.append('num_watched_episodes', numEpisodesWatched);
    }

    const response = await axios.patch(
      `${MAL_API_BASE}/anime/${animeId}/my_list_status`,
      data.toString(),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      status: response.data.status,
      score: response.data.score || 0,
      num_episodes_watched: response.data.num_episodes_watched || 0,
      is_rewatching: response.data.is_rewatching || false,
      updated_at: response.data.updated_at
    };
  } catch (error) {
    console.error('[MAL] Update anime list status error:', error.response?.data || error.message);
    throw new Error(`Gagal update anime list status: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Delete anime dari list
 */
async function deleteAnimeFromList(accessToken, animeId) {
  try {
    await axios.delete(`${MAL_API_BASE}/anime/${animeId}/my_list_status`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return { success: true, message: 'Anime berhasil dihapus dari list' };
  } catch (error) {
    console.error('[MAL] Delete anime from list error:', error.response?.data || error.message);
    throw new Error(`Gagal hapus anime dari list: ${error.response?.data?.error || error.message}`);
  }
}

// Token management helpers
function saveUserToken(userId, tokenData) {
  userTokenStore.set(userId, tokenData);
}

function getUserToken(userId) {
  return userTokenStore.get(userId);
}

function deleteUserToken(userId) {
  userTokenStore.delete(userId);
}

module.exports = {
  // Auth
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  
  // User
  getUserProfile,
  getUserAnimeList,
  
  // Anime
  getAnimeDetail,
  searchAnime,
  getAnimeRanking,
  getSeasonalAnime,
  
  // List management
  updateAnimeListStatus,
  deleteAnimeFromList,
  
  // Token management
  saveUserToken,
  getUserToken,
  deleteUserToken,
  
  // Constants
  MAL_CLIENT_ID,
  MAL_CLIENT_SECRET,
  MAL_REDIRECT_URI
};

