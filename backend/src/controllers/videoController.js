import MediaFavorite from "../models/MediaFavorite.js";
import MediaHistory from "../models/MediaHistory.js";
import { searchYouTubeVideos } from "../services/youtubeService.js";

export const ALL_VIDEOS = [
  // 1. Trending
  {
    id: "vid_trend_01",
    title: "Dr. APJ Abdul Kalam Golden Words for Youth (Tamil)",
    speaker: "Dr. APJ Abdul Kalam Memorial Guild",
    category: "trending",
    embedUrl: "https://www.youtube.com/embed/nptX8yYf_n0",
    youtubeUrl: "https://www.youtube.com/watch?v=nptX8yYf_n0",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80",
    duration: "12:40",
    views: "2.4M",
    tags: "trending motivation abdul kalam inspirational youth tamil",
    language: "ta",
  },
  {
    id: "vid_trend_02",
    title: "AR Rahman Live Performance - Iconic Tamil Hits Journey",
    speaker: "Tamil Music Concerts",
    category: "trending",
    embedUrl: "https://www.youtube.com/embed/kJQP7kiw5Fk",
    youtubeUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
    duration: "18:22",
    views: "3.8M",
    tags: "trending music concert rahman tamil live",
    language: "ta",
  },
  // 2. Education & Study Tips
  {
    id: "vid_edu_01",
    title: "நேர மேலாண்மை மற்றும் தேர்வு வெற்றி உத்திகள் (Focus Techniques)",
    speaker: "Tamil Education Hub",
    category: "education",
    embedUrl: "https://www.youtube.com/embed/n3Xv_g3g-mA",
    youtubeUrl: "https://www.youtube.com/watch?v=n3Xv_g3g-mA",
    thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
    duration: "15:20",
    views: "890K",
    tags: "education study tips exam focus memory productivity",
    language: "ta",
  },
  {
    id: "vid_edu_02",
    title: "How to Build Consistent Habits - Atomic Habits Tamil Summary",
    speaker: "Knowledge Booster Tamil",
    category: "education",
    embedUrl: "https://www.youtube.com/embed/inpok4MKVLM",
    youtubeUrl: "https://www.youtube.com/watch?v=inpok4MKVLM",
    thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80",
    duration: "14:15",
    views: "620K",
    tags: "education habits self improvement book summary tamil",
    language: "ta",
  },
  // 3. Comedy & Campus Fun
  {
    id: "vid_com_01",
    title: "கல்லூரி வாழ்க்கை நகைச்சுவை (Relatable College Comedy Moments)",
    speaker: "Tamil Campus Humor",
    category: "comedy",
    embedUrl: "https://www.youtube.com/embed/5qap5aO4i9A",
    youtubeUrl: "https://www.youtube.com/watch?v=5qap5aO4i9A",
    thumbnail: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=500&q=80",
    duration: "8:15",
    views: "1.5M",
    tags: "comedy college fun humor friends vadivelu laughs",
    language: "ta",
  },
  {
    id: "vid_com_02",
    title: "Software Engineer Life vs Student Expectations (Funny Comedy)",
    speaker: "Tech Fun Tamil",
    category: "comedy",
    embedUrl: "https://www.youtube.com/embed/OPf0YbXqDm0",
    youtubeUrl: "https://www.youtube.com/watch?v=OPf0YbXqDm0",
    thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80",
    duration: "9:40",
    views: "980K",
    tags: "comedy tech engineer fun interview humor",
    language: "ta",
  },
  // 4. Music & Audio Performances
  {
    id: "vid_mus_01",
    title: "Sid Sriram Soulful Live Acoustic Performance (Tamil)",
    speaker: "Sid Sriram Music Live",
    category: "music",
    embedUrl: "https://www.youtube.com/embed/fJ9rUzIMcZQ",
    youtubeUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
    duration: "11:05",
    views: "2.1M",
    tags: "music live performance sid sriram melody acoustic",
    language: "ta",
  },
  {
    id: "vid_mus_02",
    title: "Ilaiyaraaja Magical Symphony Orchestra (Live Concert)",
    speaker: "Maestro Ilaiyaraaja Foundation",
    category: "music",
    embedUrl: "https://www.youtube.com/embed/V1bFr2SWP1I",
    youtubeUrl: "https://www.youtube.com/watch?v=V1bFr2SWP1I",
    thumbnail: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=500&q=80",
    duration: "25:30",
    views: "4.5M",
    tags: "music ilaiyaraaja symphony classical maestro live",
    language: "ta",
  },
  // 5. Motivation & Mental Clarity
  {
    id: "vid_mot_01",
    title: "தோல்வியை கண்டு அஞ்சாதே - Powerful Tamil Speech",
    speaker: "Gopinath Inspirational Hub",
    category: "motivation",
    embedUrl: "https://www.youtube.com/embed/ZXsQAXx_ao0",
    youtubeUrl: "https://www.youtube.com/watch?v=ZXsQAXx_ao0",
    thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80",
    duration: "10:30",
    views: "1.9M",
    tags: "motivation speech gopinath confidence mental strength failure success",
    language: "ta",
  },
  {
    id: "vid_mot_02",
    title: "மன அழுத்தம் போக்கும் 10 நிமிட தியானம் (10-Min Guided Meditation)",
    speaker: "Mindful Tamil",
    category: "motivation",
    embedUrl: "https://www.youtube.com/embed/inpok4MKVLM",
    youtubeUrl: "https://www.youtube.com/watch?v=inpok4MKVLM",
    thumbnail: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=500&q=80",
    duration: "10:00",
    views: "750K",
    tags: "motivation meditation calm peace anxiety stress relief tamil",
    language: "ta",
  },
  // 6. Technology & Coding
  {
    id: "vid_tech_01",
    title: "Python Programming Full Course in Tamil for Beginners",
    speaker: "Tamil Tech Academy",
    category: "technology",
    embedUrl: "https://www.youtube.com/embed/rfscVS0vtbw",
    youtubeUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80",
    duration: "45:00",
    views: "1.2M",
    tags: "technology python coding programming beginners tutorial",
    language: "ta",
  },
  {
    id: "vid_tech_02",
    title: "Web Development Roadmap 2026 (HTML, CSS, React, Node)",
    speaker: "Code With Tamil",
    category: "technology",
    embedUrl: "https://www.youtube.com/embed/nu_pCVPKzTk",
    youtubeUrl: "https://www.youtube.com/watch?v=nu_pCVPKzTk",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80",
    duration: "20:10",
    views: "540K",
    tags: "technology web dev frontend react backend coding roadmap",
    language: "ta",
  },
  // 7. Artificial Intelligence
  {
    id: "vid_ai_01",
    title: "How Large Language Models & ChatGPT Actually Work (Tamil)",
    speaker: "AI Tamil Master",
    category: "ai",
    embedUrl: "https://www.youtube.com/embed/zjkBMFhNj_g",
    youtubeUrl: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80",
    duration: "16:45",
    views: "430K",
    tags: "ai artificial intelligence chatgpt machine learning deep learning neural networks",
    language: "ta",
  },
  {
    id: "vid_ai_02",
    title: "Top 10 AI Tools Every Student Must Know in 2026",
    speaker: "Tech Knowledge Hub",
    category: "ai",
    embedUrl: "https://www.youtube.com/embed/jNQXAC9IVRw",
    youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    duration: "13:20",
    views: "610K",
    tags: "ai tools productivity student student tools gemini chatgpt",
    language: "ta",
  },
  // 8. Entertainment
  {
    id: "vid_ent_01",
    title: "Top 10 Blockbuster Tamil Movies Behind The Scenes Secrets",
    speaker: "Cinema World Tamil",
    category: "entertainment",
    embedUrl: "https://www.youtube.com/embed/kJQP7kiw5Fk",
    youtubeUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    thumbnail: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80",
    duration: "14:30",
    views: "1.1M",
    tags: "entertainment cinema movie bts vijay rajini ajith tamil",
    language: "ta",
  },
  // 9. Tamil Videos
  {
    id: "vid_tam_01",
    title: "தமிழ் மொழி வரலாறு & பெருமை (Glorious History of Tamil)",
    speaker: "Tamil Heritage Society",
    category: "tamil",
    embedUrl: "https://www.youtube.com/embed/nptX8yYf_n0",
    youtubeUrl: "https://www.youtube.com/watch?v=nptX8yYf_n0",
    thumbnail: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=500&q=80",
    duration: "22:15",
    views: "820K",
    tags: "tamil language history thirukkural literature sangam heritage",
    language: "ta",
  },
  // 10. Latest
  {
    id: "vid_lat_01",
    title: "Future of Tech in India 2026 & Career Opportunities",
    speaker: "Tech Trends Tamil",
    category: "latest",
    embedUrl: "https://www.youtube.com/embed/rfscVS0vtbw",
    youtubeUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&q=80",
    duration: "18:00",
    views: "340K",
    tags: "latest future tech career jobs 2026 engineering",
    language: "ta",
  },
];

