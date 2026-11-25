import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Plus, Check } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const POSTER = "https://image.tmdb.org/t/p/w342";
const HERO_IMG = "https://image.tmdb.org/t/p/w780";
const WIDE_IMG = "https://image.tmdb.org/t/p/w500";

function MobileRail({ title, items, isWide = false }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="m-rail">
      <h2 className="m-rail-title">{title}</h2>
      <div className="m-rail-row">
        {items.slice(0, 18).map((item) => {
          const type = item.media_type || item.mediaType || (item.first_air_date ? "tv" : "movie");
          const id = item.tmdbId || item.id;
          const label = item.title || item.name || "Untitled";
          const imgPath = isWide
            ? (item.backdropPath || item.backdrop_path || item.posterPath || item.poster_path)
            : (item.poster_path || item.posterPath || item.backdrop_path);
          const to = isWide
            ? `/watch/${type}/${id}${type === "tv" && item.season ? `?season=${item.season}&episode=${item.episode || 1}&startAt=${Math.floor(item.currentTime || 0)}` : ""}`
            : `/title/${type}/${id}`;
          const pct = item.duration > 0 ? Math.min(100, Math.round(((item.currentTime || 0) / item.duration) * 100)) : 0;

          return (
            <Link key={`${title}-${type}-${id}-${item.season || ""}-${item.episode || ""}`} to={to} className={`m-card ${isWide ? "m-card-wide" : ""}`}>
              {imgPath ? (
                <img src={`${isWide ? WIDE_IMG : POSTER}${imgPath}`} alt={label} className="m-card-img" loading="lazy" />
              ) : (
                <div className="m-card-img" style={{ display: "grid", placeItems: "center", fontSize: 11, color: "#64748b" }}>ANTARCTIC</div>
              )}
              {isWide && pct > 0 && (
                <div className="m-progress-bar">
                  <div className="m-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              )}
              <div className="m-card-title">{label}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function MobileHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get("/movies/home")
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch(() => {});

    if (user) {
      api.get("/history?limit=10")
        .then((res) => {
          if (mounted) setHistory(res.data || []);
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!data) {
    return <div className="m-loading">Loading Antarctic...</div>;
  }

  const hero = (data.trending || []).find((x) => x.poster_path || x.backdrop_path) || data.trending?.[0];
  const heroType = hero?.media_type || (hero?.first_air_date ? "tv" : "movie");
  const heroTitle = hero?.title || hero?.name || "Antarctic";
  const heroImg = hero?.poster_path || hero?.backdrop_path;

  async function toggleHeroList() {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      if (saved) {
        await api.delete(`/watchlist/${heroType}/${hero.id}`);
        setSaved(false);
      } else {
        await api.post("/watchlist", {
          tmdbId: hero.id,
          mediaType: heroType,
          title: heroTitle,
          posterPath: hero.poster_path,
          backdropPath: hero.backdrop_path,
          voteAverage: hero.vote_average,
          releaseDate: hero.release_date || hero.first_air_date,
          overview: hero.overview
        });
        setSaved(true);
      }
    } catch {}
  }

  return (
    <div>
      <div className="m-cat-pills">
        <Link to="/tvshows" className="m-cat-pill">TV Shows</Link>
        <Link to="/movies" className="m-cat-pill">Movies</Link>
        <Link to="/watchlist" className="m-cat-pill">My List</Link>
      </div>

      {hero && (
        <div className="m-hero-wrap">
          <div
            className="m-hero-card"
            style={heroImg ? { backgroundImage: `url(${HERO_IMG}${heroImg})` } : {}}
            onClick={() => navigate(`/title/${heroType}/${hero.id}`)}
          >
            <div className="m-hero-body" onClick={(e) => e.stopPropagation()}>
              <h1 className="m-hero-title">{heroTitle}</h1>
              <div className="m-hero-meta">
                {heroType === "tv" ? "Series" : "Movie"}
                {hero.vote_average > 0 ? ` · ${Math.round(hero.vote_average * 10)}% Match` : ""}
              </div>
              <div className="m-hero-actions">
                <button
                  type="button"
                  className="m-btn-play"
                  onClick={() => navigate(`/watch/${heroType}/${hero.id}`)}
                >
                  <Play size={18} fill="currentColor" /> Play
                </button>
                <button type="button" className="m-btn-list" onClick={toggleHeroList}>
                  {saved ? <Check size={18} /> : <Plus size={18} />} My List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && <MobileRail title="Continue Watching" items={history} isWide />}
      <MobileRail title="Trending Now" items={data.trending} />
      <MobileRail title="Popular Movies" items={data.popularMovies} />
      <MobileRail title="Popular TV Series" items={data.popularTv} />
      <MobileRail title="Trending Bollywood" items={data.trendingHindi} />
      <MobileRail title="Indian Web Series" items={data.indianSeries} />
    </div>
  );
}
