import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const POSTER = "https://image.tmdb.org/t/p/w342";

export default function TvWatchlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let mounted = true;
    api.get("/watchlist")
      .then((res) => {
        if (mounted) setItems(res.data || []);
      })
      .catch(() => {
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="tv-page-container">
        <h1 className="tv-page-title" style={{ marginBottom: 16 }}>My List</h1>
        <p style={{ color: "#94a3b8", marginBottom: 24 }}>Sign in to sync your Watchlist across TV, Phone, and Web.</p>
        <button type="button" className="tv-btn-primary tv-focusable" onClick={() => navigate("/login")}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="tv-page-container">
      <div className="tv-page-header">
        <h1 className="tv-page-title">My List</h1>
      </div>

      {loading ? (
        <div className="tv-loading">Loading My List...</div>
      ) : items.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>Your list is empty. Add titles from any movie or series page.</p>
      ) : (
        <div className="tv-grid">
          {items.map((item) => (
            <Link
              key={`${item.mediaType}-${item.tmdbId}`}
              to={`/title/${item.mediaType}/${item.tmdbId}`}
              className="tv-card tv-focusable"
            >
              {item.posterPath ? (
                <img src={`${POSTER}${item.posterPath}`} alt={item.title} className="tv-card-poster" loading="lazy" />
              ) : (
                <div className="tv-card-poster" style={{ display: "grid", placeItems: "center", fontSize: 12, color: "#64748b" }}>
                  ANTARCTIC
                </div>
              )}
              <div className="tv-card-info">
                <h3 className="tv-card-title">{item.title}</h3>
                <span className="tv-card-sub">{item.mediaType === "tv" ? "Series" : "Movie"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
