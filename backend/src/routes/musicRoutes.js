import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getTracks,
  getArtists,
  getArtistDetails,
  getRecommendations,
  recordMusicHistory,
  getMusicHistory,
  toggleFavorite,
  getFavorites,
  getPlaylists,
  createPlaylist,
  addTrackToPlaylist,
} from "../controllers/musicController.js";

const router = Router();

router.use(protect);

router.get("/tracks", getTracks);
router.get("/artists", getArtists);
router.get("/artists/:id", getArtistDetails);
router.get("/recommendations", getRecommendations);
router.post("/history", recordMusicHistory);
router.get("/history", getMusicHistory);
router.post("/favorites", toggleFavorite);
router.get("/favorites", getFavorites);
router.get("/playlists", getPlaylists);
router.post("/playlists", createPlaylist);
router.post("/playlists/:id/add", addTrackToPlaylist);

export default router;
