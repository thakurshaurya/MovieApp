import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  Film,
  Tv,
  X,
  Sparkles,
  TrendingUp,
  Star,
  Play,
  Clock,
  ArrowRight,
  Flame
} from "lucide-react";
import api from "../api";
import MovieCard from "../components/MovieCard";

const TRENDING_SUGGESTIONS = [
  "Dune",
  "Oppenheimer",
  "Breaking Bad",
  "Interstellar",
  "The Last of Us",
  "Game of Thrones",
  "Batman",
  "Stranger Things",
  "Severance",
  "Gladiator"
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = params.get("q") || "";

  const [inputVal, setInputVal] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "movie" | "tv"
  const [trendingItems, setTrendingItems] = useState([]);

  const inputRef = useRef(null);
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Auto focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch trending titles for discovery when query is empty
  useEffect(() => {
    api.get("/movies/home")
      .then((res) => {
        const popular = [
          ...(res.data.trending || []),
          ...(res.data.popularMovies || [])
        ];
        const unique = Array.from(new Map(popular.map((m) => [m.id, m])).values());
        setTrendingItems(unique.slice(0, 12));
      })
      .catch(() => {});
  }, []);

  // Real-time instant search as user types (ultra-low 120ms debounce with request cancellation)
  useEffect(() => {
    const trimmed = inputVal.trim();

    // Sync URL parameter without reload
    if (trimmed) {
      setParams({ q: trimmed }, { replace: true });
    } else {
      setParams({}, { replace: true });
    }

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      return;
    }

    // Check memory cache first for immediate zero-latency feedback
    if (cacheRef.current.has(trimmed.toLowerCase())) {
      setResults(cacheRef.current.get(trimmed.toLowerCase()));
      setLoading(false);
      return;
    }

    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/movies/search", {
          params: { q: trimmed },
          signal: abortControllerRef.current.signal
        });

        const list = res.data.results || [];
        cacheRef.current.set(trimmed.toLowerCase(), list);
        setResults(list);
      } catch (err) {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 120); // 120ms for instant real-time typing feel

    return () => {
      clearTimeout(timer);
    };
  }, [inputVal, setParams]);

  // Filtered Results based on selected tab
  const filteredResults = useMemo(() => {
    if (filter === "movie") return results.filter((x) => x.media_type === "movie");
    if (filter === "tv") return results.filter((x) => x.media_type === "tv");
    return results;
  }, [results, filter]);

  const topMatch = filteredResults.length > 0 ? filteredResults[0] : null;
  const remainingResults = filteredResults.length > 1 ? filteredResults.slice(1) : [];

  return (
    <main className="search-realtime-page">
      {/* Search Header & Dynamic Live Input Bar */}
      <section className="search-hero-bar">
        <div className="search-bar-inner">
          <div className="live-input-container">
            <SearchIcon size={24} className="live-search-icon text-gold" />
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Start typing movie, show, director, or actor..."
              className="live-search-input"
              autoComplete="off"
              spellCheck="false"
            />
            {loading && <div className="live-typing-spinner" />}
            {inputVal && !loading && (
              <button
                className="live-clear-btn"
                onClick={() => {
                  setInputVal("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search input"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Quick Trending Keyword Pills */}
          {!inputVal && (
            <div className="trending-chips-row">
              <span className="chips-label">
                <Flame size={13} className="text-gold" /> Trending Searches:
              </span>
              <div className="chips-list">
                {TRENDING_SUGGESTIONS.map((term) => (
                  <button
                    key={term}
                    className="chip-btn"
                    onClick={() => {
                      setInputVal(term);
                      inputRef.current?.focus();
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filter Tabs when searching */}
          {results.length > 0 && (
            <div className="search-filter-tabs">
              <button
                className={`tab-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All Matches ({results.length})
              </button>
              <button
                className={`tab-btn ${filter === "movie" ? "active" : ""}`}
                onClick={() => setFilter("movie")}
              >
                <Film size={13} /> Movies ({results.filter((x) => x.media_type === "movie").length})
              </button>
              <button
                className={`tab-btn ${filter === "tv" ? "active" : ""}`}
                onClick={() => setFilter("tv")}
              >
                <Tv size={13} /> TV Shows ({results.filter((x) => x.media_type === "tv").length})
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <div className="search-content-container">
        {/* State 1: Active Results */}
        {inputVal.trim() && filteredResults.length > 0 && (
          <div className="search-results-layout">
            {/* Spotlight Top Match Highlight */}
            {topMatch && (
              <section className="top-match-card">
                <div className="top-match-badge">
                  <Sparkles size={13} /> TOP RELEVANT RESULT
                </div>
                <div className="top-match-body">
                  <div className="top-match-poster">
                    {topMatch.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${topMatch.poster_path}`}
                        alt={topMatch.title || topMatch.name}
                      />
                    ) : (
                      <div className="poster-fallback">ANTARCTIC</div>
                    )}
                  </div>
                  <div className="top-match-info">
                    <span className="top-match-tag">
                      {topMatch.media_type === "tv" ? "TELEVISION SERIES" : "FEATURE FILM"}
                    </span>
                    <h2>{topMatch.title || topMatch.name}</h2>
                    <div className="top-match-stats">
                      <span>{(topMatch.release_date || topMatch.first_air_date || "").slice(0, 4)}</span>
                      {topMatch.vote_average > 0 && (
                        <span className="rating-pill">
                          <Star size={12} fill="currentColor" /> {topMatch.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="top-match-overview">
                      {topMatch.overview
                        ? topMatch.overview.slice(0, 240) + "..."
                        : "Discover cinematic storytelling with full streaming playback."}
                    </p>
                    <div className="top-match-actions">
                      <Link
                        to={
                          topMatch.media_type === "tv"
                            ? `/watch/tv/${topMatch.id}?season=1&episode=1`
                            : `/watch/movie/${topMatch.id}`
                        }
                        className="primary-button small-btn"
                      >
                        <Play size={15} fill="currentColor" /> Watch Now
                      </Link>
                      <Link
                        to={`/title/${topMatch.media_type || "movie"}/${topMatch.id}`}
                        className="secondary-button small-btn"
                      >
                        Title Details <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Grid for all matches */}
            <div className="results-grid-header">
              <h3>All Results for “{inputVal}”</h3>
              <span>{filteredResults.length} titles found</span>
            </div>

            <div className="poster-grid">
              {filteredResults.map((item) => (
                <MovieCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* State 2: No Results Found */}
        {inputVal.trim() && !loading && filteredResults.length === 0 && (
          <div className="empty-state">
            <SearchIcon size={40} className="empty-icon text-gold" />
            <h3>No matches found for “{inputVal}”</h3>
            <p>Check your spelling, try fewer keywords, or browse popular titles below.</p>
            <button
              onClick={() => setInputVal("")}
              className="secondary-button"
              style={{ marginTop: "12px" }}
            >
              Clear Search
            </button>
          </div>
        )}

        {/* State 3: Empty query default state — Trending & Popular Showcase */}
        {!inputVal.trim() && (
          <section className="trending-discovery-section">
            <div className="section-heading">
              <div>
                <h2>Popular Right Now</h2>
                <p className="section-subtitle">Trending films and series across Antarctic</p>
              </div>
            </div>

            <div className="poster-grid">
              {trendingItems.map((item) => (
                <MovieCard key={`trending-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
