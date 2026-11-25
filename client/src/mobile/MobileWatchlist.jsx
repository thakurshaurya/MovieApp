import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const POSTER = "https://image.tmdb.org/t/p/w342";

export default function MobileWatchlist() {
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
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="m-page">
        <h1 className="m-page-title">My List</h1>
        <p style={{ color: "#94a3b8", marginBottom: 16 }}>Sign in to sync your Watchlist across Phone, TV, and Web.</p>
        <button type="button" className="m-btn-play" style={{ width: "100%" }} onClick={() => navigate("/login")}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="m-page">
      <h1 className="m-page-title">My List</h1>
      {loading ? (
        <div className="m-loading">Loading...</div>
      ) : items.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>Your list is empty.</p>
      ) : (
        <div className="m-grid">
          {items.map((item) => (
            <Link key={`${item.mediaType}-${item.tmdbId}`} to={`/title/${item.mediaType}/${item.tmdbId}`} className="m-card">
              {item.posterPath ? (
                <img src={`${POSTER}${item.posterPath}`} alt={item.title} className="m-card-img" loading="lazy" />
              ) : (
                <div className="m-card-img" style={{ display: "grid", placeItems: "center", fontSize: 10 }}>ANTARCTIC</div>
              )}
              <div className="m-card-title">{item.title}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
