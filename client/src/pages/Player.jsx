import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useSearchParams, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Sliders,
  Play
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import {
  buildVidoraUrl,
  getSavedVidoraSettings,
  saveVidoraSettings,
  getStoredVidoraProgress,
  VIDORA_ORIGIN
} from "../utils/vidora";
import PlayerCustomizerModal from "../components/PlayerCustomizerModal";

export default function Player() {
  const { type, id } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const playerShellRef = useRef(null);

  const [season, setSeason] = useState(Math.max(1, Number(params.get("season") || 1)));
  const [episode, setEpisode] = useState(Math.max(1, Number(params.get("episode") || 1)));
  const isTv = type === "tv";

  // Player Customization State (defaults to autoplay: true)
  const [customSettings, setCustomSettings] = useState(getSavedVidoraSettings);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Resume / Start timestamp (in seconds)
  const initialStartAt = Number(params.get("startAt") || 0);
  const [resumeSeconds, setResumeSeconds] = useState(initialStartAt);

  // Metadata for the currently playing title
  const [titleDetails, setTitleDetails] = useState(null);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  // Tracking playback throttle ref
  const lastSyncTimeRef = useRef(0);
  const currentPlaybackRef = useRef({ currentTime: 0, duration: 0 });

  // Sync state if URL query params change
  useEffect(() => {
    const s = Math.max(1, Number(params.get("season") || 1));
    const e = Math.max(1, Number(params.get("episode") || 1));
    const start = Number(params.get("startAt") || 0);
    setSeason(s);
    setEpisode(e);
    if (start > 0) setResumeSeconds(start);
  }, [params]);

  // Load title details
  useEffect(() => {
    let isMounted = true;
    api.get(`/movies/${type}/${id}`)
      .then((res) => {
        if (isMounted) setTitleDetails(res.data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [type, id]);

  // If TV, load season data to get real episode count, titles, and thumbnails
  useEffect(() => {
    if (isTv) {
      let isMounted = true;
      setLoadingSeason(true);
      api.get(`/movies/tv/${id}/season/${season}`)
        .then((res) => {
          if (isMounted) setSeasonDetails(res.data);
        })
        .catch(() => {
          if (isMounted) setSeasonDetails(null);
        })
        .finally(() => {
          if (isMounted) setLoadingSeason(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [isTv, id, season]);

  // Try to determine resume point from stored local progress if no URL param was set
  useEffect(() => {
    if (!initialStartAt) {
      const storedProgress = getStoredVidoraProgress(id, type, season, episode);
      if (storedProgress?.watched && storedProgress.watched > 10) {
        setResumeSeconds(Math.floor(storedProgress.watched));
      }
    }
  }, [id, type, season, episode, initialStartAt]);

  // Function to sync watch progress with backend
  const syncProgressToBackend = useCallback(
    (currentTime, duration) => {
      if (!user || !titleDetails) return;

      const currentEpisodeObj = seasonDetails?.episodes?.find((ep) => ep.episode_number === episode);
      const episodeTitle = currentEpisodeObj ? currentEpisodeObj.name : "";
      const stillPath = currentEpisodeObj?.still_path || null;
      const validCurTime = Math.max(0, Number(currentTime) || 0);
      const validDuration = Math.max(0, Number(duration) || 0);
      const calculatedProgress =
        validDuration > 0 ? Math.min(100, Math.round((validCurTime / validDuration) * 100)) : 0;

      api.post("/history", {
        tmdbId: Number(id),
        mediaType: type,
        title: titleDetails.title || titleDetails.name,
        posterPath: titleDetails.poster_path,
        backdropPath: titleDetails.backdrop_path,
        stillPath: isTv ? stillPath : null,
        overview: titleDetails.overview,
        voteAverage: titleDetails.vote_average,
        releaseDate: titleDetails.release_date || titleDetails.first_air_date,
        season: isTv ? season : 1,
        episode: isTv ? episode : 1,
        episodeTitle: isTv ? episodeTitle : "",
        currentTime: validCurTime,
        duration: validDuration,
        progress: calculatedProgress
      }).catch(() => {});
    },
    [user, titleDetails, seasonDetails, isTv, id, type, season, episode]
  );

  // Initial history record on load
  useEffect(() => {
    if (user && titleDetails) {
      syncProgressToBackend(resumeSeconds, 0);
    }
  }, [user, titleDetails, resumeSeconds, syncProgressToBackend]);

  // Listen for Vidora postMessage events (MEDIA_DATA & PLAYER_EVENT)
  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== VIDORA_ORIGIN) return;

      if (event.data?.type === "MEDIA_DATA" && event.data?.data) {
        try {
          const mediaData = event.data.data;
          localStorage.setItem("vidoraProgress", JSON.stringify(mediaData));
        } catch (err) {
          console.error("Error storing vidoraProgress", err);
        }
      }

      if (event.data?.type === "PLAYER_EVENT" && event.data?.data) {
        const { event: eventType, currentTime = 0, duration = 0 } = event.data.data;
        currentPlaybackRef.current = { currentTime, duration };

        const now = Date.now();
        if (eventType === "timeupdate") {
          if (now - lastSyncTimeRef.current >= 5000) {
            lastSyncTimeRef.current = now;
            syncProgressToBackend(currentTime, duration);
          }
        } else if (eventType === "pause" || eventType === "ended") {
          lastSyncTimeRef.current = now;
          syncProgressToBackend(currentTime, duration);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      if (currentPlaybackRef.current.currentTime > 0) {
        syncProgressToBackend(
          currentPlaybackRef.current.currentTime,
          currentPlaybackRef.current.duration
        );
      }
    };
  }, [syncProgressToBackend]);

  // Compute Vidora embed URL with customization parameters (ensuring autoplay is true by default)
  const embedUrl = useMemo(
    () =>
      buildVidoraUrl({
        type,
        id,
        season,
        episode,
        startAt: resumeSeconds > 0 ? resumeSeconds : undefined,
        customSettings
      }),
    [type, id, season, episode, resumeSeconds, customSettings]
  );

  function handleSaveCustomSettings(newSettings) {
    const saved = saveVidoraSettings(newSettings);
    setCustomSettings(saved);
  }

  function changeEpisode(newSeason, newEpisode, shouldScroll = true) {
    const s = Math.max(1, Number(newSeason) || 1);
    const e = Math.max(1, Number(newEpisode) || 1);
    setSeason(s);
    setEpisode(e);
    setResumeSeconds(0);
    setParams({ season: String(s), episode: String(e) });

    if (shouldScroll && playerShellRef.current) {
      playerShellRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const currentEpData = seasonDetails?.episodes?.find((ep) => ep.episode_number === episode);
  const totalEpisodesInSeason = seasonDetails?.episodes?.length || 0;
  const availableSeasons = (titleDetails?.seasons || []).filter((s) => s.season_number > 0);

  return (
    <main className="player-page">
      {/* Player Top Navigation Bar */}
      <div className="player-topbar">
        <Link
          to={`/title/${type}/${id}`}
          className="back-link flex items-center flex-row gap-2 whitespace-nowrap"
          style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", whiteSpace: "nowrap" }}
        >
          <ArrowLeft size={16} className="shrink-0" />
          <span>Back to details</span>
        </Link>
        <div className="player-title-info">
          <h2>{titleDetails?.title || titleDetails?.name || "Antarctic Theatre"}</h2>
          {isTv && (
            <span className="player-ep-sub">
              Season {season}, Episode {episode}
              {currentEpData?.name ? ` — "${currentEpData.name}"` : ""}
            </span>
          )}
        </div>
        <div className="player-topbar-actions">
          <button
            type="button"
            className="player-customize-toggle-btn"
            onClick={() => setIsCustomizerOpen(true)}
            title="Customize player colors, autoplay, subtitles, and controls"
          >
            <Sliders size={14} /> Customize Player
          </button>
          <a
            className="external-player-link"
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            title="Open stream in a clean standalone window"
          >
            Open separately <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Embedded Iframe Shell */}
      <section ref={playerShellRef} className="embedded-player-shell">
        <iframe
          key={embedUrl}
          src={embedUrl}
          title={isTv ? "Vidora TV episode player" : "Vidora movie player"}
          className="embedded-player"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </section>

      {/* Player Disclaimer & API Status */}
      <div className="player-disclaimer">
        <AlertCircle size={15} />
        <p>
          Stream delivery powered by the{" "}
          <a
            href="https://vidora.ac/#customize"
            target="_blank"
            rel="noreferrer"
            className="text-gold font-medium hover:underline"
          >
            Vidora Embed API
          </a>
          . Subtitles, audio dubs, buffer rates, and resolutions are delivered via Vidora.
          Playback events and continue-watching timestamps are automatically synchronized.
        </p>
      </div>

      {/* TV Episode Selector Shelf with Thumbnails Beneath the Player */}
      {isTv && (
        <section className="player-episodes-shelf" aria-label="Episode selection">
          <div className="player-episodes-header">
            <div className="player-episodes-title-wrap">
              <h3>Episodes</h3>
              <span className="player-episodes-count">
                Season {season} · {totalEpisodesInSeason} Episodes
              </span>
            </div>

            <div className="player-episodes-controls">
              <div className="player-season-dropdown">
                <label htmlFor="player-season-select">
                  <ListOrdered size={14} /> Season:
                </label>
                <select
                  id="player-season-select"
                  value={season}
                  onChange={(e) => changeEpisode(e.target.value, 1, false)}
                >
                  {availableSeasons.length > 0 ? (
                    availableSeasons.map((s) => (
                      <option key={s.id} value={s.season_number}>
                        {s.name || `Season ${s.season_number}`}
                      </option>
                    ))
                  ) : (
                    <option value={season}>Season {season}</option>
                  )}
                </select>
              </div>

              {/* Prev / Next Episode Buttons */}
              <div className="player-quick-nav">
                <button
                  disabled={episode <= 1}
                  onClick={() => changeEpisode(season, episode - 1)}
                  className="ep-nav-btn"
                  title="Previous episode"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  disabled={totalEpisodesInSeason > 0 && episode >= totalEpisodesInSeason}
                  onClick={() => changeEpisode(season, episode + 1)}
                  className="ep-nav-btn"
                  title="Next episode"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Episode Cards Grid with Real Thumbnails */}
          {loadingSeason ? (
            <div className="loading">Loading episodes...</div>
          ) : totalEpisodesInSeason > 0 ? (
            <div className="player-episodes-grid">
              {seasonDetails.episodes.map((ep) => {
                const isCurrent = ep.episode_number === episode;
                return (
                  <div
                    key={ep.id}
                    className={`player-episode-card ${isCurrent ? "active-episode" : ""}`}
                    onClick={() => {
                      if (!isCurrent) changeEpisode(season, ep.episode_number);
                    }}
                  >
                    <div className="player-ep-thumb">
                      {ep.still_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                          alt={ep.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="player-ep-fallback">EP {ep.episode_number}</div>
                      )}
                      {isCurrent ? (
                        <span className="now-playing-badge">
                          <Play size={11} fill="currentColor" /> Now Playing
                        </span>
                      ) : (
                        <span className="player-ep-hover-play">
                          <Play size={18} fill="currentColor" />
                        </span>
                      )}
                    </div>
                    <div className="player-ep-content">
                      <div className="player-ep-meta-row">
                        <span className="player-ep-num">Episode {ep.episode_number}</span>
                        {ep.runtime ? (
                          <span className="player-ep-runtime">{ep.runtime}m</span>
                        ) : null}
                      </div>
                      <h4 title={ep.name}>{ep.name || `Episode ${ep.episode_number}`}</h4>
                      <p className="player-ep-overview">
                        {ep.overview ? ep.overview : "No description available."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">No episodes found for this season.</div>
          )}
        </section>
      )}

      {/* Interactive Customizer Modal */}
      <PlayerCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentSettings={customSettings}
        onSave={handleSaveCustomSettings}
        type={type}
        id={id}
        season={season}
        episode={episode}
      />
    </main>
  );
}
