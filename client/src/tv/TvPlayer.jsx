import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ListOrdered, Sliders, Server, MousePointer } from "lucide-react";
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

const SERVERS = [
  { id: "vidora", label: "Server 1 (Vidora)" },
  { id: "vidsrc_cc", label: "Server 2 (VidSrc.cc)" },
  { id: "vidsrc_to", label: "Server 3 (VidSrc.to)" }
];

export default function TvPlayer() {
  const { type, id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTv = type === "tv";

  const [season, setSeason] = useState(Math.max(1, Number(params.get("season") || 1)));
  const [episode, setEpisode] = useState(Math.max(1, Number(params.get("episode") || 1)));
  const [resumeSeconds, setResumeSeconds] = useState(Number(params.get("startAt") || 0));
  const [customSettings, setCustomSettings] = useState(getSavedVidoraSettings);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const [activeServer, setActiveServer] = useState("vidora");
  const [titleDetails, setTitleDetails] = useState(null);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [hudVisible, setHudVisible] = useState(true);
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [pointerMode, setPointerMode] = useState(false);

  const hudTimerRef = useRef(null);
  const lastSyncRef = useRef(0);
  const currentPlaybackRef = useRef({ currentTime: 0, duration: 0 });
  const iframeRef = useRef(null);

  const showHudTemporarily = useCallback(() => {
    setHudVisible(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      if (!episodesOpen && !isCustomizerOpen) {
        setHudVisible(false);
      }
    }, 5000);
  }, [episodesOpen, isCustomizerOpen]);

  useEffect(() => {
    showHudTemporarily();
    return () => {
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, [showHudTemporarily]);

  // Listen for native pointer mode exit event
  useEffect(() => {
    window.__onTvPointerExit = () => setPointerMode(false);
    return () => {
      delete window.__onTvPointerExit;
    };
  }, []);

  // Sync player/HUD/pointer state with native Android TV remote bridge & tvNav
  useEffect(() => {
    const anyOverlayOpen = hudVisible || episodesOpen || isCustomizerOpen;
    window.__TV_NAV_PAUSED__ = !anyOverlayOpen || pointerMode;
    if (window.AntarcticTvBridge?.setPlayerState) {
      window.AntarcticTvBridge.setPlayerState(true, anyOverlayOpen);
    }
    return () => {
      window.__TV_NAV_PAUSED__ = false;
      if (window.AntarcticTvBridge?.setPlayerState) {
        window.AntarcticTvBridge.setPlayerState(false, true);
      }
      if (window.AntarcticTvBridge?.setPointerMode) {
        window.AntarcticTvBridge.setPointerMode(false);
      }
    };
  }, [hudVisible, episodesOpen, isCustomizerOpen, pointerMode]);

  // Listen for remote keys to toggle TV HUD overlay
  useEffect(() => {
    function onKeyDown(e) {
      if (pointerMode) return;
      if (e.key === "ArrowUp" || e.key === "ContextMenu" || e.key === "Info" || e.keyCode === 82) {
        showHudTemporarily();
      } else if (e.key === "ArrowDown" && hudVisible && !episodesOpen && !isCustomizerOpen) {
        setHudVisible(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showHudTemporarily, hudVisible, episodesOpen, isCustomizerOpen, pointerMode]);

  useEffect(() => {
    const s = Math.max(1, Number(params.get("season") || 1));
    const e = Math.max(1, Number(params.get("episode") || 1));
    const start = Number(params.get("startAt") || 0);
    setSeason(s);
    setEpisode(e);
    if (start > 0) setResumeSeconds(start);
  }, [params]);

  useEffect(() => {
    let mounted = true;
    api.get(`/movies/${type}/${id}`)
      .then((res) => {
        if (mounted) setTitleDetails(res.data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [type, id]);

  useEffect(() => {
    if (!isTv) return;
    let mounted = true;
    api.get(`/movies/tv/${id}/season/${season}`)
      .then((res) => {
        if (mounted) setSeasonDetails(res.data);
      })
      .catch(() => {
        if (mounted) setSeasonDetails(null);
      });
    return () => {
      mounted = false;
    };
  }, [isTv, id, season]);

  useEffect(() => {
    if (!Number(params.get("startAt"))) {
      const stored = getStoredVidoraProgress(id, type, season, episode);
      if (stored?.watched > 10) {
        setResumeSeconds(Math.floor(stored.watched));
      }
    }
  }, [id, type, season, episode, params]);

  // Immediately record to Continue Watching when playback starts
  useEffect(() => {
    if (user && titleDetails) {
      api.post("/history", {
        tmdbId: Number(id),
        mediaType: type,
        title: titleDetails.title || titleDetails.name,
        posterPath: titleDetails.poster_path,
        backdropPath: titleDetails.backdrop_path,
        season: isTv ? season : undefined,
        episode: isTv ? episode : undefined,
        currentTime: Math.max(1, Math.floor(resumeSeconds || 1)),
        duration: 0
      }).catch(() => {});
    }
  }, [user, titleDetails, id, type, isTv, season, episode, resumeSeconds]);

  const syncProgress = useCallback(
    (currentTime, duration) => {
      if (!user || !titleDetails || currentTime <= 0) return;
      api.post("/history", {
        tmdbId: Number(id),
        mediaType: type,
        title: titleDetails.title || titleDetails.name,
        posterPath: titleDetails.poster_path,
        backdropPath: titleDetails.backdrop_path,
        season: isTv ? season : undefined,
        episode: isTv ? episode : undefined,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration || 0)
      }).catch(() => {});
    },
    [user, titleDetails, id, type, isTv, season, episode]
  );

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== VIDORA_ORIGIN) return;
      let payload = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      if (payload?.type === "PLAYER_EVENT" && payload.data) {
        const { event: eventType, currentTime, duration } = payload.data;
        currentPlaybackRef.current = { currentTime: currentTime || 0, duration: duration || 0 };
        const now = Date.now();
        if (eventType === "timeupdate" && now - lastSyncRef.current >= 15000) {
          lastSyncRef.current = now;
          syncProgress(currentTime, duration);
        } else if (eventType === "pause" || eventType === "ended") {
          lastSyncRef.current = now;
          syncProgress(currentTime, duration);
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      if (currentPlaybackRef.current.currentTime > 0) {
        syncProgress(currentPlaybackRef.current.currentTime, currentPlaybackRef.current.duration);
      }
    };
  }, [syncProgress]);

  const embedUrl = useMemo(() => {
    if (activeServer === "vidsrc_cc") {
      return isTv
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.cc/v2/embed/movie/${id}`;
    }
    if (activeServer === "vidsrc_to") {
      return isTv
        ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${id}`;
    }
    return buildVidoraUrl({
      type,
      id,
      season,
      episode,
      startAt: resumeSeconds > 0 ? resumeSeconds : undefined,
      customSettings: { ...customSettings, autoplay: true }
    });
  }, [activeServer, type, isTv, id, season, episode, resumeSeconds, customSettings]);

  function cycleServer() {
    const idx = SERVERS.findIndex((s) => s.id === activeServer);
    const next = SERVERS[(idx + 1) % SERVERS.length];
    setActiveServer(next.id);
    showHudTemporarily();
  }

  function togglePointerMode() {
    const next = !pointerMode;
    setPointerMode(next);
    setHudVisible(false);
    if (window.AntarcticTvBridge?.setPointerMode) {
      window.AntarcticTvBridge.setPointerMode(next);
    }
  }

  function changeEpisode(newSeason, newEpisode) {
    const s = Math.max(1, Number(newSeason) || 1);
    const e = Math.max(1, Number(newEpisode) || 1);
    setSeason(s);
    setEpisode(e);
    setResumeSeconds(0);
    setEpisodesOpen(false);
    setParams({ season: String(s), episode: String(e) });
  }

  const totalEpisodes = seasonDetails?.episodes?.length || 0;
  const currentEpData = seasonDetails?.episodes?.find((ep) => ep.episode_number === episode);
  const currentServerLabel = SERVERS.find((s) => s.id === activeServer)?.label || "Server 1";

  return (
    <div className="tv-player-fullscreen" onMouseMove={showHudTemporarily}>
      <iframe
        ref={iframeRef}
        key={embedUrl}
        src={embedUrl}
        title={isTv ? "Antarctic TV Episode Player" : "Antarctic TV Movie Player"}
        className="tv-player-iframe"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />

      {!hudVisible && (
        <button
          type="button"
          className="tv-hud-peek-btn tv-focusable"
          onClick={showHudTemporarily}
        >
          {pointerMode ? "Pointer ON (Back to Exit)" : "▲ TV Controls"}
        </button>
      )}

      <div className={`tv-player-hud ${hudVisible ? "" : "hidden"}`}>
        <div className="tv-hud-group">
          <button
            type="button"
            className="tv-hud-btn tv-focusable"
            onClick={() => navigate(`/title/${type}/${id}`)}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h2 className="tv-hud-title">{titleDetails?.title || titleDetails?.name || "Now Playing"}</h2>
            {isTv && (
              <span className="tv-hud-sub">
                Season {season} · Episode {episode}
                {currentEpData?.name ? ` — ${currentEpData.name}` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="tv-hud-group">
          <button
            type="button"
            className="tv-hud-btn tv-focusable"
            onClick={cycleServer}
          >
            <Server size={16} /> {currentServerLabel}
          </button>

          <button
            type="button"
            className="tv-hud-btn tv-focusable"
            onClick={togglePointerMode}
            title="Move a mouse pointer with D-Pad to click settings inside the player"
          >
            <MousePointer size={16} /> {pointerMode ? "Exit Pointer" : "Pointer Mode"}
          </button>

          {isTv && (
            <>
              <button
                type="button"
                className="tv-hud-btn tv-focusable"
                disabled={episode <= 1}
                onClick={() => changeEpisode(season, episode - 1)}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                type="button"
                className="tv-hud-btn tv-focusable"
                disabled={totalEpisodes > 0 && episode >= totalEpisodes}
                onClick={() => changeEpisode(season, episode + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className="tv-hud-btn tv-focusable"
                onClick={() => setEpisodesOpen((v) => !v)}
              >
                <ListOrdered size={16} /> Episodes
              </button>
            </>
          )}

          <button
            type="button"
            className="tv-hud-btn tv-focusable"
            onClick={() => setIsCustomizerOpen(true)}
          >
            <Sliders size={16} /> Customize
          </button>
        </div>
      </div>

      {isTv && episodesOpen && (
        <div className="tv-episode-drawer">
          <div className="tv-page-header" style={{ marginBottom: 12 }}>
            <h3 className="tv-rail-title" style={{ margin: 0 }}>Season {season} Episodes</h3>
            <button
              type="button"
              className="tv-hud-btn tv-focusable"
              onClick={() => setEpisodesOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="tv-episodes-row">
            {(seasonDetails?.episodes || []).map((ep) => (
              <button
                key={ep.id}
                type="button"
                className="tv-episode-card tv-focusable"
                onClick={() => changeEpisode(season, ep.episode_number)}
              >
                {ep.still_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                    alt={ep.name}
                    className="tv-episode-thumb"
                  />
                )}
                <div className="tv-episode-body">
                  <h4>{ep.episode_number}. {ep.name}</h4>
                  <p>{ep.overview || "Play episode"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <PlayerCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={customSettings}
        onSave={(next) => setCustomSettings(saveVidoraSettings(next))}
      />
    </div>
  );
}
