import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Trash2, Film, Tv, Play, Bookmark } from "lucide-react";
import api from "../api";
import MovieCard from "../components/MovieCard";

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    setLoading(true);
    try {
      const res = await api.get("/watchlist");
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(tmdbId, mediaType) {
    try {
      await api.delete(`/watchlist/${mediaType}/${tmdbId}`);
      setItems((prev) => prev.filter((x) => !(x.tmdbId === tmdbId && x.mediaType === mediaType)));
    } catch {
      // silently handle
    }
  }

  const filteredItems = useMemo(() => {
    if (filter === "movie") return items.filter((x) => x.mediaType === "movie");
    if (filter === "tv") return items.filter((x) => x.mediaType === "tv");
    return items;
  }, [items, filter]);

  return (
    <main className="page-shell watchlist-page">
      <div className="page-heading">
        <p className="eyebrow">SAVED COLLECTION</p>
        <div className="watchlist-title-row">
          <h1>My Watchlist</h1>
          <span className="count-badge">
            {items.length} {items.length === 1 ? "title" : "titles"}
          </span>
        </div>
        <p>Curated stories saved across all your sessions.</p>

        {/* Filter Pills */}
        <div className="filter-pills">
          <button
            className={`pill-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Titles ({items.length})
          </button>
          <button
            className={`pill-btn ${filter === "movie" ? "active" : ""}`}
            onClick={() => setFilter("movie")}
          >
            <Film size={13} /> Movies ({items.filter((x) => x.mediaType === "movie").length})
          </button>
          <button
            className={`pill-btn ${filter === "tv" ? "active" : ""}`}
            onClick={() => setFilter("tv")}
          >
            <Tv size={13} /> TV Series ({items.filter((x) => x.mediaType === "tv").length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading your watchlist...</div>
      ) : filteredItems.length > 0 ? (
        <div className="poster-grid">
          {filteredItems.map((item) => (
            <div key={`${item.mediaType}-${item.tmdbId}`} className="watchlist-card-wrapper">
              <MovieCard item={item} />
              <button
                className="watchlist-remove-btn"
                onClick={() => removeItem(item.tmdbId, item.mediaType)}
                title="Remove from watchlist"
                aria-label={`Remove ${item.title} from watchlist`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Bookmark size={36} className="empty-icon" />
          <h3>Your watchlist is empty</h3>
          <p>
            Browse through our movies and series catalogue to curate your personal collection.
          </p>
          <Link to="/explore" className="primary-button">
            Explore Collection
          </Link>
        </div>
      )}
    </main>
  );
}
