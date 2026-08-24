import Memory from "../models/Memory.js";
import User from "../models/User.js";
import { ALL_MUSIC_TRACKS } from "../controllers/musicController.js";
import { ALL_VIDEOS } from "../controllers/videoController.js";
import { ALL_MEMES } from "../controllers/memeController.js";
import { evaluateMentalHealthDistress } from "./alertService.js";

/**
 * Universal Multilingual AI Assistant Engine for MindHaven
 * Supports 17+ Languages & Dialects (Tamil, Tanglish, Hinglish, English, etc.)
 */

export const SUPPORTED_LANGUAGES = [
  { code: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { code: "en", label: "English", flag: "🌐" },
  { code: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
  { code: "ml", label: "മലയാളം (Malayalam)", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা (Bengali)", flag: "🇮🇳" },
  { code: "mr", label: "मराठी (Marathi)", flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
  { code: "ur", label: "اردو (Urdu)", flag: "🇮🇳" },
  { code: "es", label: "Español (Spanish)", flag: "🇪🇸" },
  { code: "fr", label: "Français (French)", flag: "🇫🇷" },
  { code: "de", label: "Deutsch (German)", flag: "🇩🇪" },
  { code: "ar", label: "العربية (Arabic)", flag: "🇸🇦" },
  { code: "zh", label: "中文 (Chinese)", flag: "🇨🇳" },
  { code: "ja", label: "日本語 (Japanese)", flag: "🇯🇵" },
];

/**
 * Main AI Generation Entrypoint
 */
export async function generateAiResponse({
  user,
  message,
  conversationHistory = [],
  userMemories = [],
}) {
  const query = (message || "").trim();
  const lowerQuery = query.toLowerCase();

  // Determine active language
  let activeLang = user?.preferredLanguage || "ta";

  // Check for inline language switch command in prompt
  const langSwitch = detectLanguageSwitch(lowerQuery);
  if (langSwitch) {
    activeLang = langSwitch;
    if (user?._id) {
      await User.findByIdAndUpdate(user._id, { preferredLanguage: activeLang }).catch(() => {});
    }
  }

  // Evaluate mental health distress indicators asynchronously
  evaluateMentalHealthDistress({ user, message: query, context: "ai_chat" }).catch(() => {});

  // 1. Check for Multilingual Music / Video / Meme / Profile / Volume Action Intents
  const actionIntent = await parseMultilingualIntent({
    query,
    lowerQuery,
    user,
    activeLang,
    conversationHistory,
  });

  if (actionIntent) {
    return {
      reply: actionIntent.reply,
      action: actionIntent.action,
      language: activeLang,
    };
  }

  // 2. Multi-turn AI Response Generation (Gemini / OpenAI / OpenRouter / Groq API)
  const systemPrompt = buildSystemPrompt(user, activeLang, userMemories, conversationHistory);

  // A. Gemini API
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiReply = await callGeminiApi({
        apiKey: process.env.GEMINI_API_KEY,
        systemPrompt,
        message: query,
        conversationHistory,
      });
      if (geminiReply) {
        return { reply: geminiReply, action: null, language: activeLang };
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back:", err.message);
    }
  }

  // B. OpenAI / OpenRouter / Groq API
  const openAiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
  if (openAiKey) {
    try {
      const openAiReply = await callOpenAiCompatibleApi({
        apiKey: openAiKey,
        baseUrl: process.env.OPENROUTER_API_KEY
          ? "https://openrouter.ai/api/v1"
          : process.env.GROQ_API_KEY
          ? "https://api.groq.com/openai/v1"
          : "https://api.openai.com/v1",
        model: process.env.OPENROUTER_API_KEY
          ? "google/gemini-2.0-flash-001"
          : process.env.GROQ_API_KEY
          ? "llama-3.3-70b-versatile"
          : "gpt-4o-mini",
        systemPrompt,
        message: query,
        conversationHistory,
      });
      if (openAiReply) {
        return { reply: openAiReply, action: null, language: activeLang };
      }
    } catch (err) {
      console.warn("OpenAI-compatible API call failed, falling back:", err.message);
    }
  }

  // 3. Fallback: High-Precision Multilingual Context Engine (Multi-Turn Context Aware)
  const localReply = generateMultilingualContextReply({
    query,
    lowerQuery,
    user,
    activeLang,
    conversationHistory,
    userMemories,
  });

  return {
    reply: localReply,
    action: null,
    language: activeLang,
  };
}

/**
 * Detect Language Switching Requests
 */
function detectLanguageSwitch(text) {
  if (
    text.includes("தமிழ்ல பேசு") ||
    text.includes("தமிழ் பேசு") ||
    text.includes("தமிழில் பேசு") ||
    text.includes("change to tamil") ||
    text.includes("speak in tamil") ||
    text.includes("tamil la pesu") ||
    text.includes("tamil pesu") ||
    text.includes("tamilil pesu") ||
    text.includes("tamil ku maathu") ||
    (text.includes("tamil") && (text.includes("pesu") || text.includes("speak") || text.includes("talk") || text.includes("switch") || text.includes("change")))
  ) {
    return "ta";
  }
  if (
    text.includes("speak in english") ||
    text.includes("english la pesu") ||
    text.includes("change to english") ||
    text.includes("switch to english") ||
    text.includes("talk in english") ||
    text.includes("english pesu") ||
    (text.includes("english") && (text.includes("pesu") || text.includes("speak") || text.includes("talk") || text.includes("switch") || text.includes("change") || text.includes("bolo")))
  ) {
    return "en";
  }
  if (
    text.includes("hindi mein") ||
    text.includes("hindi me baat") ||
    text.includes("speak in hindi") ||
    text.includes("hindi la pesu") ||
    text.includes("change to hindi") ||
    text.includes("hindi bolo") ||
    (text.includes("hindi") && (text.includes("pesu") || text.includes("speak") || text.includes("talk") || text.includes("switch") || text.includes("change") || text.includes("bolo") || text.includes("baat")))
  ) {
    return "hi";
  }
  if (
    text.includes("telugu lo") ||
    text.includes("speak in telugu") ||
    text.includes("change to telugu") ||
    text.includes("telugu la pesu") ||
    (text.includes("telugu") && (text.includes("pesu") || text.includes("speak") || text.includes("talk") || text.includes("switch") || text.includes("change") || text.includes("matladu") || text.includes("matladandi")))
  ) {
    return "te";
  }
  if (
    text.includes("kannada dalli") ||
    text.includes("speak in kannada") ||
    text.includes("change to kannada") ||
    (text.includes("kannada") && (text.includes("speak") || text.includes("talk") || text.includes("switch") || text.includes("change") || text.includes("mathadi")))
  ) {
    return "kn";
  }
  if (
    text.includes("malayalathil") ||
    text.includes("speak in malayalam") ||
    text.includes("change to malayalam") ||
    (text.includes("malayalam") && (text.includes("speak") || text.includes("talk") || text.includes("switch") || text.includes("change") || text.includes("samsarikku")))
  ) {
    return "ml";
  }
  if (text.includes("speak in spanish") || text.includes("habla en espanol") || text.includes("change to spanish")) {
    return "es";
  }
  if (text.includes("speak in french") || text.includes("parle en francais") || text.includes("change to french")) {
    return "fr";
  }
  if (text.includes("speak in german") || text.includes("sprich deutsch") || text.includes("change to german")) {
    return "de";
  }
  if (text.includes("speak in arabic") || text.includes("تكلم بالعربية") || text.includes("change to arabic")) {
    return "ar";
  }
  if (text.includes("speak in chinese") || text.includes("说中文") || text.includes("change to chinese")) {
    return "zh";
  }
  if (text.includes("speak in japanese") || text.includes("日本語で話して") || text.includes("change to japanese")) {
    return "ja";
  }
  return null;
}

/**
 * Multilingual Action & Intent Parser
 */
async function parseMultilingualIntent({ query, lowerQuery, user, activeLang, conversationHistory }) {
  const userName = user?.fullName || (activeLang === "ta" ? "நண்பரே" : "Friend");

  // A. Language Switch confirmation
  const langSwitch = detectLanguageSwitch(lowerQuery);
  if (langSwitch) {
    const responses = {
      ta: `சரி ${userName} 😊 இனிமேல் நாம் தமிழில் பேசலாம். கணினி மொழி மாற்றப்பட்டுள்ளது!`,
      en: `Sure ${userName}! 😊 I will speak in English now. Your language preference has been updated.`,
      hi: `जरूर ${userName}! 😊 अब हम हिन्दी में बात करेंगे। आपकी भाषा प्राथमिकता अपडेट कर दी गई है।`,
      te: `ఖచ్చితంగా ${userName}! 😊 ఇకపై మనం తెలుగులో మాట్లాడుకుందాం.`,
      kn: `ಖಂಡಿತ ${userName}! 😊 ಇನ್ಮುಂದೆ ನಾವು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡೋಣ.`,
      ml: `തീർച്ചയായും ${userName}! 😊 ഇനി മുതൽ നമുക്ക് മലയാളത്തിൽ സംസാരിക്കാം.`,
      es: `¡Claro ${userName}! 😊 A partir de ahora hablaremos en español.`,
      fr: `Bien sûr ${userName}! 😊 Désormais, nous parlerons en français.`,
      de: `Natürlich ${userName}! 😊 Ab jetzt sprechen wir auf Deutsch.`,
      ar: `بالتأكيد ${userName}! 😊 من الآن فصاعدا سنتحدث باللغة العربية.`,
      zh: `好的 ${userName}! 😊 从现在开始我们用中文交流。`,
      ja: `かしこまりました、${userName}さん！😊 これからは日本語でお話ししましょう。`,
    };

    return {
      reply: responses[langSwitch] || responses.en,
      action: {
        type: "CHANGE_LANGUAGE",
        payload: { language: langSwitch },
      },
    };
  }

  // B. Volume Control
  if (lowerQuery.includes("volume") || lowerQuery.includes("சத்தம்")) {
    if (lowerQuery.includes("kura") || lowerQuery.includes("down") || lowerQuery.includes("குறை") || lowerQuery.includes("low")) {
      return {
        reply: activeLang === "ta" ? "சத்தம் (Volume) குறைக்கப்பட்டுள்ளது 🔉" : "Volume lowered 🔉",
        action: { type: "SET_VOLUME", payload: { volume: 0.3 } },
      };
    }
    if (lowerQuery.includes("increase") || lowerQuery.includes("high") || lowerQuery.includes("அதிகரி") || lowerQuery.includes("கூட்டு")) {
      return {
        reply: activeLang === "ta" ? "சத்தம் (Volume) அதிகரிக்கப்பட்டுள்ளது 🔊" : "Volume increased 🔊",
        action: { type: "SET_VOLUME", payload: { volume: 0.9 } },
      };
    }
    if (lowerQuery.includes("mute") || lowerQuery.includes("அமைதி")) {
      return {
        reply: activeLang === "ta" ? "ஆடியோ மியூட் செய்யப்பட்டுள்ளது 🔇" : "Audio muted 🔇",
        action: { type: "SET_VOLUME", payload: { volume: 0 } },
      };
    }
  }

  // C. Playback Control: PAUSE
  const isPause =
    lowerQuery.includes("pause") ||
    lowerQuery.includes("நிறுத்து") ||
    lowerQuery.includes("stop music") ||
    lowerQuery.includes("stop song") ||
    lowerQuery.includes("paattu stop") ||
    lowerQuery.includes("गाना रोक") ||
    lowerQuery.includes("रोक दो") ||
    lowerQuery.includes("ఆపు");

  if (isPause) {
    const pauseReplies = {
      ta: "பாடலை இடைநிறுத்தியுள்ளேன் (Paused) ⏸️. மீண்டும் இயக்க 'play' அல்லது 'தொடங்கு' என்று கூறவும்.",
      en: "Music playback has been paused ⏸️. Say 'play' or 'resume' whenever you want to continue.",
      hi: "गाना रोक दिया गया है ⏸️। दोबारा चलाने के लिए 'play' कहें।",
    };
    return {
      reply: pauseReplies[activeLang] || pauseReplies.en,
      action: { type: "PAUSE_MUSIC", payload: {} },
    };
  }

  // D. Playback Control: NEXT
  const isNext =
    lowerQuery === "next" ||
    lowerQuery.includes("next song") ||
    lowerQuery.includes("adutha paattu") ||
    lowerQuery.includes("adutha song") ||
    lowerQuery.includes("அடுத்த பாடல்") ||
    lowerQuery.includes("agla gana") ||
    lowerQuery.includes("अगला गाना");

  if (isNext) {
    const nextReplies = {
      ta: "அடுத்த பாடலை இயக்குகிறேன் ⏭️",
      en: "Playing the next song in queue ⏭️",
      hi: "अगला गाना चला रहा हूँ ⏭️",
    };
    return {
      reply: nextReplies[activeLang] || nextReplies.en,
      action: { type: "NEXT_SONG", payload: {} },
    };
  }

  // E. Playback Control: PREVIOUS
  const isPrev =
    lowerQuery === "prev" ||
    lowerQuery === "previous" ||
    lowerQuery.includes("previous song") ||
    lowerQuery.includes("munthaiya paattu") ||
    lowerQuery.includes("முந்தைய பாடல்") ||
    lowerQuery.includes("pichla gana");

  if (isPrev) {
    const prevReplies = {
      ta: "முந்தைய பாடலை இயக்குகிறேன் ⏮️",
      en: "Playing the previous track ⏮️",
      hi: "पिछला गाना चला रहा हूँ ⏮️",
    };
    return {
      reply: prevReplies[activeLang] || prevReplies.en,
      action: { type: "PREVIOUS_SONG", payload: {} },
    };
  }

  // F. Video Requests
  const isVideoQuery =
    lowerQuery.includes("video") ||
    lowerQuery.includes("வீடியோ") ||
    lowerQuery.includes("youtube") ||
    lowerQuery.includes("tutorial");

  if (isVideoQuery) {
    let matchedVideo = ALL_VIDEOS[0];

    if (lowerQuery.includes("comedy") || lowerQuery.includes("நகைச்சுவை") || lowerQuery.includes("fun")) {
      matchedVideo = ALL_VIDEOS.find((v) => v.category === "comedy") || ALL_VIDEOS[4];
    } else if (lowerQuery.includes("ai") || lowerQuery.includes("machine learning") || lowerQuery.includes("chatgpt")) {
      matchedVideo = ALL_VIDEOS.find((v) => v.category === "ai") || ALL_VIDEOS[12];
    } else if (lowerQuery.includes("python") || lowerQuery.includes("code") || lowerQuery.includes("tech") || lowerQuery.includes("development")) {
      matchedVideo = ALL_VIDEOS.find((v) => v.category === "technology") || ALL_VIDEOS[10];
    } else if (lowerQuery.includes("motivation") || lowerQuery.includes("தன்னம்பிக்கை") || lowerQuery.includes("speech")) {
      matchedVideo = ALL_VIDEOS.find((v) => v.category === "motivation") || ALL_VIDEOS[8];
    } else if (lowerQuery.includes("meditation") || lowerQuery.includes("தியானம்") || lowerQuery.includes("peace")) {
      matchedVideo = ALL_VIDEOS.find((v) => v.category === "latest") || ALL_VIDEOS[15];
    } else if (lowerQuery.includes("study") || lowerQuery.includes("exam") || lowerQuery.includes("படிப்பு")) {
      matchedVideo = ALL_VIDEOS.find((v) => v.category === "education") || ALL_VIDEOS[2];
    }

    const videoReplies = {
      ta: `கண்டிப்பாக ${userName}! உங்களுக்காக **"${matchedVideo.title}"** வீடியோவை கீழே இணைத்துள்ளேன். கிளிக் செய்து பார்க்கலாம் 🎬✨`,
      en: `Sure ${userName}! Here is the video: **"${matchedVideo.title}"** by ${matchedVideo.speaker}. Enjoy watching! 🎬✨`,
      hi: `ज़रूर ${userName}! आपके लिए **"${matchedVideo.title}"** वीडियो पेश है 🎬✨`,
    };

    return {
      reply: videoReplies[activeLang] || videoReplies.en,
      action: {
        type: "PLAY_VIDEO",
        payload: { video: matchedVideo },
      },
    };
  }

  // G. Meme Requests
  const isMemeQuery =
    lowerQuery.includes("meme") ||
    lowerQuery.includes("மீம்") ||
    lowerQuery.includes("joke") ||
    lowerQuery.includes("funny picture");

  if (isMemeQuery) {
    let matchedMeme = ALL_MEMES[0];
    if (lowerQuery.includes("tech") || lowerQuery.includes("coding")) {
      matchedMeme = ALL_MEMES.find((m) => m.category === "tech") || ALL_MEMES[2];
    } else if (lowerQuery.includes("friend") || lowerQuery.includes("நண்பன்")) {
      matchedMeme = ALL_MEMES.find((m) => m.category === "friendship") || ALL_MEMES[4];
    } else if (lowerQuery.includes("exam") || lowerQuery.includes("college")) {
      matchedMeme = ALL_MEMES.find((m) => m.category === "college") || ALL_MEMES[0];
    } else if (lowerQuery.includes("cinema") || lowerQuery.includes("movie")) {
      matchedMeme = ALL_MEMES.find((m) => m.category === "cinema") || ALL_MEMES[9];
    } else {
      matchedMeme = ALL_MEMES[Math.floor(Math.random() * ALL_MEMES.length)];
    }

    const memeReplies = {
      ta: `இதோ உங்களுக்காக ஒரு சிரிப்பான மீம் 😂:\n**"${matchedMeme.title}"**\n_${matchedMeme.caption}_`,
      en: `Here is a funny meme for you 😂:\n**"${matchedMeme.title}"**\n_${matchedMeme.caption}_`,
      hi: `यहाँ आपके लिए एक मज़ेदार मीम है 😂:\n**"${matchedMeme.title}"**\n_${matchedMeme.caption}_`,
    };

    return {
      reply: memeReplies[activeLang] || memeReplies.en,
      action: {
        type: "SHOW_MEME",
        payload: { meme: matchedMeme },
      },
    };
  }

  // H. Music Request
  const isMusicQuery =
    lowerQuery.includes("song") ||
    lowerQuery.includes("music") ||
    lowerQuery.includes("பாடல்") ||
    lowerQuery.includes("பாட்டு") ||
    lowerQuery.includes("paattu") ||
    lowerQuery.includes("gana") ||
    lowerQuery.includes("गाना") ||
    lowerQuery.includes("play");

  if (isMusicQuery) {
    let matchedSong = ALL_MUSIC_TRACKS[0];

    // Artist matches
    if (lowerQuery.includes("anirudh") || lowerQuery.includes("அனிருத்")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.tags?.includes("anirudh")) || ALL_MUSIC_TRACKS[0];
    } else if (lowerQuery.includes("yuvan") || lowerQuery.includes("யுவன்")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.tags?.includes("yuvan")) || ALL_MUSIC_TRACKS[1];
    } else if (lowerQuery.includes("rahman") || lowerQuery.includes("ரஹ்மான்") || lowerQuery.includes("ar rahman")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.tags?.includes("ar rahman")) || ALL_MUSIC_TRACKS[4];
    } else if (lowerQuery.includes("ilaiyaraaja") || lowerQuery.includes("இளையராஜா") || lowerQuery.includes("ilayaraja")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.tags?.includes("ilaiyaraaja")) || ALL_MUSIC_TRACKS[2];
    } else if (lowerQuery.includes("sid sriram") || lowerQuery.includes("சித் ஸ்ரீராம்")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.tags?.includes("sid sriram")) || ALL_MUSIC_TRACKS[3];
    } else if (lowerQuery.includes("harris") || lowerQuery.includes("ஹாரிஸ்")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.tags?.includes("harris jayaraj")) || ALL_MUSIC_TRACKS[9];
    } else if (lowerQuery.includes("spb") || lowerQuery.includes("பாலசுப்பிரமணியம்")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.tags?.includes("spb")) || ALL_MUSIC_TRACKS[12];
    } else if (lowerQuery.includes("90s") || lowerQuery.includes("old") || lowerQuery.includes("பழைய")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "90s") || ALL_MUSIC_TRACKS[12];
    } else if (lowerQuery.includes("2000s")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "2000s") || ALL_MUSIC_TRACKS[13];
    } else if (lowerQuery.includes("dance") || lowerQuery.includes("kuthu") || lowerQuery.includes("ஆட்டம்")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "dance") || ALL_MUSIC_TRACKS[8];
    } else if (lowerQuery.includes("party") || lowerQuery.includes("கொண்டாட்டம்")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "party") || ALL_MUSIC_TRACKS[9];
    } else if (lowerQuery.includes("love") || lowerQuery.includes("காதல்") || lowerQuery.includes("romantic")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "love" || s.category === "romantic") || ALL_MUSIC_TRACKS[3];
    } else if (lowerQuery.includes("happy") || lowerQuery.includes("மகிழ்ச்சி")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "happy") || ALL_MUSIC_TRACKS[7];
    } else if (lowerQuery.includes("sad") || lowerQuery.includes("peace") || lowerQuery.includes("சோகம்") || lowerQuery.includes("அமைதி")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "sad") || ALL_MUSIC_TRACKS[16];
    } else if (lowerQuery.includes("motivation") || lowerQuery.includes("வெற்றி") || lowerQuery.includes("energy")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "motivation") || ALL_MUSIC_TRACKS[5];
    } else if (lowerQuery.includes("classical") || lowerQuery.includes("carnatic") || lowerQuery.includes("கர்நாடகம்")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "classical") || ALL_MUSIC_TRACKS[10];
    } else if (lowerQuery.includes("night") || lowerQuery.includes("sleep") || lowerQuery.includes("இரவு")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "night") || ALL_MUSIC_TRACKS[18];
    } else if (lowerQuery.includes("travel") || lowerQuery.includes("பயணம்") || lowerQuery.includes("drive")) {
      matchedSong = ALL_MUSIC_TRACKS.find((s) => s.category === "travel") || ALL_MUSIC_TRACKS[19];
    }

    const musicReplies = {
      ta: `கண்டிப்பாக ${userName}! உங்களுக்காக **"${matchedSong.title}"** (${matchedSong.artist}) பாடலை இப்போது இயக்குகிறேன். கீழே உள்ள பிளேயரில் கேளுங்கள் 🎵✨`,
      en: `Sure ${userName}! Playing **"${matchedSong.title}"** by ${matchedSong.artist} for you now. Enjoy the music! 🎵✨`,
      hi: `बिल्कुल ${userName}! आपके लिए **"${matchedSong.title}"** (${matchedSong.artist}) गाना चला रहा हूँ। 🎵✨`,
    };

    return {
      reply: musicReplies[activeLang] || musicReplies.en,
      action: {
        type: "PLAY_MUSIC",
        payload: { song: matchedSong, category: matchedSong.category },
      },
    };
  }

  // I. User Profile / Identity Query
  const isProfileQuery =
    lowerQuery.includes("peru enna") ||
    lowerQuery.includes("peyar enna") ||
    lowerQuery.includes("பெயர் என்ன") ||
    lowerQuery.includes("who am i") ||
    lowerQuery.includes("my name") ||
    lowerQuery.includes("naam kya hai") ||
    lowerQuery.includes("naam kya") ||
    lowerQuery.includes("naa peru") ||
    lowerQuery.includes("enna pathi") ||
    lowerQuery.includes("what language") ||
    lowerQuery.includes("endha mozhi");

  if (isProfileQuery) {
    const profileReplies = {
      ta: `உங்கள் பெயர் **${user?.fullName || "நண்பரே"}**. ${
        user?.college ? `நீங்கள் **${user.college}** கல்லூரியில் படிக்கிறீர்கள்.` : ""
      } உங்கள் தேர்ந்தெடுக்கப்பட்ட மொழி **${activeLang.toUpperCase()}**. உங்கள் தனிப்பட்ட AI உதவியாளராக எப்போதும் உங்களுடன் இருக்கிறேன்! 🤝`,
      en: `Your name is **${user?.fullName || "Friend"}**. ${
        user?.college ? `You are studying at **${user.college}**.` : ""
      } Your selected preferred language is **${activeLang.toUpperCase()}**. I am your personal AI assistant! 🤝`,
      hi: `आपका नाम **${user?.fullName || "दोस्त"}** है। आपकी चुनी हुई भाषा **${activeLang.toUpperCase()}** है। मैं आपकी व्यक्तिगत AI सहायक हूँ! 🤝`,
    };

    return {
      reply: profileReplies[activeLang] || profileReplies.en,
      action: {
        type: "SHOW_PROFILE",
        payload: { user: user },
      },
    };
  }

  return null;
}

