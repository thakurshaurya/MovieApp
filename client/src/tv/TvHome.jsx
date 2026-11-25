import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Info, Sparkles } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

// Lightweight TMDB sizes tuned for 1GB RAM Android TVs (e.g. Mi TV 4A)
const BACKDROP = "https://image.tmdb.org/t/p/w780";
const POSTER = "https://image.tmdb.org/t/p/w185";
const WIDE_IMG = "https://image.tmdb.org/t/p/w300";

const TvRail = memo(function TvRail({ title, items, onFocusItem, isWide = false }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="tv-rail">
      <h2 className="tv-rail-title">{title}</h2>
      <div className="tv-rail-row">
        {items.slice(0, 14).map((item) => {
          const mediaType = item.media_type || item.mediaType || (item.first_air_date ? "tv" : "movie");
          const id = item.tmdbId || item.id;
          const label = item.title || item.name || "Untitled";
          const year = (item.release_date || item.first_air_date || "").slice(0, 4);
          const imgPath = isWide
            ? (item.backdropPath || item.backdrop_path || item.posterPath || item.poster_path)
            : (item.poster_path || item.posterPath || item.backdrop_path);
          const imgSrc = imgPath ? `${isWide ? WIDE_IMG : POSTER}${imgPath}` : "";

          const to = isWide
            ? `/watch/${mediaType}/${id}${mediaType === "tv" && item.season ? `?season=${item.season}&episode=${item.episode || 1}&startAt=${Math.floor(item.currentTime || 0)}` : ""}`
            : `/title/${mediaType}/${id}`;

          const progressPct = item.duration > 0
            ? Math.min(100, Math.round(((item.currentTime || 0) / item.duration) * 100))
            : 0;

          return (
            <Link
              key={`${title}-${mediaType}-${id}-${item.season || ""}-${item.episode || ""}`}
              to={to}
              className={`tv-card tv-focusable ${isWide ? "tv-card-wide" : ""}`}
              onFocus={() => onFocusItem(item)}
              onMouseEnter={() => onFocusItem(item)}
            >
              {imgSrc ? (
                <img src={imgSrc} alt={label} className="tv-card-poster" loading="lazy" />
              ) : (
                <div className="tv-card-poster" style={{ display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "#64748b" }}>
                  ANTARCTIC
                </div>
              )}
              {isWide && progressPct > 0 && (
                <div className="tv-progress-track">
                  <div className="tv-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              )}
              <div className="tv-card-info">
                <h3 className="tv-card-title">{label}</h3>
                <span className="tv-card-sub">
                  {isWide && mediaType === "tv" && item.season
                    ? `S${item.season} E${item.episode || 1}`
                    : `${mediaType === "tv" ? "Series" : "Movie"}${year ? ` · ${year}` : ""}`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
});

export default function TvHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [spotlight, setSpotlight] = useState(null);
  const [error, setError] = useState("");
  const spotlightTimerRef = useRef(null);

  const handleFocusItem = useCallback((item) => {
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    spotlightTimerRef.current = setTimeout(() => {
      setSpotlight(item);
    }, 220);
  }, []);

  useEffect(() => {
    let mounted = true;
    api.get("/movies/home")
      .then((res) => {
        if (!mounted) return;
        setData(res.data);
        const first = (res.data.trending || []).find((x) => x.backdrop_path) || res.data.trending?.[0];
        setSpotlight(first || null);
      })
      .catch(() => {
        if (mounted) setError("Could not load Antarctic catalogue. Check your internet connection.");
      });

    if (user) {
      api.get("/history?limit=12")
        .then((res) => {
          if (mounted) setHistory(res.data || []);
        })
        .catch(() => {});
    }

    return () => {
      mounted = false;
    };
  }, [user]);

  const hero = useMemo(() => {
    if (spotlight) return spotlight;
    return (data?.trending || [])[0] || null;
  }, [spotlight, data]);

  if (error) {
    return <div className="tv-notice">{error}</div>;
  }

  if (!data) {
    return <div className="tv-loading">Loading Antarctic TV...</div>;
  }

  const heroType = hero?.media_type || hero?.mediaType || (hero?.first_air_date ? "tv" : "movie");
  const heroId = hero?.tmdbId || hero?.id;
  const heroTitle = hero?.title || hero?.name || "Antarctic";
  const heroYear = (hero?.release_date || hero?.first_air_date || "").slice(0, 4);
  const heroBackdrop = hero?.backdrop_path || hero?.backdropPath;

  return (
    <div>
      {hero && (
        <section
          className="tv-hero"
          style={heroBackdrop ? { backgroundImage: `url(${BACKDROP}${heroBackdrop})` } : {}}
        >
          <div className="tv-hero-content">
            <div className="tv-hero-badge">
              <Sparkles size={14} />
              <span>ANTARCTIC TV SPOTLIGHT</span>
            </div>
            <h1 className="tv-hero-title">{heroTitle}</h1>
            <div className="tv-hero-meta">
              {typeof hero.vote_average === "number" && hero.vote_average > 0 && (
                <span className="tv-rating-tag">{Math.round(hero.vote_average * 10)}% Match</span>
              )}
              {heroYear && <span>{heroYear}</span>}
              <span>{heroType === "tv" ? "TV Series" : "Movie"}</span>
            </div>
            <p className="tv-hero-overview">{hero.overview || "Stream instantly in HD on Antarctic TV."}</p>
            <div className="tv-hero-actions">
              <button
                type="button"
                className="tv-btn-primary tv-focusable"
                onClick={() => navigate(`/watch/${heroType}/${heroId}`)}
              >
                <Play size={18} fill="currentColor" /> Play
              </button>
              <button
                type="button"
                className="tv-btn-secondary tv-focusable"
                onClick={() => navigate(`/title/${heroType}/${heroId}`)}
              >
                <Info size={18} /> More Info
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="tv-rails-wrap">
        {history.length > 0 && (
          <TvRail title="Continue Watching" items={history} onFocusItem={handleFocusItem} isWide />
        )}
        <TvRail title="Trending Now" items={data.trending} onFocusItem={handleFocusItem} />
        <TvRail title="Popular Movies" items={data.popularMovies} onFocusItem={handleFocusItem} />
        <TvRail title="Binge-Worthy TV Series" items={data.popularTv} onFocusItem={handleFocusItem} />
        <TvRail title="Trending Bollywood" items={data.trendingHindi} onFocusItem={handleFocusItem} />
      </div>
    </div>
  );
}
