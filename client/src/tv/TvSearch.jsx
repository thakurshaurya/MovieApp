import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const POSTER = "https://image.tmdb.org/t/p/w342";
const KEYS = [
  "A", "B", "C", "D", "E", "F",
  "G", "H", "I", "J", "K", "L",
  "M", "N", "O", "P", "Q", "R",
  "S", "T", "U", "V", "W", "X",
  "Y", "Z", "1", "2", "3", "4",
  "5", "6", "7", "8", "9", "0"
];

export default function TvSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api.get(`/movies/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => setResults(res.data?.results || res.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 320);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="tv-search-layout">
      <div className="tv-keyboard-panel">
        <input
          type="text"
          className="tv-search-input tv-focusable"
          placeholder="Search movies & TV shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="tv-kbd-grid">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className="tv-kbd-key tv-focusable"
              onClick={() => setQuery((q) => q + k.toLowerCase())}
            >
              {k}
            </button>
          ))}
          <button
            type="button"
            className="tv-kbd-key wide tv-focusable"
            onClick={() => setQuery((q) => q + " ")}
          >
            SPACE
          </button>
          <button
            type="button"
            className="tv-kbd-key wide tv-focusable"
            onClick={() => setQuery((q) => q.slice(0, -1))}
          >
            ⌫ DEL
          </button>
          <button
            type="button"
            className="tv-kbd-key wide tv-focusable"
            style={{ gridColumn: "span 6" }}
            onClick={() => setQuery("")}
          >
            CLEAR
          </button>
        </div>
      </div>

      <div className="tv-search-results">
        <h1 className="tv-page-title" style={{ marginBottom: 16, fontSize: 22 }}>
          {query.trim() ? `Results for "${query.trim()}"` : "Use the remote keyboard to search"}
        </h1>
        {loading ? (
          <div className="tv-loading">Searching...</div>
        ) : (
          <div className="tv-grid">
            {results
              .filter((item) => item.media_type === "movie" || item.media_type === "tv" || item.title || item.name)
              .slice(0, 24)
              .map((item) => {
                const type = item.media_type || (item.first_air_date ? "tv" : "movie");
                const label = item.title || item.name;
                return (
                  <Link key={`${type}-${item.id}`} to={`/title/${type}/${item.id}`} className="tv-card tv-focusable">
                    {item.poster_path ? (
                      <img src={`${POSTER}${item.poster_path}`} alt={label} className="tv-card-poster" loading="lazy" />
                    ) : (
                      <div className="tv-card-poster" style={{ display: "grid", placeItems: "center", fontSize: 12, color: "#64748b" }}>
                        NO POSTER
                      </div>
                    )}
                    <div className="tv-card-info">
                      <h3 className="tv-card-title">{label}</h3>
                      <span className="tv-card-sub">{type === "tv" ? "Series" : "Movie"}</span>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
