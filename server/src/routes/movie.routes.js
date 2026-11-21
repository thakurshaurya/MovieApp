import { Router } from "express";
import {
  getDetails,
  getHome,
  getBollywood,
  searchTitles,
  getTvSeason,
  getDiscover,
  getGenres
} from "../controllers/movie.controller.js";
import { getAiRecommendations } from "../controllers/recommendation.controller.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/home", getHome);
router.get("/bollywood", getBollywood);
router.get("/recommendations/ai", optionalAuth, getAiRecommendations);
router.post("/recommendations/ai", optionalAuth, getAiRecommendations);
router.get("/discover/:type", getDiscover);
router.get("/genres/:type", getGenres);
router.get("/search", searchTitles);
router.get("/tv/:id/season/:seasonNumber", getTvSeason);
router.get("/:type/:id", getDetails);

export default router;
