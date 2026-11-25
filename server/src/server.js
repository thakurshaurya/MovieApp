import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";
import historyRoutes from "./routes/history.routes.js";
import { renderHomePage } from "./controllers/ssr.controller.js";

dotenv.config();
const app = express();

// Serverless-friendly MongoDB connection caching
let cachedDbPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing in Vercel settings.");
  }

  if (!cachedDbPromise) {
    cachedDbPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    }).catch((err) => {
      cachedDbPromise = null;
      throw err;
    });
  }

  await cachedDbPromise;
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5001",
  "http://localhost:3000",
  "http://localhost",
  "https://localhost",
  "capacitor://localhost",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Capacitor)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.0.")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "500kb" }));

// Health check with DB status
app.get("/api/health", async (_req, res) => {
  let dbStatus = "disconnected";
  try {
    await connectDB();
    dbStatus = "connected";
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }
  res.json({
    status: "ok",
    database: dbStatus,
    mongoConfigured: Boolean(process.env.MONGO_URI)
  });
});

// Middleware to ensure DB connection before running API handlers
app.use("/api", async (req, res, next) => {
  if (req.path === "/health") return next();
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failure:", error.message);
    res.status(500).json({
      message: "Database connection failed",
      error: error.message
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/history", historyRoutes);

// Server-side render the Home page for fast first paint
app.get("/", renderHomePage);

const PORT = process.env.PORT || 5001;

if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      console.log("MongoDB connected");
      app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
}

export default app;
