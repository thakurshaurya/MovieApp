import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
      </div>
    </div>
  );
}
