import User from "../models/User.js";

export async function getWatchlist(req, res) {
  try {
    const user = await User.findById(req.user.id).select("watchlist");
    if (!user) return res.status(404).json({ message: "User not found." });
    // Sort recently added first
    const sorted = [...(user.watchlist || [])].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    res.json(sorted);
  } catch (error) {
    console.error("getWatchlist error:", error);
    res.status(500).json({ message: "Could not fetch watchlist." });
  }
}

export async function addToWatchlist(req, res) {
  try {
    const {
      tmdbId,
      mediaType,
      title,
      posterPath,
      backdropPath,
      voteAverage,
      releaseDate,
      overview
    } = req.body;

    const parsedId = Number(tmdbId);
    if (!Number.isInteger(parsedId) || !["movie", "tv"].includes(mediaType)) {
      return res.status(400).json({ message: "Valid tmdbId and mediaType ('movie' or 'tv') are required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const exists = user.watchlist.some(
      item => item.tmdbId === parsedId && item.mediaType === mediaType
    );

    if (!exists) {
      user.watchlist.push({
        tmdbId: parsedId,
        mediaType,
        title: title || "Untitled",
        posterPath: posterPath || null,
        backdropPath: backdropPath || null,
        voteAverage: typeof voteAverage === "number" ? voteAverage : 0,
        releaseDate: releaseDate || "",
        overview: overview || "",
        addedAt: new Date()
      });
      await user.save();
    }

    res.status(201).json(user.watchlist);
  } catch (error) {
    console.error("addToWatchlist error:", error);
    res.status(500).json({ message: "Could not add to watchlist." });
  }
}

export async function removeFromWatchlist(req, res) {
  try {
    const parsedId = Number(req.params.tmdbId);
    const { mediaType } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.watchlist = user.watchlist.filter(
      item => !(item.tmdbId === parsedId && item.mediaType === mediaType)
    );
    await user.save();

    res.json(user.watchlist);
  } catch (error) {
    console.error("removeFromWatchlist error:", error);
    res.status(500).json({ message: "Could not remove from watchlist." });
  }
}
