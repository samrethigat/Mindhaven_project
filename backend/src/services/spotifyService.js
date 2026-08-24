/**
 * Spotify Integration & Music Service for MindHaven
 * Connects to official Spotify Web API using Client Credentials Flow
 * Provides track discovery, artist profiles, top tracks, albums, and Spotify URLs
 */

let spotifyAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Get OAuth2 Access Token from Spotify API using Client Credentials
 */
async function getSpotifyToken() {
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
    // Cache token (expire 5 minutes before actual expiry)
    tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return spotifyAccessToken;
  } catch (err) {
    console.warn("Spotify token fetch error:", err.message);
    return null;
  }
}

const memoryCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Search Spotify Tracks with Pagination & In-Memory Caching
 */
export async function searchSpotifyTracks({ query, category, language = "ta", page = 1, limit = 20 }) {
  const cacheKey = `tracks:${query}:${category}:${language}:${page}:${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const token = await getSpotifyToken();
  const offset = (page - 1) * limit;

  if (!token) {
    return null; // Fallback to built-in catalog
  }

  try {
    let searchQuery = query || "";
    if (category && category !== "all") {
      searchQuery += ` ${category}`;
    }
    if (language === "ta") {
      searchQuery += " Tamil";
    } else if (language === "hi") {
      searchQuery += " Hindi";
    } else if (language === "te") {
      searchQuery += " Telugu";
    }

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      searchQuery.trim() || "Tamil hits"
    )}&type=track&limit=${limit}&offset=${offset}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const tracks = (data.tracks?.items || []).map((item) => ({
      id: `sp_${item.id}`,
      spotifyId: item.id,
      title: item.name,
      artist: item.artists.map((a) => a.name).join(", "),
      category: category || "hits",
      audioUrl: item.preview_url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      spotifyUrl: item.external_urls?.spotify || `https://open.spotify.com/track/${item.id}`,
      coverUrl: item.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
      duration: formatDurationMs(item.duration_ms),
      durationSecs: Math.floor(item.duration_ms / 1000),
      popularity: item.popularity,
      album: item.album?.name,
      releaseDate: item.album?.release_date,
      hasPreview: Boolean(item.preview_url),
      source: "spotify",
    }));

    const result = {
      tracks,
      total: data.tracks?.total || 0,
      page,
      limit,
      hasMore: offset + tracks.length < (data.tracks?.total || 0),
    };
    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn("Spotify search error:", err.message);
    return null;
  }
}

/**
 * Fetch Artist Profile & Top Tracks from Spotify
 */
export async function getSpotifyArtist(artistQuery) {
  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    // 1. Search Artist
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistQuery)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const artist = searchData.artists?.items?.[0];
    if (!artist) return null;

    // 2. Fetch Top Tracks
    const topTracksRes = await fetch(
      `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=IN`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const topTracksData = topTracksRes.ok ? await topTracksRes.json() : { tracks: [] };

    // 3. Fetch Albums
    const albumsRes = await fetch(
      `https://api.spotify.com/v1/artists/${artist.id}/albums?limit=6&include_groups=album,single`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const albumsData = albumsRes.ok ? await albumsRes.json() : { items: [] };

    return {
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      followers: artist.followers?.total,
      popularity: artist.popularity,
      imageUrl: artist.images?.[0]?.url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
      spotifyUrl: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`,
      topTracks: (topTracksData.tracks || []).map((item) => ({
        id: `sp_${item.id}`,
        spotifyId: item.id,
        title: item.name,
        artist: item.artists.map((a) => a.name).join(", "),
        audioUrl: item.preview_url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        spotifyUrl: item.external_urls?.spotify,
        coverUrl: item.album?.images?.[0]?.url,
        duration: formatDurationMs(item.duration_ms),
      })),
      albums: (albumsData.items || []).map((album) => ({
        id: album.id,
        name: album.name,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
        coverUrl: album.images?.[0]?.url,
        spotifyUrl: album.external_urls?.spotify,
      })),
    };
  } catch (err) {
    console.warn("Spotify artist fetch error:", err.message);
    return null;
  }
}

function formatDurationMs(ms) {
  if (!ms) return "3:30";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
