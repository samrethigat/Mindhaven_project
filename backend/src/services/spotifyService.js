/**
 * Spotify Integration & Music Service for MindHaven
 * Official Spotify Web API integration (Client Credentials Flow)
 * Language-Aware Recommendations, Playlists, Search, and Responsive Spotify Embeds
 */

import { getLanguageConfig } from "../config/languageMappings.js";

let spotifyAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Get OAuth2 Access Token from Spotify API using Client Credentials
 */
export async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  // Use cached token if still valid
  if (spotifyAccessToken && Date.now() < tokenExpiresAt) {
    return spotifyAccessToken;
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      console.warn("Spotify auth failed:", res.statusText);
      return null;
    }

    const data = await res.json();
    spotifyAccessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return spotifyAccessToken;
  } catch (err) {
    console.warn("Spotify token fetch error:", err.message);
    return null;
  }
}

export async function getSpotifyArtist(artistId) {
  const token = await getSpotifyToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const memoryCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

function formatDurationMs(ms) {
  if (!ms) return "3:30";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function normalizeSpotifyTrack(item, category = "hits", langCode = "ta") {
  if (!item) return null;
  return {
    id: `sp_${item.id}`,
    spotifyId: item.id,
    title: item.name,
    artist: item.artists ? item.artists.map((a) => a.name).join(", ") : "Unknown Artist",
    category: category || "hits",
    language: langCode,
    audioUrl: item.preview_url || "",
    embedUrl: `https://open.spotify.com/embed/track/${item.id}`,
    spotifyUrl: item.external_urls?.spotify || `https://open.spotify.com/track/${item.id}`,
    coverUrl: item.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
    duration: formatDurationMs(item.duration_ms),
    durationSecs: Math.floor((item.duration_ms || 210000) / 1000),
    popularity: item.popularity || 70,
    album: item.album?.name || "Single",
    releaseDate: item.album?.release_date || "2025",
    hasPreview: Boolean(item.preview_url),
    source: "spotify",
  };
}

/**
 * Search Spotify Tracks with Language Awareness & Pagination
 */
export async function searchSpotifyTracks({ query, category, language = "ta", page = 1, limit = 20 }) {
  const langConfig = getLanguageConfig(language);
  const cacheKey = `sp:tracks:${query || ""}:${category || ""}:${language}:${page}:${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const token = await getSpotifyToken();
  const offset = (page - 1) * limit;

  if (!token) {
    return getFallbackTracks({ query, category, language, page, limit });
  }

  try {
    let searchQuery = query ? query.trim() : "";
    if (!searchQuery) {
      if (category === "latest") searchQuery = langConfig.musicQueries.latest;
      else if (category === "trending") searchQuery = langConfig.musicQueries.trending;
      else if (category === "melody" || category === "melodies") searchQuery = langConfig.musicQueries.melodies;
      else searchQuery = `${langConfig.name} songs`;
    } else {
      searchQuery = `${searchQuery} ${langConfig.name}`;
    }

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      searchQuery
    )}&type=track&limit=${limit}&offset=${offset}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return getFallbackTracks({ query, category, language, page, limit });
    }

    const data = await res.json();
    const tracks = (data.tracks?.items || [])
      .map((item) => normalizeSpotifyTrack(item, category, language))
      .filter(Boolean);

    const result = {
      tracks,
      total: data.tracks?.total || tracks.length,
      page,
      limit,
      language: langConfig.code,
      languageName: langConfig.name,
      hasMore: offset + tracks.length < (data.tracks?.total || 0),
    };

    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn("Spotify search error:", err.message);
    return getFallbackTracks({ query, category, language, page, limit });
  }
}

/**
 * Get Spotify Playlists for Language
 */
export async function getSpotifyPlaylists({ language = "ta", limit = 10 }) {
  const langConfig = getLanguageConfig(language);
  const cacheKey = `sp:playlists:${language}:${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const token = await getSpotifyToken();
  if (!token) {
    return getFallbackPlaylists(language);
  }

  try {
    const q = `${langConfig.name} Top Hits`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=playlist&limit=${limit}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!res.ok) return getFallbackPlaylists(language);
    const data = await res.json();

    const playlists = (data.playlists?.items || [])
      .filter(Boolean)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || `${langConfig.name} Hits Playlist`,
        coverUrl: p.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
        spotifyUrl: p.external_urls?.spotify,
        embedUrl: `https://open.spotify.com/embed/playlist/${p.id}`,
        trackCount: p.tracks?.total || 30,
        owner: p.owner?.display_name || "Spotify",
      }));

    const result = { playlists, language: langConfig.code, languageName: langConfig.name };
    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    return getFallbackPlaylists(language);
  }
}