export const VIDEO_CATEGORIES = [
  { id: "all", label: "அனைத்தும் (All)", icon: "🎬" },
  { id: "trending", label: "டிரெண்டிங் (Trending)", icon: "🔥" },
  { id: "education", label: "கல்வி (Education)", icon: "📚" },
  { id: "comedy", label: "நகைச்சுவை (Comedy)", icon: "😂" },
  { id: "music", label: "இசை நிகழ்ச்சிகள் (Music)", icon: "🎵" },
  { id: "motivation", label: "தன்னம்பிக்கை (Motivation)", icon: "💪" },
  { id: "technology", label: "தொழில்நுட்பம் (Tech & Coding)", icon: "💻" },
  { id: "ai", label: "செயற்கை நுண்ணறிவு (AI)", icon: "🤖" },
  { id: "entertainment", label: "பொழுதுபோக்கு (Entertainment)", icon: "🍿" },
  { id: "tamil", label: "தமிழ் சிறப்பு (Tamil Specials)", icon: "🏛️" },
  { id: "latest", label: "புதிய வீடியோக்கள் (Latest)", icon: "✨" },
];

/**
 * GET /api/video/list (Supports Pagination & YouTube Search)
 */
export async function getVideos(req, res) {
  try {
    const { category, search, language = req.user?.preferredLanguage || "ta", page = 1, limit = 20 } = req.query;

    // 1. YouTube Data API v3 if API key configured
    if (process.env.YOUTUBE_API_KEY) {
      const ytRes = await searchYouTubeVideos({
        query: search,
        category,
        language,
        page: Number(page),
        limit: Number(limit),
      });
      if (ytRes && ytRes.videos.length > 0) {
        const favorites = req.user?._id ? await MediaFavorite.find({ user: req.user._id, mediaType: "video" }) : [];
        const favSet = new Set(favorites.map((f) => f.mediaId));
        return res.json({
          videos: ytRes.videos.map((v) => ({ ...v, isFavorite: favSet.has(v.id) })),
          categories: VIDEO_CATEGORIES,
          total: ytRes.total,
          page: Number(page),
        });
      }
    }

    // 2. Fallback to Scalable Library with Pagination
    let list = [...ALL_VIDEOS];

    if (category && category !== "all") {
      list = list.filter((v) => v.category === category);
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.speaker.toLowerCase().includes(q) ||
          (v.tags && v.tags.toLowerCase().includes(q))
      );
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = list.slice(startIndex, startIndex + Number(limit));

    const favorites = req.user?._id ? await MediaFavorite.find({
      user: req.user._id,
      mediaType: "video",
    }) : [];
    const favSet = new Set(favorites.map((f) => f.mediaId));

    const enriched = paginated.map((v) => ({
      ...v,
      isFavorite: favSet.has(v.id),
    }));

    res.json({
      videos: enriched,
      categories: VIDEO_CATEGORIES,
      total: list.length,
      page: Number(page),
      hasMore: startIndex + Number(limit) < list.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/video/recommendations
 */
export async function getVideoRecommendations(req, res) {
  try {
    const userId = req.user._id;
    const [history, favorites] = await Promise.all([
      MediaHistory.find({ user: userId, mediaType: "video" }).sort({ playedAt: -1 }).limit(10),
      MediaFavorite.find({ user: userId, mediaType: "video" }).limit(10),
    ]);

    const favCategories = new Set([
      ...history.map((h) => h.data?.category).filter(Boolean),
      ...favorites.map((f) => f.data?.category).filter(Boolean),
    ]);

    let recommended = [];
    if (favCategories.size > 0) {
      recommended = ALL_VIDEOS.filter((v) => favCategories.has(v.category));
    }

    if (recommended.length < 3) {
      for (const vid of ALL_VIDEOS) {
        if (!recommended.some((r) => r.id === vid.id)) {
          recommended.push(vid);
        }
        if (recommended.length >= 4) break;
      }
    }

    const favSet = new Set(favorites.map((f) => f.mediaId));
    res.json({
      recommendations: recommended.map((v) => ({ ...v, isFavorite: favSet.has(v.id) })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/video/favorites
 */
export async function toggleVideoFavorite(req, res) {
  try {
    const video = req.body.video || req.body.track;
    if (!video || !video.id) return res.status(400).json({ error: "Video required" });

    const existing = await MediaFavorite.findOne({
      user: req.user._id,
      mediaType: "video",
      mediaId: video.id,
    });

    if (existing) {
      await MediaFavorite.findByIdAndDelete(existing._id);
      return res.json({ isFavorite: false, message: "Removed from favorites" });
    }

    await MediaFavorite.create({
      user: req.user._id,
      mediaType: "video",
      mediaId: video.id,
      title: video.title,
      artist: video.speaker,
      data: video,
    });

    res.json({ isFavorite: true, message: "Saved to favorites" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/video/favorites
 */
export async function getVideoFavorites(req, res) {
  try {
    const favorites = await MediaFavorite.find({
      user: req.user._id,
      mediaType: "video",
    }).sort({ createdAt: -1 });

    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/video/history
 */
export async function recordVideoHistory(req, res) {
  try {
    const video = req.body.video || req.body.track;
    if (!video || !video.id) return res.status(400).json({ error: "Video required" });

    await MediaHistory.create({
      user: req.user._id,
      mediaType: "video",
      mediaId: video.id,
      title: video.title,
      artist: video.speaker,
      data: video,
      playedAt: new Date(),
    });

    res.json({ message: "Watch history recorded" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/video/history
 */
export async function getVideoHistory(req, res) {
  try {
    const history = await MediaHistory.find({
      user: req.user._id,
      mediaType: "video",
    })
      .sort({ playedAt: -1 })
      .limit(50);

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/video/history
 */
export async function clearVideoHistory(req, res) {
  try {
    await MediaHistory.deleteMany({
      user: req.user._id,
      mediaType: "video",
    });
    res.json({ message: "Video history cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/video/history/:id
 */
export async function deleteVideoHistoryItem(req, res) {
  try {
    await MediaHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      mediaType: "video",
    });
    res.json({ message: "Video history item removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
