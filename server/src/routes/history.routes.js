import { Router } from "express";
import { getHistory, recordHistory, removeHistoryItem, clearHistory } from "../controllers/history.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", getHistory);
router.post("/", recordHistory);
router.delete("/clear", clearHistory);
router.delete("/:id", removeHistoryItem);

export default router;
