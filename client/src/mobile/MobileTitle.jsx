import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Plus, Check } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const BACKDROP = "https://image.tmdb.org/t/p/w780";

export default function MobileTitle() {
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
            setInWatchlist((res.data || []).some((x) => Number(x.tmdbId) === Number(id) && x.mediaType === type));
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
      .catch(() => {});
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

  if (loading) return <div className="m-loading">Loading...</div>;
  if (!item) return <div className="m-page">Title not found.</div>;

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const validSeasons = (item.seasons || []).filter((s) => s.season_number > 0);

  return (
    <div>
      <div
        className="m-detail-backdrop"
        style={item.backdrop_path ? { backgroundImage: `url(${BACKDROP}${item.backdrop_path})` } : {}}
      >
        <button type="button" className="m-icon-btn" style={{ position: "relative", zIndex: 2 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="m-detail-body">
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800 }}>{title}</h1>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 14 }}>
          {year} {item.vote_average > 0 ? `· ${Math.round(item.vote_average * 10)}% Match` : ""}
        </div>

        <button
          type="button"
          className="m-btn-play"
          style={{ width: "100%", marginBottom: 10 }}
          onClick={() =>
            navigate(type === "tv" ? `/watch/tv/${id}?season=${selectedSeason}&episode=1` : `/watch/movie/${id}`)
          }
        >
          <Play size={18} fill="currentColor" /> {type === "tv" ? `Play S${selectedSeason} E1` : "Play"}
        </button>

        <button type="button" className="m-btn-list" style={{ width: "100%" }} onClick={toggleWatchlist}>
          {inWatchlist ? <Check size={18} /> : <Plus size={18} />}
          {inWatchlist ? "In My List" : "My List"}
        </button>

        <p className="m-detail-overview">{item.overview}</p>

        {item.credits?.cast?.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px" }}>Cast</h2>
            <div className="m-rail-row" style={{ paddingLeft: 0, paddingRight: 0 }}>
              {item.credits.cast.slice(0, 18).map((actor) => (
                <div key={actor.id} style={{ flex: "0 0 84px", width: 84, textAlign: "center" }}>
                  {actor.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                      alt={actor.name}
                      style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", marginBottom: 6 }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#151c2c", display: "grid", placeItems: "center", margin: "0 auto 6px", fontWeight: 700 }}>
                      {actor.name?.slice(0, 1) || "A"}
                    </div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {actor.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "tv" && validSeasons.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Episodes</h2>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                style={{ background: "#0f1522", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 10px" }}
              >
                {validSeasons.map((s) => (
                  <option key={s.id} value={s.season_number}>
                    {s.name || `Season ${s.season_number}`}
                  </option>
                ))}
              </select>
            </div>

            {(seasonData?.episodes || []).map((ep) => (
              <button
                key={ep.id}
                type="button"
                className="m-ep-item"
                onClick={() => navigate(`/watch/tv/${id}?season=${selectedSeason}&episode=${ep.episode_number}`)}
              >
                {ep.still_path ? (
                  <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.name} className="m-ep-thumb" />
                ) : (
                  <div className="m-ep-thumb" />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    {ep.episode_number}. {ep.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {ep.overview}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {item.recommendations?.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px" }}>More Like This</h2>
            <div className="m-rail-row" style={{ paddingLeft: 0, paddingRight: 0 }}>
              {item.recommendations.slice(0, 15).map((rec) => {
                const recType = rec.media_type || (rec.first_air_date ? "tv" : "movie");
                const recLabel = rec.title || rec.name;
                return (
                  <Link key={`${recType}-${rec.id}`} to={`/title/${recType}/${rec.id}`} className="m-card">
                    {rec.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`} alt={recLabel} className="m-card-img" loading="lazy" />
                    ) : (
                      <div className="m-card-img" style={{ display: "grid", placeItems: "center", fontSize: 10 }}>ANTARCTIC</div>
                    )}
                    <div className="m-card-title">{recLabel}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
