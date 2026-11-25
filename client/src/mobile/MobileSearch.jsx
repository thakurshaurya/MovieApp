import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const POSTER = "https://image.tmdb.org/t/p/w342";

export default function MobileSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      api.get(`/movies/search?q=${encodeURIComponent(q)}`)
        .then((res) => setResults(res.data?.results || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 320);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="m-page">
      <h1 className="m-page-title">Search</h1>
      <input
        type="search"
        className="m-search-box"
        placeholder="Search movies, series..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {loading ? (
        <div className="m-loading">Searching...</div>
      ) : (
        <div className="m-grid">
          {results.map((item) => {
            const type = item.media_type || (item.first_air_date ? "tv" : "movie");
            const label = item.title || item.name;
            return (
              <Link key={`${type}-${item.id}`} to={`/title/${type}/${item.id}`} className="m-card">
                {item.poster_path ? (
                  <img src={`${POSTER}${item.poster_path}`} alt={label} className="m-card-img" loading="lazy" />
                ) : (
                  <div className="m-card-img" style={{ display: "grid", placeItems: "center", fontSize: 10 }}>ANTARCTIC</div>
                )}
                <div className="m-card-title">{label}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
