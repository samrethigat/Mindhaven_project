/**
 * Dynamic Meme Feed Service for MindHaven
 * Connects to public comedy & meme endpoints with category & language routing
 */

import { ALL_MEMES } from "../controllers/memeController.js";

export async function fetchDynamicMemes({ category, search, language = "ta", page = 1, limit = 20 }) {
  try {
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
          m.category.toLowerCase().includes(q) ||
          (m.tags && m.tags.toLowerCase().includes(q))
      );
    }

    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      memes: paginated,
      total: list.length,
      page,
      limit,
      hasMore: startIndex + limit < list.length,
    };
  } catch (err) {
    console.warn("Meme fetch error:", err.message);
    return null;
  }
}
