import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const POSTER = "https://image.tmdb.org/t/p/w185";

const SORTS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Top Rated" },
  { value: "primary_release_date.desc", label: "Latest" }
];

export default function TvExplore({ mediaType = "movie" }) {
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [mediaType, sortBy]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    api.get(`/movies/discover/${mediaType}?page=${page}&sort_by=${encodeURIComponent(sortBy)}`)
      .then((res) => {
        if (!mounted) return;
        const list = res.data?.results || [];
        setTotalPages(res.data?.totalPages || 1);
        setItems((prev) => (page === 1 ? list : [...prev, ...list]));
      })
      .catch(() => {
        if (mounted) setError("Could not load titles. Check your connection.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [mediaType, sortBy, page]);

  return (
    <div className="tv-page-container">
      <div className="tv-page-header">
        <h1 className="tv-page-title">{mediaType === "tv" ? "TV Series" : "Movies"}</h1>
        <div className="tv-filter-pills">
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`tv-pill tv-focusable ${sortBy === s.value ? "active" : ""}`}
              onClick={() => setSortBy(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="tv-notice">{error}</div>}

      {loading && page === 1 ? (
        <div className="tv-loading">Loading {mediaType === "tv" ? "series" : "movies"}...</div>
      ) : (
        <>
          <div className="tv-grid">
            {items.map((item) => {
              const label = item.title || item.name;
              const year = (item.release_date || item.first_air_date || "").slice(0, 4);
              return (
                <Link key={`${mediaType}-${item.id}`} to={`/title/${mediaType}/${item.id}`} className="tv-card tv-focusable">
                  {item.poster_path ? (
                    <img src={`${POSTER}${item.poster_path}`} alt={label} className="tv-card-poster" loading="lazy" />
                  ) : (
                    <div className="tv-card-poster" style={{ display: "grid", placeItems: "center", fontSize: 12, color: "#64748b" }}>
                      ANTARCTIC
                    </div>
                  )}
                  <div className="tv-card-info">
                    <h3 className="tv-card-title">{label}</h3>
                    <span className="tv-card-sub">{year || (mediaType === "tv" ? "Series" : "Movie")}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {page < totalPages && (
            <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                className="tv-btn-secondary tv-focusable"
                disabled={loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