/**
 * Build System Prompt
 */
function buildSystemPrompt(user, activeLang, memories = [], history = []) {
  const userName = user?.fullName || "User";
  const userCollege = user?.college || "College Student";
  const userCity = user?.city || "";

  const memoryContext = memories.length > 0
    ? `\nSaved User Memories:\n${memories.map((m) => `- ${m.key}: ${m.value}`).join("\n")}`
    : "";

  return `You are "Mira" (மிரா), a warm, highly intelligent, compassionate personal AI companion and mental wellness assistant on the MindHaven platform.
You are interacting with:
- User Name: ${userName}
- Institution: ${userCollege}
- City: ${userCity}
- Active Language Preference: ${activeLang}
${memoryContext}

CRITICAL RULES:
1. Always respond in the active language (${activeLang}) unless the user explicitly asks to speak in another language.
2. If the user asks in Tanglish (Tamil written in English script) or Hinglish, understand the query accurately and respond warmly in ${activeLang === "ta" ? "Tamil / Tanglish" : "the selected language"}.
3. Always accurately know the user's name (${userName}) and never invent fabricated personal data.
4. Maintain context across multiple conversation turns.
5. Provide actionable, supportive, empathic, and uplifting responses.`;
}

/**
 * High-Precision Context Engine (Handles Deep Knowledge & Multi-Turn Queries)
 */
