import { Router } from "express";
import { register, login, getProfile, updateProfile, changePassword } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

// Authenticated user endpoints
router.get("/me", requireAuth, getProfile);
router.patch("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);

export default router;
