import MediaFavorite from "../models/MediaFavorite.js";

export const ALL_MEMES = [
  // 1. College
  {
    id: "meme_col_01",
    title: "Monday Morning Semester Exam vs Me",
    caption: "எல்லா கேள்விக்கும் பதில் தெரியும்... ஆனா எந்த கேள்விக்கு எது பதில்னு தெரியலையே! 😂",
    category: "college",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    likes: 1420,
    shares: 328,
    tags: "college exam monday study funny semester",
  },
  {
    id: "meme_col_02",
    title: "Tea & Samosa after a 3-Hour Continuous Lecture",
    caption: "ஒரு கப் ஸ்ட்ராங் டீ... மனசுக்கு நிம்மதி! ☕✨",
    category: "college",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80",
    likes: 980,
    shares: 240,
    tags: "college canteen tea samosa lecture friends",
  },
  // 2. Tech & Coding
  {
    id: "meme_tech_01",
    title: "Debugging in Dark Mode at 2 AM",
    caption: "ஒரு error-அ சரி பண்ணா 10 புது error வருது. இதுதான் கோடிங் வாழ்க்கை! 🐛💻",
    category: "tech",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
    likes: 2150,
    shares: 645,
    tags: "tech coding programming developer bugs dark mode",
  },
  {
    id: "meme_tech_02",
    title: "Git Commit: 'Fixed Final Final Bug For Real'",
    caption: "Production deploy ஆன அப்புறம் சர்வர்: 'நான் வரவா?' 😭🔥",
    category: "tech",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
    likes: 1870,
    shares: 512,
    tags: "tech git github commit bugs deploy",
  },
  // 3. Friendship
  {
    id: "meme_frnd_01",
    title: "Best Friends Group Study Expectations vs Reality",
    caption: "5 நிமிஷம் படிப்பு... 5 மணி நேரம் அரட்டை! ஆனால் எக்ஸாம்ல எல்லாரும் பாஸ்! 👭🎉",
    category: "friendship",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
    likes: 3100,
    shares: 980,
    tags: "friendship best friends group study hostel gossip",
  },
  {
    id: "meme_frnd_02",
    title: "That One Friend Who Knows Everything About Everyone",
    caption: "நண்பன்: 'நீ கேட்கவே வேணாம், காலேஜ்ல என்ன நடந்துச்சுனு நான் சொல்றேன்!' 🕵️‍♂️😂",
    category: "friendship",
    imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80",
    likes: 1650,
    shares: 430,
    tags: "friendship friend spy gossip secrets funny",
  },
  // 4. Funny & Sleep
  {
    id: "meme_fun_01",
    title: "Trying to Sleep at 11 PM vs 3 AM Brain",
    caption: "மூளை: 'நியாபகம் இருக்கா 5 வருஷத்துக்கு முன்னாடி ஒருத்தன் கிட்ட அப்படி பேசுனியே?' Me: 🥲",
    category: "funny",
    imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80",
    likes: 2400,
    shares: 720,
    tags: "funny sleep midnight thoughts overthinking brain",
  },
  {
    id: "meme_fun_02",
    title: "Alarm at 6:00 AM, 6:05 AM, 6:10 AM, 6:15 AM",
    caption: "Me at 8:30 AM: 'என்னை யார் எழுப்புவா?' ⏰😴",
    category: "funny",
    imageUrl: "https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&q=80",
    likes: 1980,
    shares: 610,
    tags: "funny morning alarm late sleep snooze",
  },
  // 5. Motivation
  {
    id: "meme_mot_01",
    title: "Placement Day Confidence Booster",
    caption: "HR: 'What is your biggest strength?' Me: 'I can survive anything including 8 AM classes!' 💪🔥",
    category: "motivation",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
    likes: 2890,
    shares: 840,
    tags: "motivation placement interview job hr confidence",
  },
  // 6. Tamil Cinema
  {
    id: "meme_cin_01",
    title: "Watching Favorite Hero Intro Scene in Theater",
    caption: "First day first show popcorn பறக்க விடுற தருணம்! 🍿⚡",
    category: "cinema",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
    likes: 3450,
    shares: 1100,
    tags: "cinema movie hero intro theater fdfs popcorn",
  },
  // 7. Love & Crush
  {
    id: "meme_lov_01",
    title: "When Your Crush Passes by Your Classroom",
    caption: "நண்பர்கள் எல்லாரும் என்னை பாக்குற லுக்... 'டேய் அங்க பாருடா!' 🥰👀",
    category: "love",
    imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80",
    likes: 2750,
    shares: 890,
    tags: "love crush classroom romance friends teasing",
  },
  // 8. Attitude
  {
    id: "meme_att_01",
    title: "Walking Out After Submitting Assignment 1 Minute Before Deadline",
    caption: "Mission Passed! + Respect 🔥😎",
    category: "attitude",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
    likes: 3120,
    shares: 950,
    tags: "attitude deadline assignment boss swag cool",
  },
  // 9. Animals & Pets
  {
    id: "meme_pet_01",
    title: "Doggo Waiting for Weekend Treat",
    caption: "வெள்ளிக்கிழமை ஈவ்னிங் வந்தா போதும்... மனசெல்லாம் கொண்டாட்டம்! 🐶❤️",
    category: "animals",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80",
    likes: 4200,
    shares: 1350,
    tags: "animals dog puppy cute happy weekend pet",
  },
  // 10. Trending
  {
    id: "meme_trd_01",
    title: "Weekend Plans: 14 Hours Sleep + Endless Scrolling",
    caption: "திங்கட்கிழமை வரை என்னை யாரும் தொந்தரவு செய்யக்கூடாது! 🛋️✨",
    category: "trending",
    imageUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=600&q=80",
    likes: 3900,
    shares: 1210,
    tags: "trending weekend chill relax sleep scrolling",
  },
];

