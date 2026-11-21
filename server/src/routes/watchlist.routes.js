import { Router } from "express";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../controllers/watchlist.controller.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/", getWatchlist);
router.post("/", addToWatchlist);
router.delete("/:mediaType/:tmdbId", removeFromWatchlist);
export default router;
