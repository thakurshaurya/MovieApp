import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { BookmarkPlus, BookmarkCheck, Play, ArrowLeft, Star, Clock, Calendar, Film, Tv, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ContentRow from "../components/ContentRow";
import CastModal from "../components/CastModal";

const BACKDROP = "https://image.tmdb.org/t/p/original";
const POSTER = "https://image.tmdb.org/t/p/w500";

export default function Title() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inWatchlist, setInWatchlist] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // TV Season & Episode Selection State
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonData, setSeasonData] = useState(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  // Cast Filmography Modal State & Scroll
  const [selectedActor, setSelectedActor] = useState(null);
  const castScrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  function scrollCast(direction) {
    if (castScrollRef.current) {
      const offset = Math.max(castScrollRef.current.clientWidth * 0.75, 240);
      castScrollRef.current.scrollBy({
        left: direction === "left" ? -offset : offset,
        behavior: "smooth"
      });
    }
  }

  function handleCastMouseDown(e) {
    if (!castScrollRef.current) return;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    startXRef.current = e.pageX - castScrollRef.current.offsetLeft;
    scrollLeftRef.current = castScrollRef.current.scrollLeft;
    castScrollRef.current.classList.add("is-dragging");
  }

  function handleCastMouseMove(e) {
    if (!isDraggingRef.current || !castScrollRef.current) return;
    const x = e.pageX - castScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      dragMovedRef.current = true;
    }
    castScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  }

  function handleCastMouseUpOrLeave() {
    isDraggingRef.current = false;
    if (castScrollRef.current) {
      castScrollRef.current.classList.remove("is-dragging");
    }
  }

  // Support mouse wheel scrolling horizontally over the cast row
  useEffect(() => {
    const el = castScrollRef.current;
    if (!el) return;

    function handleWheel(e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (
          (e.deltaY > 0 && el.scrollLeft < maxScroll - 1) ||
          (e.deltaY < 0 && el.scrollLeft > 1)
        ) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.2;
        }
      }
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [item]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    api.get(`/movies/${type}/${id}`)
      .then((res) => {
        if (isMounted) {
          setItem(res.data);
          // If TV show, set default season to 1
          if (type === "tv" && res.data.seasons?.length > 0) {
            const firstValidSeason = res.data.seasons.find((s) => s.season_number > 0) || res.data.seasons[0];
            setSelectedSeason(firstValidSeason?.season_number || 1);
          }
        }
      })
      .catch(() => {
        if (isMounted) setError("Unable to load title details.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [type, id]);

  // Check Watchlist status
  useEffect(() => {
    if (user && item) {
      api.get("/watchlist")
        .then((res) => {
          const exists = res.data.some(
            (w) => w.tmdbId === Number(id) && w.mediaType === type
          );
          setInWatchlist(exists);
        })
        .catch(() => {});
    }
  }, [user, item, id, type]);

  // Load TV Season details when season changes
  useEffect(() => {
    if (type === "tv" && item) {
      let isMounted = true;
      setLoadingSeason(true);

      api.get(`/movies/tv/${id}/season/${selectedSeason}`)
        .then((res) => {
          if (isMounted) setSeasonData(res.data);
        })
        .catch(() => {
          if (isMounted) setSeasonData(null);
        })
        .finally(() => {
          if (isMounted) setLoadingSeason(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [type, id, selectedSeason, item]);

  async function toggleWatchlist() {
    if (!user) {
      navigate("/login", { state: { from: `/title/${type}/${id}` } });
      return;
    }

    setActionLoading(true);
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
    } catch {
      // silently handle
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div className="loading">Loading cinematic experience...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="page-shell">
        <div className="notice">{error || "Title not found."}</div>
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Back to discover
        </Link>
      </div>
    );
  }

  const title = item.title || item.name;
  const releaseYear = (item.release_date || item.first_air_date || "").slice(0, 4);
  const runtime = item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : null;
  const seasonsCount = item.number_of_seasons ? `${item.number_of_seasons} Season${item.number_of_seasons > 1 ? "s" : ""}` : null;
  const castList = item.credits?.cast?.slice(0, 30) || [];
  const validSeasons = (item.seasons || []).filter((s) => s.season_number > 0);

  return (
    <main
      className="detail-page"
      style={
        item.backdrop_path
          ? {
              backgroundImage: `linear-gradient(90deg, #08090c 0%, rgba(8,9,12,0.92) 45%, rgba(8,9,12,0.4) 100%), linear-gradient(0deg, #08090c 0%, transparent 60%), url(${BACKDROP}${item.backdrop_path})`
            }
          : {}
      }
    >
      <div className="detail-container">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} /> Back to collection
        </Link>

        <div className="detail-layout">
          {/* Main Info */}
          <div className="detail-content">
            <div className="eyebrow">
              {type === "tv" ? <Tv size={14} /> : <Film size={14} />}
              <span>{type === "tv" ? "ANTARCTIC ORIGINAL SERIES" : "ANTARCTIC FEATURE PRESENTATION"}</span>
            </div>

            <h1>{title}</h1>

            <div className="detail-stats">
              {releaseYear && (
                <span className="stat-pill">
                  <Calendar size={13} /> {releaseYear}
                </span>
              )}
              {item.vote_average > 0 && (
                <span className="stat-pill rating-pill">
                  <Star size={13} fill="currentColor" /> {item.vote_average.toFixed(1)} / 10
                </span>
              )}
              {runtime && (
                <span className="stat-pill">
                  <Clock size={13} /> {runtime}
                </span>
              )}
              {seasonsCount && <span className="stat-pill">{seasonsCount}</span>}
              {item.genres?.length > 0 && (
                <span className="genres-text">
                  {item.genres.map((g) => g.name).slice(0, 3).join(" · ")}
                </span>
              )}
            </div>

            <p className="detail-overview">{item.overview || "No overview available."}</p>

            {/* Actions */}
            <div className="hero-actions">
              <Link
                className="primary-button"
                to={
                  type === "tv"
                    ? `/watch/tv/${id}?season=${selectedSeason}&episode=1`
                    : `/watch/movie/${id}`
                }
              >
                <Play size={16} fill="currentColor" /> Watch Now
              </Link>

              <button
                className={`secondary-button ${inWatchlist ? "active-watchlist" : ""}`}
                onClick={toggleWatchlist}
                disabled={actionLoading}
              >
                {inWatchlist ? (
                  <>
                    <BookmarkCheck size={16} className="text-gold" /> In My Watchlist
                  </>
                ) : (
                  <>
                    <BookmarkPlus size={16} /> Add to Watchlist
                  </>
                )}
              </button>
            </div>

            {/* Cast Members */}
            {castList.length > 0 && (
              <div className="cast-section">
                <div className="cast-section-header">
                  <div className="cast-header-title">
                    <h3>Cast & Performances</h3>
                    <span className="cast-hint">Tap actor to view filmography</span>
                  </div>
                  <div className="cast-scroll-arrows">
                    <button
                      type="button"
                      onClick={() => scrollCast("left")}
                      aria-label="Scroll cast left"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCast("right")}
                      aria-label="Scroll cast right"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="cast-scroll-container">
                  <button
                    type="button"
                    className="cast-row-nav left"
                    onClick={() => scrollCast("left")}
                    aria-label="Scroll cast left"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div
                    className="cast-scroll-row"
                    ref={castScrollRef}
                    onMouseDown={handleCastMouseDown}
                    onMouseMove={handleCastMouseMove}
                    onMouseUp={handleCastMouseUpOrLeave}
                    onMouseLeave={handleCastMouseUpOrLeave}
                  >
                    {castList.map((actor) => (
                      <button
                        key={actor.id}
                        type="button"
                        className="cast-card"
                        onClick={() => {
                          if (dragMovedRef.current) return;
                          setSelectedActor(actor.id);
                        }}
                        title={`View ${actor.name}'s filmography`}
                      >
                        <div className="cast-photo-wrap">
                          {actor.profile_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                              alt={actor.name}
                              className="cast-photo"
                              loading="lazy"
                              draggable="false"
                            />
                          ) : (
                            <div className="cast-photo-fallback">
                              {actor.name?.slice(0, 1) || "A"}
                            </div>
                          )}
                        </div>
                        <span className="cast-name">{actor.name}</span>
                        {actor.character && (
                          <span className="cast-character">as {actor.character}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="cast-row-nav right"
                    onClick={() => scrollCast("right")}
                    aria-label="Scroll cast right"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Poster Showcase */}
          <div className="detail-poster-col">
            <div className="poster-frame">
              {item.poster_path ? (
                <img
                  src={`${POSTER}${item.poster_path}`}
                  alt={`${title} official poster`}
                  className="poster-img"
                />
              ) : (
                <div className="poster-placeholder">ANTARCTIC</div>
              )}
            </div>
          </div>
        </div>

        {/* TV Series Seasons & Episodes Selector */}
        {type === "tv" && validSeasons.length > 0 && (
          <section className="tv-episodes-section">
            <div className="tv-episodes-header">
              <h2>Episodes & Seasons</h2>
              <div className="season-selector">
                <label>Select Season:</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                >
                  {validSeasons.map((s) => (
                    <option key={s.id} value={s.season_number}>
                      {s.name || `Season ${s.season_number}`} ({s.episode_count} Episodes)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingSeason ? (
              <div className="loading">Loading episodes...</div>
            ) : seasonData?.episodes?.length > 0 ? (
              <div className="episodes-grid">
                {seasonData.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="episode-card"
                    onClick={() =>
                      navigate(
                        `/watch/tv/${id}?season=${selectedSeason}&episode=${ep.episode_number}`
                      )
                    }
                  >
                    <div className="ep-thumb">
                      {ep.still_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                          alt={ep.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="ep-fallback">EP {ep.episode_number}</div>
                      )}
                      <span className="ep-play-icon">
                        <Play size={16} fill="currentColor" />
                      </span>
                    </div>
                    <div className="ep-info">
                      <span className="ep-number">Episode {ep.episode_number}</span>
                      <h4>{ep.name || `Episode ${ep.episode_number}`}</h4>
                      <p className="ep-desc">
                        {ep.overview ? ep.overview.slice(0, 110) + "..." : "No description available."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No episode information available for this season.</div>
            )}
          </section>
        )}

        {/* Recommendations */}
        {item.recommendations?.length > 0 && (
          <div className="recommendations-wrap">
            <ContentRow
              title="More Like This"
              subtitle="Recommendations based on this title"
              items={item.recommendations}
              link=""
            />
          </div>
        )}
      </div>

      {/* Cast Filmography Modal */}
      <CastModal
        isOpen={Boolean(selectedActor)}
        actorId={selectedActor}
        onClose={() => setSelectedActor(null)}
      />
    </main>
  );
}
