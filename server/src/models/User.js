import mongoose from "mongoose";

const watchlistItemSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true },
  mediaType: { type: String, enum: ["movie", "tv"], required: true },
  title: { type: String, default: "" },
  posterPath: { type: String, default: null },
  backdropPath: { type: String, default: null },
  voteAverage: { type: Number, default: 0 },
  releaseDate: { type: String, default: "" },
  overview: { type: String, default: "" },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "" },
  watchlist: [watchlistItemSchema]
}, { timestamps: true });

export default mongoose.model("User", userSchema);
