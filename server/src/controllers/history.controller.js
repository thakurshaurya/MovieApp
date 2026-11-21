import ViewingHistory from "../models/ViewingHistory.js";
import { invalidateAiCache } from "./recommendation.controller.js";

export async function getHistory(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const history = await ViewingHistory.find({ userId: req.user.id })
      .sort({ lastWatchedAt: -1 })
      .limit(limit);
    res.json(history);
  } catch (error) {
    console.error("getHistory error:", error);
    res.status(500).json({ message: "Could not fetch viewing history." });
  }
}

export async function recordHistory(req, res) {
  try {
    const {
      tmdbId,
      mediaType,
      title,
      posterPath,
      backdropPath,
      stillPath,
      overview,
      voteAverage,
      releaseDate,
      season = 1,
      episode = 1,
      episodeTitle = "",
      progress = 0,
      currentTime = 0,
      duration = 0
    } = req.body;

    const parsedTmdbId = Number(tmdbId);
    if (!Number.isInteger(parsedTmdbId) || !["movie", "tv"].includes(mediaType)) {
      return res.status(400).json({ message: "Valid tmdbId and mediaType are required." });
    }

    const s = mediaType === "tv" ? Math.max(1, Number(season) || 1) : 1;
    const e = mediaType === "tv" ? Math.max(1, Number(episode) || 1) : 1;
    const curTime = Math.max(0, Number(currentTime) || 0);
    const dur = Math.max(0, Number(duration) || 0);
    const calculatedProgress =
      dur > 0 ? Math.min(100, Math.round((curTime / dur) * 100)) : Number(progress) || 0;
    const validProgress = Math.max(0, Math.min(100, calculatedProgress));

    // For TV series, if stillPath is missing, fetch the episode still from TMDB
    let resolvedStillPath = stillPath || null;
    let resolvedEpTitle = episodeTitle || "";
    if (mediaType === "tv" && !resolvedStillPath && process.env.TMDB_API_KEY) {
      try {
        const tmdbRes = await fetch(
          `https://api.tmdb.org/3/tv/${parsedTmdbId}/season/${s}/episode/${e}?api_key=${process.env.TMDB_API_KEY}`
        );
        if (tmdbRes.ok) {
          const epData = await tmdbRes.json();
          if (epData.still_path) resolvedStillPath = epData.still_path;
          if (!resolvedEpTitle && epData.name) resolvedEpTitle = epData.name;
        }
      } catch {
        // Ignore fallback error
      }
    }

    const updated = await ViewingHistory.findOneAndUpdate(
      {
        userId: req.user.id,
        tmdbId: parsedTmdbId,
        mediaType,
        season: s,
        episode: e
      },
      {
        $set: {
          title: title || "Untitled",
          posterPath: posterPath || null,
          backdropPath: backdropPath || null,
          stillPath: resolvedStillPath,
          overview: overview || "",
          voteAverage: typeof voteAverage === "number" ? voteAverage : 0,
          releaseDate: releaseDate || "",
          episodeTitle: resolvedEpTitle,
          progress: validProgress,
          currentTime: curTime,
          duration: dur,
          lastWatchedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Invalidate AI recommendation cache so next request picks up new watch history immediately
    invalidateAiCache(req.user?.id);

    res.status(200).json(updated);
  } catch (error) {
    console.error("recordHistory error:", error);
    res.status(500).json({ message: "Could not record playback history." });
  }
}

export async function removeHistoryItem(req, res) {
  try {
    const { id } = req.params;
    await ViewingHistory.deleteOne({ _id: id, userId: req.user.id });
    invalidateAiCache(req.user?.id);
    res.json({ message: "History entry removed." });
  } catch (error) {
    console.error("removeHistoryItem error:", error);
    res.status(500).json({ message: "Could not remove history entry." });
  }
}

export async function clearHistory(req, res) {
  try {
    await ViewingHistory.deleteMany({ userId: req.user.id });
    invalidateAiCache(req.user?.id);
    res.json({ message: "All viewing history cleared." });
  } catch (error) {
    console.error("clearHistory error:", error);
    res.status(500).json({ message: "Could not clear history." });
  }
}
