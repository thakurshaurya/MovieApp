import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const makeToken = (user) => jwt.sign(
  { id: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || "",
  createdAt: user.createdAt
});

export async function register(req, res) {
  try {
    const { name, email, password, avatar } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ message: "Name, email and a password of at least 8 characters are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar: typeof avatar === "string" ? avatar.trim() : ""
    });

    res.status(201).json({
      token: makeToken(user),
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Could not create account." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    res.json({
      token: makeToken(user),
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Could not log in." });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve profile." });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (name && typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (avatar !== undefined && typeof avatar === "string") {
      // Prevent gigantic base64 payloads (> 200KB) if someone passes a raw data url
      if (avatar.startsWith("data:") && avatar.length > 250000) {
        return res.status(400).json({ message: "Avatar image is too large (max 200KB)." });
      }
      user.avatar = avatar.trim();
    }

    await user.save();
    res.json({
      message: "Profile updated successfully.",
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Could not update profile." });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Current password and a new password (8+ characters) are required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password does not match." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Could not change password." });
  }
}
