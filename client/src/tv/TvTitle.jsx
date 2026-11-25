import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Play, BookmarkPlus, BookmarkCheck, ArrowLeft, Star } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const BACKDROP = "https://image.tmdb.org/t/p/original";

export default function TvTitle() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonData, setSeasonData] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/movies/${type}/${id}`)
      .then((res) => {
        if (!mounted) return;
        setItem(res.data);
        if (type === "tv" && res.data.seasons?.length > 0) {
          const valid = res.data.seasons.find((s) => s.season_number > 0) || res.data.seasons[0];
          setSelectedSeason(valid?.season_number || 1);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    if (user) {
      api.get("/watchlist")
        .then((res) => {
          if (mounted) {
            const exists = (res.data || []).some(
              (x) => Number(x.tmdbId) === Number(id) && x.mediaType === type
            );
            setInWatchlist(exists);
          }
        })
        .catch(() => {});
    }

    return () => {
      mounted = false;
    };
  }, [type, id, user]);

  useEffect(() => {
    if (type !== "tv" || !item) return;
    let mounted = true;
    api.get(`/movies/tv/${id}/season/${selectedSeason}`)
      .then((res) => {
        if (mounted) setSeasonData(res.data);
      })
      .catch(() => {
        if (mounted) setSeasonData(null);
      });
    return () => {
      mounted = false;
    };
  }, [type, id, selectedSeason, item]);

  async function toggleWatchlist() {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${type}/${id}`);
        setInWatchlist(false);
      } else {
        await api.post("/watchlist", {
          tmdbId: Number(id),
          mediaType: type,
          title: item.title || item.name,
          posterPath: item.poster_path,
          backdropPath: item.backdrop_path,
          voteAverage: item.vote_average,
          releaseDate: item.release_date || item.first_air_date,
          overview: item.overview
        });
        setInWatchlist(true);
      }
    } catch {}
  }

  if (loading) return <div className="tv-loading">Loading title...</div>;
  if (!item) return <div className="tv-notice">Title not found.</div>;

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const validSeasons = (item.seasons || []).filter((s) => s.season_number > 0);

  return (
    <div>
      <section
        className="tv-detail-hero"
        style={item.backdrop_path ? { backgroundImage: `url(${BACKDROP}${item.backdrop_path})` } : {}}
      >
        <div className="tv-detail-inner">
          <button
            type="button"
            className="tv-btn-secondary tv-focusable"
            style={{ marginBottom: 20, padding: "8px 16px", fontSize: 13 }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h1 className="tv-hero-title">{title}</h1>

          <div className="tv-hero-meta">
            {year && <span>{year}</span>}
            {item.vote_average > 0 && (
              <span className="tv-rating-tag" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Star size={14} fill="currentColor" /> {item.vote_average.toFixed(1)}
              </span>
            )}
            {item.genres?.slice(0, 3).map((g) => g.name).join(" · ")}
          </div>

          <p className="tv-hero-overview">{item.overview}</p>

          <div className="tv-hero-actions">
            <button
              type="button"
              className="tv-btn-primary tv-focusable"
              onClick={() =>
                navigate(
                  type === "tv"
                    ? `/watch/tv/${id}?season=${selectedSeason}&episode=1`
                    : `/watch/movie/${id}`
                )
              }
            >
              <Play size={18} fill="currentColor" />
              {type === "tv" ? `Play S${selectedSeason} E1` : "Play Now"}
            </button>

            <button
              type="button"
              className="tv-btn-secondary tv-focusable"
              onClick={toggleWatchlist}
            >
              {inWatchlist ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
              {inWatchlist ? "In My List" : "My List"}
            </button>
          </div>
        </div>
      </section>

      {type === "tv" && validSeasons.length > 0 && (
        <section className="tv-detail-section">
          <div className="tv-page-header" style={{ marginBottom: 16 }}>
            <h2 className="tv-rail-title" style={{ margin: 0 }}>Episodes</h2>
            <div className="tv-filter-pills">
              {validSeasons.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`tv-pill tv-focusable ${selectedSeason === s.season_number ? "active" : ""}`}
                  onClick={() => setSelectedSeason(s.season_number)}
                >
                  {s.name || `Season ${s.season_number}`}
                </button>
              ))}
            </div>
          </div>

          <div className="tv-episodes-row">
            {(seasonData?.episodes || []).map((ep) => (
              <button
                key={ep.id}
                type="button"
                className="tv-episode-card tv-focusable"
                onClick={() =>
                  navigate(`/watch/tv/${id}?season=${selectedSeason}&episode=${ep.episode_number}`)
                }
              >
                {ep.still_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                    alt={ep.name}
                    className="tv-episode-thumb"
                    loading="lazy"
                  />
                ) : (
                  <div className="tv-episode-thumb" style={{ display: "grid", placeItems: "center", fontSize: 13, color: "#64748b" }}>
                    Episode {ep.episode_number}
                  </div>
                )}
                <div className="tv-episode-body">
                  <h4>{ep.episode_number}. {ep.name}</h4>
                  <p>{ep.overview || "Click to play episode."}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {item.credits?.cast?.length > 0 && (
        <section className="tv-detail-section">
          <h2 className="tv-rail-title">Cast</h2>
          <div className="tv-rail-row" style={{ paddingLeft: 0 }}>
            {item.credits.cast.slice(0, 14).map((actor) => (
              <div key={actor.id} style={{ flex: "0 0 110px", textAlign: "center" }}>
                {actor.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                    alt={actor.name}
                    style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", marginBottom: 8 }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ width: 84, height: 84, borderRadius: "50%", background: "#121723", display: "grid", placeItems: "center", margin: "0 auto 8px", fontWeight: 700 }}>
                    {actor.name?.slice(0, 1) || "A"}
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {actor.name}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {item.recommendations?.length > 0 && (
        <section className="tv-detail-section">
          <h2 className="tv-rail-title">More Like This</h2>
          <div className="tv-rail-row" style={{ paddingLeft: 0 }}>
            {item.recommendations.slice(0, 14).map((rec) => {
              const recType = rec.media_type || (rec.first_air_date ? "tv" : "movie");
              const recLabel = rec.title || rec.name;
              return (
                <Link key={`${recType}-${rec.id}`} to={`/title/${recType}/${rec.id}`} className="tv-card tv-focusable">
                  {rec.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w185${rec.poster_path}`} alt={recLabel} className="tv-card-poster" loading="lazy" />
                  ) : (
                    <div className="tv-card-poster" style={{ display: "grid", placeItems: "center", fontSize: 12 }}>ANTARCTIC</div>
                  )}
                  <div className="tv-card-info">
                    <h3 className="tv-card-title">{recLabel}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