export const MEME_CATEGORIES = [
  { id: "all", label: "அனைத்தும் (All)", icon: "🔥" },
  { id: "college", label: "கல்லூரி வாழ்க்கை (College)", icon: "🎓" },
  { id: "tech", label: "கோடிங் & டெக் (Tech)", icon: "💻" },
  { id: "friendship", label: "நண்பர்கள் (Friendship)", icon: "🤝" },
  { id: "funny", label: "நகைச்சுவை (Funny)", icon: "😂" },
  { id: "motivation", label: "பாசிட்டிவ் வைப்ஸ் (Positive)", icon: "✨" },
  { id: "cinema", label: "தமிழ் சினிமா (Cinema)", icon: "🎬" },
  { id: "love", label: "காதல் & க்ரஷ் (Love)", icon: "❤️" },
  { id: "attitude", label: "கெத்து & ஆட்டிடியூட் (Attitude)", icon: "😎" },
  { id: "animals", label: "செல்லப்பிராணிகள் (Pets)", icon: "🐶" },
  { id: "trending", label: "பிரபலம் (Trending)", icon: "⚡" },
];

/**
 * GET /api/memes/list
 */
export async function getMemes(req, res) {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    let list = [...ALL_MEMES];

    if (category && category !== "all") {
      list = list.filter((m) => m.category === category);
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.caption.toLowerCase().includes(q) ||
          (m.tags && m.tags.toLowerCase().includes(q))
      );
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = list.slice(startIndex, startIndex + Number(limit));

    const favorites = await MediaFavorite.find({
      user: req.user._id,
      mediaType: "meme",
    });
    const favSet = new Set(favorites.map((f) => f.mediaId));

    const enriched = paginated.map((m) => ({
      ...m,
      isLiked: favSet.has(m.id),
    }));

    res.json({
      memes: enriched,
      categories: MEME_CATEGORIES,
      total: list.length,
      page: Number(page),
      hasMore: startIndex + Number(limit) < list.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/memes/like
 */
export async function toggleMemeLike(req, res) {
  try {
    const meme = req.body.meme || req.body.track || req.body.data;
    if (!meme || !meme.id) return res.status(400).json({ error: "Meme required" });

    const existing = await MediaFavorite.findOne({
      user: req.user._id,
      mediaType: "meme",
      mediaId: meme.id,
    });

    if (existing) {
      await MediaFavorite.findByIdAndDelete(existing._id);
      return res.json({ isLiked: false, message: "Unliked" });
    }

    await MediaFavorite.create({
      user: req.user._id,
      mediaType: "meme",
      mediaId: meme.id,
      title: meme.title,
      data: meme,
    });

    res.json({ isLiked: true, message: "Liked & saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/memes/favorites
 */
export async function getFavoriteMemes(req, res) {
  try {
    const favorites = await MediaFavorite.find({
      user: req.user._id,
      mediaType: "meme",
    }).sort({ createdAt: -1 });

    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
