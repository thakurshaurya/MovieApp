import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  tmdbId: {
    type: Number,
    required: true
  },
  mediaType: {
    type: String,
    enum: ["movie", "tv"],
    required: true
  },
  title: {
    type: String,
    trim: true,
    default: "Untitled"
  },
  posterPath: {
    type: String,
    default: null
  },
  backdropPath: {
    type: String,
    default: null
  },
  stillPath: {
    type: String,
    default: null
  },
  overview: {
    type: String,
    default: ""
  },
  voteAverage: {
    type: Number,
    default: 0
  },
  releaseDate: {
    type: String,
    default: ""
  },
  season: {
    type: Number,
    default: 1
  },
  episode: {
    type: Number,
    default: 1
  },
  episodeTitle: {
    type: String,
    default: ""
  },
  currentTime: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Ensure efficient per-user lookup and uniqueness per title/season/episode
historySchema.index({ userId: 1, tmdbId: 1, mediaType: 1, season: 1, episode: 1 }, { unique: true });
historySchema.index({ userId: 1, lastWatchedAt: -1 });

export default mongoose.model("ViewingHistory", historySchema);
