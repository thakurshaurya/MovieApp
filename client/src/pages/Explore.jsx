import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Film, Tv, Sparkles, Filter, RotateCcw, Flame, Star, Calendar, Tag } from "lucide-react";
import api from "../api";
import MovieCard from "../components/MovieCard";

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular / Watched", icon: Flame },
  { value: "vote_average.desc", label: "Highest Rated (Top Reviews)", icon: Star },
  { value: "primary_release_date.desc", label: "Recently Released", icon: Calendar },
  { value: "revenue.desc", label: "Highest Box Office", icon: Sparkles }
];

// Generate years from current down to 1970
const YEARS = Array.from({ length: 56 }, (_, i) => 2025 - i);

export default function Explore({ defaultType }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine media type
  const currentType = defaultType
    ? defaultType
    : location.pathname.includes("tv") || location.search.includes("type=tv")
    ? "tv"
    : "movie";

  // Filter States synced with URL where appropriate
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "popularity.desc");
  const [selectedYear, setSelectedYear] = useState(searchParams.get("year") || "");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "");
  const [availableGenres, setAvailableGenres] = useState([]);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const observerRef = useRef(null);

  // Fetch genres for current media type
  useEffect(() => {
    api.get(`/movies/genres/${currentType}`)
      .then((res) => setAvailableGenres(res.data || []))
      .catch(() => setAvailableGenres([]));
  }, [currentType]);

  // Sync state to URL params for shareable filtered views
  const updateFilter = (type, val) => {
    if (type === "sort") setSortBy(val);
    if (type === "year") setSelectedYear(val);
    if (type === "genre") setSelectedGenre(val);
  };

  const resetFilters = () => {
    setSortBy("popularity.desc");
    setSelectedYear("");
    setSelectedGenre("");
  };

  const hasActiveFilters = sortBy !== "popularity.desc" || selectedYear !== "" || selectedGenre !== "";

  // Fetch a page of titles
  const fetchTitles = useCallback(
    async (type, pageNum, append = false) => {
      if (pageNum === 1) {
        setLoading(true);
        setError("");
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await api.get(`/movies/discover/${type}`, {
          params: {
            page: pageNum,
            sort_by: sortBy,
            year: selectedYear || undefined,
            genre: selectedGenre || undefined
          }
        });

        const newResults = res.data.results || [];
        setTotalPages(res.data.totalPages || 1);
        setTotalResults(res.data.totalResults || 0);

        setItems((prev) => {
          if (!append) return newResults;
          const existingIds = new Set(prev.map((item) => item.id));
          const filteredNew = newResults.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filteredNew];
        });
      } catch {
        if (pageNum === 1) {
          setError("Could not load titles from the catalog. Please try again.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sortBy, selectedYear, selectedGenre]
  );

  // Reset and load first page on filter or category change
  useEffect(() => {
    setPage(1);
    setItems([]);
    fetchTitles(currentType, 1, false);
  }, [currentType, sortBy, selectedYear, selectedGenre, fetchTitles]);

  // Load subsequent pages when page increments
  useEffect(() => {
    if (page > 1) {
      fetchTitles(currentType, page, true);
    }
  }, [page, currentType, fetchTitles]);

  // Infinite Scroll IntersectionObserver trigger
  const lastElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && page < totalPages) {
            setPage((prevPage) => prevPage + 1);
          }
        },
        {
          root: null,
          rootMargin: "350px",
          threshold: 0.1
        }
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, page, totalPages]
  );

  return (
    <main className="page-shell explore-page">
      <div className="page-heading">
        <div className="eyebrow">
          <Sparkles size={14} className="text-gold" />
          <span>ENDLESS CATALOGUE</span>
        </div>
        <h1>{currentType === "tv" ? "Television Series" : "Feature Films"}</h1>
        <p>
          {currentType === "tv"
            ? "Browse an endless collection of television series, drama serials, and mini-series."
            : "Explore an endless library of blockbusters, international cinema, and classics."}
        </p>

        {/* Media Switcher Tabs */}
        <div className="filter-pills" style={{ marginTop: "20px" }}>
          <button
            className={`pill-btn ${currentType === "movie" ? "active" : ""}`}
            onClick={() => navigate("/movies")}
          >
            <Film size={14} /> Feature Films
          </button>
          <button
            className={`pill-btn ${currentType === "tv" ? "active" : ""}`}
            onClick={() => navigate("/tvshows")}
          >
            <Tv size={14} /> TV Series
          </button>
        </div>
      </div>

      {/* Filter Toolbar Dropbox Section */}
      <section className="explore-filter-bar">
        <div className="filter-group">
          <label>
            <Flame size={14} className="filter-icon" /> Sort & Rank
          </label>
          <select
            value={sortBy}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="filter-select"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>
            <Calendar size={14} className="filter-icon" /> Release Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => updateFilter("year", e.target.value)}
            className="filter-select"
          >
            <option value="">All Release Years</option>
            {YEARS.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>
            <Tag size={14} className="filter-icon" /> Genre
          </label>
          <select
            value={selectedGenre}
            onChange={(e) => updateFilter("genre", e.target.value)}
            className="filter-select"
          >
            <option value="">All Genres</option>
            {availableGenres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={resetFilters} className="reset-filter-btn" title="Reset all filters">
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        )}

        {totalResults > 0 && !loading && (
          <div className="filter-results-badge">
            <span>{totalResults.toLocaleString()} titles</span>
          </div>
        )}
      </section>

      {error && <div className="notice">{error}</div>}

      {/* Initial Skeleton Grid */}
      {loading && items.length === 0 ? (
        <div className="poster-grid">
          {[...Array(18)].map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="poster-grid">
            {items.map((item, index) => {
              if (index === items.length - 1) {
                return (
                  <div ref={lastElementRef} key={`${currentType}-${item.id}`}>
                    <MovieCard item={{ ...item, media_type: currentType }} />
                  </div>
                );
              }
              return (
                <MovieCard
                  key={`${currentType}-${item.id}`}
                  item={{ ...item, media_type: currentType }}
                />
              );
            })}
          </div>

          {/* Endless Scroll Spinner at Bottom */}
          {loadingMore && (
            <div className="endless-loader">
              <span className="endless-spinner" />
              <span>Loading more titles...</span>
            </div>
          )}

          {page >= totalPages && (
            <div className="endless-reached-end">
              <span>You have reached the end of the collection.</span>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <div className="empty-state">
            <h3>No titles found</h3>
            <p>Try adjusting your genre, release year, or sorting filter.</p>
            <button onClick={resetFilters} className="primary-button">
              Clear Filters
            </button>
          </div>
        )
      )}
    </main>
  );
}