function generateMultilingualContextReply({ query, lowerQuery, user, activeLang, conversationHistory, userMemories }) {
  const name = user?.fullName || (activeLang === "ta" ? "நண்பரே" : "Friend");

  // Context Awareness: Check previous message for multi-turn continuity
  const prevUserMsg = [...conversationHistory].reverse().find((m) => m.role === "user")?.content?.toLowerCase() || "";

  // Multi-turn: "What are its types?" or "Tell me more"
  if (
    (lowerQuery.includes("its types") || lowerQuery.includes("types") || lowerQuery.includes("வகைகள்") || lowerQuery.includes("prakar")) &&
    (prevUserMsg.includes("machine learning") || prevUserMsg.includes("ml") || prevUserMsg.includes("ai"))
  ) {
    if (activeLang === "ta") {
      return `மெஷின் லேர்னிங்கின் (Machine Learning) முக்கிய 4 வகைகள் இதோ:\n\n1. **Supervised Learning (மேற்பார்வை கற்றல்)**: லேபிளிடப்பட்ட தரவுகளைக் கொண்டு மாடலைப் பயிற்றுவிப்பது (எ.கா: Linear Regression, Classification).\n2. **Unsupervised Learning (மேற்பார்வையற்ற கற்றல்)**: லேபிள்கள் இல்லாத மூலத் தரவுகளில் பேட்டர்ன்களைக் கண்டறிவது (எ.கா: K-Means Clustering).\n3. **Semi-Supervised Learning**: குறைந்த லேபிளிடப்பட்ட மற்றும் அதிக லேபிளிடப்படாத தரவுகளின் கலவை.\n4. **Reinforcement Learning (வலுவூட்டல் கற்றல்)**: வெற்றி மற்றும் தோல்விகள் (Reward & Penalty) அடிப்படையில் தானாகவே முடிவெடுப்பது (எ.கா: AlphaGo, Robotics).`;
    }
    return `Here are the 4 primary types of **Machine Learning (ML)**:\n\n1. **Supervised Learning**: The algorithm learns on a labeled dataset where inputs map to known outputs (e.g., Spam detection, House price prediction).\n2. **Unsupervised Learning**: Finds hidden patterns and intrinsic groupings in unlabeled data (e.g., Customer segmentation, K-Means Clustering).\n3. **Semi-Supervised Learning**: Uses a small amount of labeled data with a large amount of unlabeled data.\n4. **Reinforcement Learning**: An agent learns through trial-and-error using a reward and penalty system (e.g., Self-driving cars, Game AI).`;
  }

  // Multi-turn: "Who created it?"
  if (lowerQuery.includes("who created it") || lowerQuery.includes("who founded") || lowerQuery.includes("யார் கண்டுபிடித்தார்")) {
    if (prevUserMsg.includes("python")) {
      return activeLang === "ta"
        ? `**பைதான் (Python)** நிரலாக்க மொழியை **Guido van Rossum** என்பவர் 1989-ல் உருவாக்கத் தொடங்கி, 1991-ல் அதிகாரப்பூர்வமாக வெளியிட்டார்!`
        : `**Python** was created by Dutch programmer **Guido van Rossum** and first released in **1991** at CWI in the Netherlands.`;
    }
    if (prevUserMsg.includes("javascript") || prevUserMsg.includes("js")) {
      return activeLang === "ta"
        ? `**JavaScript** மொழியை **Brendan Eich** என்பவர் 1995-ல் நெட்ஸ்கேப் (Netscape) நிறுவனத்தில் வெறும் 10 நாட்களில் உருவாக்கினார்!`
        : `**JavaScript** was created in 1995 by **Brendan Eich** in just 10 days while working at Netscape Communications.`;
    }
  }

  // Machine Learning Query
  if (lowerQuery.includes("machine learning") || lowerQuery.includes("ml என்றால் என்ன") || lowerQuery.includes("what is ml")) {
    if (activeLang === "ta") {
      return `**மெஷின் லேர்னிங் (Machine Learning - ML)** என்பது செயற்கை நுண்ணறிவின் (AI) ஒரு முக்கிய பிரிவாகும்.\n\nகணினிகளுக்கு நேரடியாக ஒவ்வொரு வரியாக நிரல் எழுதாமல் (Explicit programming), அதுவாகவே தரவுகளிலிருந்து (Data) கற்றுக்கொண்டு தானாகவே முடிவுகளை எடுக்கும் திறனை வழங்குவதே மெஷின் லேர்னிங் ஆகும்.\n\n**முக்கிய பயன்கள்:**\n- யூடியூப் / நெட்ஃபிக்ஸ் பரிந்துரைகள் (Recommendations)\n- குரல் அறிதல் (Siri, Alexa)\n- மருத்துவ நோய் கண்டறிதல்\n- தன்னாட்சி கார்கள் (Self-driving cars)\n\nஇதன் வகைகள் அல்லது பயன்பாடுகள் குறித்து மேலும் அறிய விரும்புகிறீர்களா?`;
    }
    return `**Machine Learning (ML)** is a core branch of Artificial Intelligence (AI) that allows computer systems to learn and improve automatically from data without being explicitly programmed.\n\n**Key Applications:**\n- Content Recommendation engines (Spotify, Netflix)\n- Speech Recognition (Siri, Google Assistant)\n- Medical Diagnosis & Healthcare analytics\n- Autonomous Vehicles & Robotics\n\nWould you like to know more about its types or algorithms?`;
  }

  // Python Query
  if (lowerQuery.includes("python") && (lowerQuery.includes("what is") || lowerQuery.includes("என்ன"))) {
    if (activeLang === "ta") {
      return `**பைதான் (Python)** என்பது மிக எளிமையாகவும், மனிதர்கள் பேசும் ஆங்கிலம் போன்ற வாக்கிய அமைப்பைக் கொண்ட ஒரு சக்திவாய்ந்த High-Level Programming Language ஆகும்.\n\n**பைதான் எதற்குப் பயன்படுகிறது?**\n1. வெப் டெவலப்மென்ட் (Django, FastAPI)\n2. செயற்கை நுண்ணறிவு மற்றும் டேட்டா சயின்ஸ் (Pandas, TensorFlow, PyTorch)\n3. ஆட்டோமேஷன் மற்றும் ஸ்கிரிப்டிங்\n4. சைபர் செக்யூரிட்டி மற்றும் கேம் டெவலப்மென்ட்`;
    }
    return `**Python** is an interpreted, high-level, dynamically semantic programming language known for its clean readability and versatility.\n\n**Where is Python used?**\n1. Artificial Intelligence, Data Science & Machine Learning (TensorFlow, PyTorch, Pandas)\n2. Web Backend Development (FastAPI, Django, Flask)\n3. Automation Scripting & Cloud DevOps\n4. Cybersecurity & Scientific Computing`;
  }

  // Greetings
  if (
    lowerQuery.includes("வணக்கம்") ||
    lowerQuery.includes("vanakkam") ||
    lowerQuery.includes("hello") ||
    lowerQuery.includes("hi") ||
    lowerQuery.includes("namaste") ||
    lowerQuery.includes("namaskaram")
  ) {
    const greetings = {
      ta: `வணக்கம் ${name}! 👋 இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்? இசை கேட்கலாம், வீடியோக்கள் பார்க்கலாம், கோடிங் சந்தேகங்களைக் கேட்கலாம், அல்லது மனதை அமைதிப்படுத்தும் உரையாடலைத் தொடங்கலாம்!`,
      en: `Hello ${name}! 👋 How can I help you today? You can ask me to play songs, find videos, answer technical questions, or chat to relax!`,
      hi: `नमस्ते ${name}! 👋 मैं आज आपकी किस प्रकार सहायता कर सकती हूँ? आप मुझसे गाने सुनने, वीडियो देखने, पढ़ाई के सवाल पूछने या बातचीत करने के लिए कह सकते हैं!`,
    };
    return greetings[activeLang] || greetings.en;
  }

  // Wellness / Stress / Exam Anxiety
  if (
    lowerQuery.includes("stress") ||
    lowerQuery.includes("பயம்") ||
    lowerQuery.includes("anxious") ||
    lowerQuery.includes("exam") ||
    lowerQuery.includes("தேர்வு") ||
    lowerQuery.includes("கவலை") ||
    lowerQuery.includes("tense") ||
    lowerQuery.includes("tired")
  ) {
    const wellnessReplies = {
      ta: `${name}, கவலைப்பட வேண்டாம் 🌿. ஒரு ஆழமான மூச்சு எடுத்துக்கொள்ளுங்கள். உங்கள் முயற்சிகளில் நம்பிக்கை வையுங்கள். ஒரு சில நிமிடங்கள் மன அமைதிக்கான தியான வீடியோ அல்லது மெலடி பாடலைக் கேட்க பரிந்துரைக்கிறேன். உங்களுக்கு நான் எப்போதும் துணையாக இருக்கிறேன்!`,
      en: `${name}, take a gentle deep breath 🌿. Remember that you are capable of handling this step by step. I recommend listening to a soothing melody track or a 5-minute guided meditation. I am right here with you!`,
      hi: `${name}, चिंता मत कीजिए 🌿। एक गहरी सांस लें। आप इस स्थिति को संभालने में पूरी तरह सक्षम हैं। थोड़ी देर शांत संगीत सुनें। मैं हमेशा आपके साथ हूँ!`,
    };
    return wellnessReplies[activeLang] || wellnessReplies.en;
  }

  // General questions fallback
  const fallbacks = {
    ta: `${name}, உங்கள் செய்தியைப் புரிந்து கொண்டேன். "${query}" குறித்து உதவ நான் தயாராக உள்ளேன். நீங்கள் விரும்பினால் குறிப்பிட்ட பாடலை இயக்கவோ அல்லது வீடியோவை தேடவோ என்னிடம் கூறலாம்!`,
    en: `I understand, ${name}. I am here to help you with "${query}" or assist you with music, videos, programming, and wellness!`,
    hi: `मैं समझ गयी, ${name}। मैं "${query}" में आपकी सहायता करने और आपकी पसंद के अनुसार संगीत या वीडियो उपलब्ध कराने के लिए तैयार हूँ!`,
  };

  return fallbacks[activeLang] || fallbacks.en;
}

/**
 * Call Gemini API
 */
async function callGeminiApi({ apiKey, systemPrompt, message, conversationHistory }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood. I am Mira, your personal AI assistant." }] },
  ];

  for (const msg of conversationHistory.slice(-8)) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  contents.push({ role: "user", parts: [{ text: message }] });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

/**
 * Call OpenAI-Compatible API (OpenAI, OpenRouter, Groq)
 */
async function callOpenAiCompatibleApi({ apiKey, baseUrl, model, systemPrompt, message, conversationHistory }) {
  const messages = [{ role: "system", content: systemPrompt }];

  for (const msg of conversationHistory.slice(-8)) {
    messages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: message });

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim();
}
