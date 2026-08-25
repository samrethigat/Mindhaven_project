/**
 * Unified Multilingual Entertainment & Recommendation Engine
 * Combines Spotify Music, YouTube Videos, and Regional Memes
 * Implements getRecommendedContent(userId, language) with dynamic user preference resolution
 */

import User from "../models/User.js";
import { getSpotifyRecommendations, searchSpotifyTracks, getSpotifyPlaylists } from "./spotifyService.js";
import { getYouTubeRecommendations, searchYouTubeVideos } from "./youtubeService.js";
import { getMemeRecommendations, fetchDynamicMemes } from "./memeService.js";
import { getLanguageConfig } from "../config/languageMappings.js";

/**
 * Get Comprehensive Personalized Content for User
 */
export async function getRecommendedContent(userId = null, languageOverride = null) {
  let preferredLang = languageOverride || "ta";

  if (userId && !languageOverride) {
    try {
      const user = await User.findById(userId).select("preferredLanguage role fullName");
      if (user?.preferredLanguage) {
        preferredLang = user.preferredLanguage;
      }
    } catch {
      // Use fallback language
    }
  }

  const langConfig = getLanguageConfig(preferredLang);

  // Parallel fetch with error isolation so one failure never blocks the others
  const [musicP, videosP, memesP] = await Promise.allSettled([
    getSpotifyRecommendations({ language: langConfig.code }),
    getYouTubeRecommendations({ language: langConfig.code }),
    getMemeRecommendations({ language: langConfig.code }),
  ]);

  const music = musicP.status === "fulfilled" ? musicP.value : { latest: [], trending: [], popular: [], playlists: [] };
  const videos = videosP.status === "fulfilled" ? videosP.value : { trending: [], comedy: [], mindfulness: [], latest: [] };
  const memes = memesP.status === "fulfilled" ? memesP.value : { trending: [], latest: [] };

  return {
    language: langConfig.code,
    languageName: langConfig.name,
    nativeName: langConfig.nativeName,
    flag: langConfig.flag,
    music: {
      latest: music.latest || [],
      trending: music.trending || [],
      popular: music.popular || [],
      playlists: music.playlists || [],
      artists: langConfig.musicQueries.artists || [],
    },
    videos: {
      trending: videos.trending || [],
      comedy: videos.comedy || [],
      mindfulness: videos.mindfulness || [],
      latest: videos.latest || [],
    },
    memes: {
      trending: memes.trending || [],
      latest: memes.latest || [],
    },
  };
}

/**
 * Universal Multilingual Search across Spotify, YouTube, and Memes
 */
export async function searchMultilingualEntertainment({ query, language = "ta", limit = 10 }) {
  const langConfig = getLanguageConfig(language);
  const [musicRes, videoRes, memeRes] = await Promise.allSettled([
    searchSpotifyTracks({ query, language: langConfig.code, limit }),
    searchYouTubeVideos({ query, language: langConfig.code, limit }),
    fetchDynamicMemes({ search: query, language: langConfig.code, limit }),
  ]);

  return {
    language: langConfig.code,
    languageName: langConfig.name,
    query,
    tracks: musicRes.status === "fulfilled" ? musicRes.value?.tracks || [] : [],
    videos: videoRes.status === "fulfilled" ? videoRes.value?.videos || [] : [],
    memes: memeRes.status === "fulfilled" ? memeRes.value?.memes || [] : [],
  };
}
