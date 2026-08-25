/**
 * YouTube Integration & Video Service for MindHaven
 * Official YouTube Data API v3 with Language-Aware Discovery & Responsive Embeds
 */

import { getLanguageConfig } from "../config/languageMappings.js";

const memoryCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 mins

function normalizeYouTubeItem(item, category = "trending", langCode = "ta") {
  const videoId = item.id?.videoId || item.id;
  if (!videoId) return null;

  return {
    id: `yt_${videoId}`,
    videoId,
    title: item.snippet?.title || "Video Title",
    speaker: item.snippet?.channelTitle || "MindHaven Channel",
    category: category || "trending",
    language: langCode,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80",
    duration: "8:30",
    views: "250K",
    publishedAt: item.snippet?.publishedAt || "2025",
    description: item.snippet?.description || "",
    source: "youtube",
  };
}

/**
 * Search YouTube Videos with Language-Aware Query Expansion
 */
export async function searchYouTubeVideos({ query, category, language = "ta", page = 1, limit = 20 }) {
  const langConfig = getLanguageConfig(language);
  const cacheKey = `yt:${query || ""}:${category || ""}:${language}:${page}:${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return getFallbackVideos({ query, category, language, page, limit });
  }

  try {
    let searchQuery = query ? query.trim() : "";
    if (!searchQuery) {
      if (category === "latest") searchQuery = langConfig.videoQueries.latest;
      else if (category === "comedy") searchQuery = langConfig.videoQueries.comedy;
      else if (category === "mindfulness" || category === "wellness") searchQuery = langConfig.videoQueries.mindfulness;
      else if (category === "music") searchQuery = langConfig.videoQueries.musicVideos;
      else searchQuery = langConfig.videoQueries.trending;
    } else {
      searchQuery = `${searchQuery} ${langConfig.name}`;
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      searchQuery
    )}&type=video&videoEmbeddable=true&maxResults=${limit}&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      return getFallbackVideos({ query, category, language, page, limit });
    }

    const data = await res.json();
    const videos = (data.items || [])
      .map((item) => normalizeYouTubeItem(item, category, language))
      .filter(Boolean);

    const result = {
      videos,
      nextPageToken: data.nextPageToken,
      prevPageToken: data.prevPageToken,
      total: data.pageInfo?.totalResults || videos.length,
      page,
      limit,
      language: langConfig.code,
      languageName: langConfig.name,
    };

    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn("YouTube search error:", err.message);
    return getFallbackVideos({ query, category, language, page, limit });
  }
}

/**
 * Get Multi-Category YouTube Video Recommendations for User's Language
 */
export async function getYouTubeRecommendations({ language = "ta" }) {
  const langConfig = getLanguageConfig(language);
  const [trendingRes, comedyRes, mindfulnessRes, latestRes] = await Promise.all([
    searchYouTubeVideos({ query: langConfig.videoQueries.trending, category: "trending", language, limit: 6 }),
    searchYouTubeVideos({ query: langConfig.videoQueries.comedy, category: "comedy", language, limit: 6 }),
    searchYouTubeVideos({ query: langConfig.videoQueries.mindfulness, category: "mindfulness", language, limit: 6 }),
    searchYouTubeVideos({ query: langConfig.videoQueries.latest, category: "latest", language, limit: 6 }),
  ]);

  return {
    language: langConfig.code,
    languageName: langConfig.name,
    trending: trendingRes?.videos || [],
    comedy: comedyRes?.videos || [],
    mindfulness: mindfulnessRes?.videos || [],
    latest: latestRes?.videos || [],
  };
}

/**
 * Fallback Videos per Language
 */
function getFallbackVideos({ query = "", category = "trending", language = "ta", page = 1, limit = 20 }) {
  const langConfig = getLanguageConfig(language);
  const fallbackList = [
    {
      id: `yt_${langConfig.code}_01`,
      videoId: "inpok4MKVLM",
      title: `${langConfig.name} Guided Breathing & Anxiety Relief Session`,
      speaker: `${langConfig.name} MindHaven Wellness`,
      category: "mindfulness",
      language: langConfig.code,
      embedUrl: "https://www.youtube-nocookie.com/embed/inpok4MKVLM",
      youtubeUrl: "https://www.youtube.com/watch?v=inpok4MKVLM",
      thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80",
      duration: "5:12",
      views: "450K",
      publishedAt: "2025",
      description: `Guided calming meditation in ${langConfig.name}`,
      source: "youtube",
    },
    {
      id: `yt_${langConfig.code}_02`,
      videoId: "8jPQjJS3tdc",
      title: `${langConfig.name} Motivation: Overcoming College Stress & Pressure`,
      speaker: `${langConfig.name} Youth Channel`,
      category: "trending",
      language: langConfig.code,
      embedUrl: "https://www.youtube-nocookie.com/embed/8jPQjJS3tdc",
      youtubeUrl: "https://www.youtube.com/watch?v=8jPQjJS3tdc",
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
      duration: "8:45",
      views: "320K",
      publishedAt: "2025",
      description: `Student mindset and mental focus in ${langConfig.name}`,
      source: "youtube",
    },
    {
      id: `yt_${langConfig.code}_03`,
      videoId: "O-6f5wQXSu8",
      title: `${langConfig.name} Standup Comedy & Best Fun Moments Special`,
      speaker: `${langConfig.name} Comedy Club`,
      category: "comedy",
      language: langConfig.code,
      embedUrl: "https://www.youtube-nocookie.com/embed/O-6f5wQXSu8",
      youtubeUrl: "https://www.youtube.com/watch?v=O-6f5wQXSu8",
      thumbnail: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80",
      duration: "10:15",
      views: "780K",
      publishedAt: "2025",
      description: `High energy comedy entertainment in ${langConfig.name}`,
      source: "youtube",
    },
    {
      id: `yt_${langConfig.code}_04`,
      videoId: "kJQP7kiw5Fk",
      title: `${langConfig.name} Latest Official Hits & Melodies Jukebox`,
      speaker: `${langConfig.name} Music Studio`,
      category: "latest",
      language: langConfig.code,
      embedUrl: "https://www.youtube-nocookie.com/embed/kJQP7kiw5Fk",
      youtubeUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
      thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
      duration: "12:40",
      views: "1.2M",
      publishedAt: "2025",
      description: `Official chartbusters in ${langConfig.name}`,
      source: "youtube",
    },
  ];

  let filtered = fallbackList;
  if (query && !query.includes("trending") && !query.includes("latest") && !query.includes("videos") && !query.includes("entertainment") && !query.includes("comedy") && !query.includes("meditation")) {
    const q = query.toLowerCase();
    const matched = fallbackList.filter((v) => v.title.toLowerCase().includes(q) || v.speaker.toLowerCase().includes(q));
    if (matched.length > 0) filtered = matched;
  }

  return {
    videos: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    page,
    limit,
    language: langConfig.code,
    languageName: langConfig.name,
  };
}