/**
 * Get Multi-Category Spotify Recommendations for User's Language
 */
export async function getSpotifyRecommendations({ language = "ta" }) {
  const langConfig = getLanguageConfig(language);
  const [latestRes, trendingRes, popularRes, playlistsRes] = await Promise.all([
    searchSpotifyTracks({ query: langConfig.musicQueries.latest, category: "latest", language, limit: 8 }),
    searchSpotifyTracks({ query: langConfig.musicQueries.trending, category: "trending", language, limit: 8 }),
    searchSpotifyTracks({ query: langConfig.musicQueries.popular, category: "popular", language, limit: 8 }),
    getSpotifyPlaylists({ language, limit: 6 }),
  ]);

  return {
    language: langConfig.code,
    languageName: langConfig.name,
    latest: latestRes?.tracks || [],
    trending: trendingRes?.tracks || [],
    popular: popularRes?.tracks || [],
    playlists: playlistsRes?.playlists || [],
    artists: langConfig.musicQueries.artists,
  };
}

/**
 * Fallback Playlists & Tracks per language
 */
function getFallbackPlaylists(language = "ta") {
  const langConfig = getLanguageConfig(language);
  return {
    playlists: [
      {
        id: `pl_${langConfig.code}_01`,
        name: `${langConfig.name} Top 50 Chartbusters`,
        description: `The hottest tracks and trending hits in ${langConfig.name}`,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(langConfig.name + " Top 50")}`,
        embedUrl: `https://open.spotify.com/embed/playlist/37i9dQZF1DX14CbVH5jZpP`,
        trackCount: 50,
        owner: "MindHaven Spotify Hub",
      },
      {
        id: `pl_${langConfig.code}_02`,
        name: `${langConfig.name} Soulful Melodies & Chill`,
        description: `Relaxing and calming acoustic melodies in ${langConfig.name}`,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(langConfig.name + " Melodies")}`,
        embedUrl: `https://open.spotify.com/embed/playlist/37i9dQZF1DX4WYpdgoIcn6`,
        trackCount: 40,
        owner: "MindHaven Spotify Hub",
      },
    ],
    language: langConfig.code,
    languageName: langConfig.name,
  };
}

function getFallbackTracks({ query = "", category = "all", language = "ta", page = 1, limit = 20 }) {
  const langConfig = getLanguageConfig(language);
  const artists = langConfig.musicQueries.artists || ["Popular Artist"];
  
  const tracks = artists.slice(0, 10).map((artist, idx) => ({
    id: `trk_${langConfig.code}_${idx + 1}`,
    spotifyId: `track_${langConfig.code}_${idx + 1}`,
    title: `${langConfig.name} Hits Special - Vol. ${idx + 1}`,
    artist,
    category: category || "hits",
    language: langConfig.code,
    audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(idx % 16) + 1}.mp3`,
    embedUrl: `https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT`,
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(artist + " " + langConfig.name)}`,
    coverUrl: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&q=80",
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&q=80",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80",
    ][idx % 6],
    duration: "4:35",
    durationSecs: 275,
    popularity: 85 - idx * 2,
    album: `${artist} Best Hits`,
    releaseDate: "2025",
    hasPreview: true,
    source: "spotify",
  }));

  let filtered = tracks;
  if (query && !query.includes("latest") && !query.includes("trending") && !query.includes("hits") && !query.includes("songs")) {
    const q = query.toLowerCase();
    const matched = tracks.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
    if (matched.length > 0) filtered = matched;
  }

  return {
    tracks: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    page,
    limit,
    language: langConfig.code,
    languageName: langConfig.name,
    hasMore: page * limit < filtered.length,
  };
}
