import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";
import { ArrowLeft, Server, Sliders } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { buildVidoraUrl, getSavedVidoraSettings, saveVidoraSettings, VIDORA_ORIGIN } from "../utils/vidora";
import PlayerCustomizerModal from "../components/PlayerCustomizerModal";

const SERVERS = [
  { id: "vidora", label: "Server 1 (Vidora)" },
  { id: "vidsrc_cc", label: "Server 2 (VidSrc.cc)" },
  { id: "vidsrc_to", label: "Server 3 (VidSrc.to)" }
];

export default function MobilePlayer() {
  const { type, id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isTv = type === "tv";
  const season = Math.max(1, Number(params.get("season") || 1));
  const episode = Math.max(1, Number(params.get("episode") || 1));
  const startAt = Number(params.get("startAt") || 0);

  const { user } = useAuth();
  const [activeServer, setActiveServer] = useState("vidora");
  const [titleDetails, setTitleDetails] = useState(null);
  const [customSettings, setCustomSettings] = useState(getSavedVidoraSettings);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const lastSyncRef = useRef(0);
  const currentPlaybackRef = useRef({ currentTime: 0, duration: 0 });

  useEffect(() => {
    if (window.AntarcticPhoneBridge?.setWatchMode) {
      window.AntarcticPhoneBridge.setWatchMode(true);
    }
    if (Capacitor.isNativePlatform()) {
      StatusBar.hide().catch(() => {});
    }
    return () => {
      if (window.AntarcticPhoneBridge?.setWatchMode) {
        window.AntarcticPhoneBridge.setWatchMode(false);
      }
      if (Capacitor.isNativePlatform()) {
        StatusBar.show().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    api.get(`/movies/${type}/${id}`)
      .then((res) => setTitleDetails(res.data || null))
      .catch(() => {});
  }, [type, id]);

  const syncProgress = useCallback(
    (currentTime, duration) => {
      if (!user || !titleDetails) return;
      api.post("/history", {
        tmdbId: Number(id),
        mediaType: type,
        title: titleDetails.title || titleDetails.name,
        posterPath: titleDetails.poster_path,
        backdropPath: titleDetails.backdrop_path,
        season: isTv ? season : undefined,
        episode: isTv ? episode : undefined,
        currentTime: Math.max(1, Math.floor(currentTime || 1)),
        duration: Math.floor(duration || 0)
      }).catch(() => {});
    },
    [user, titleDetails, id, type, isTv, season, episode]
  );

  // Immediately record to Continue Watching when playback starts
  useEffect(() => {
    if (user && titleDetails) {
      syncProgress(startAt > 0 ? startAt : 1, 0);
    }
  }, [user, titleDetails, startAt, syncProgress]);

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
        if ((eventType === "timeupdate" && now - lastSyncRef.current >= 15000) || eventType === "pause" || eventType === "ended") {
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
      return isTv ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` : `https://vidsrc.cc/v2/embed/movie/${id}`;
    }
    if (activeServer === "vidsrc_to") {
      return isTv ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}` : `https://vidsrc.to/embed/movie/${id}`;
    }
    return buildVidoraUrl({
      type,
      id,
      season,
      episode,
      startAt: startAt > 0 ? startAt : undefined,
      customSettings: { ...customSettings, autoplay: true }
    });
  }, [activeServer, type, isTv, id, season, episode, startAt, customSettings]);

  function cycleServer() {
    const idx = SERVERS.findIndex((s) => s.id === activeServer);
    setActiveServer(SERVERS[(idx + 1) % SERVERS.length].id);
  }

  const serverLabel = SERVERS.find((s) => s.id === activeServer)?.label || "Server 1";

  return (
    <div className="m-player-page">
      <div className="m-player-bar">
        <button type="button" className="m-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {titleDetails?.title || titleDetails?.name || "Now Playing"} {isTv ? `· S${season} E${episode}` : ""}
        </div>
        <button type="button" className="m-cat-pill" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={cycleServer}>
          <Server size={14} /> {serverLabel}
        </button>
        <button type="button" className="m-icon-btn" onClick={() => setIsCustomizerOpen(true)} aria-label="Settings">
          <Sliders size={16} />
        </button>
      </div>

      <iframe
        key={embedUrl}
        src={embedUrl}
        title="Antarctic Player"
        className="m-player-frame"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />

      <PlayerCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={customSettings}
        onSave={(next) => setCustomSettings(saveVidoraSettings(next))}
      />
    </div>
  );
}
