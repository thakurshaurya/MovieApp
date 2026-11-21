import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Clock } from "lucide-react";

export default function ContinueWatchingRow({ items = [] }) {
  const navigate = useNavigate();

  // Merge server history with local Vidora progress if available
  const displayItems = useMemo(() => {
    if (items && items.length > 0) return items;

    // Fallback to local vidoraProgress if user is guest or history empty
    try {
      const raw = localStorage.getItem("vidoraProgress");
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Object.values(data).map((entry) => {
        const curWatched = entry.progress?.watched || 0;
        const totalDur = entry.progress?.duration || 0;
        const pct = totalDur > 0 ? Math.round((curWatched / totalDur) * 100) : 0;

        return {
          _id: String(entry.id),
          tmdbId: entry.id,
          mediaType: entry.type || "movie",
          title: entry.title || "Untitled",
          posterPath: entry.poster_path,
          backdropPath: entry.backdrop_path,
          season: Number(entry.last_season_watched || 1),
          episode: Number(entry.last_episode_watched || 1),
          currentTime: curWatched,
          duration: totalDur,
          progress: pct,
          lastWatchedAt: entry.last_updated || Date.now()
        };
      });
    } catch {
      return [];
    }
  }, [items]);

  if (!displayItems || displayItems.length === 0) return null;

  return (
    <section className="content-section continue-watching-section">
      <div className="section-heading">
        <div>
          <h2>Continue Watching</h2>
          <p className="section-subtitle">Pick up right where you left off</p>
        </div>
        <Link to="/profile" className="section-link">
          <span>Manage history</span>
        </Link>
      </div>

      <div className="continue-row">
        {displayItems.slice(0, 8).map((item) => {
          const startParam =
            item.currentTime && item.currentTime > 5
              ? `startAt=${Math.floor(item.currentTime)}`
              : "";

          const watchUrl =
            item.mediaType === "tv"
              ? `/watch/tv/${item.tmdbId}?season=${item.season || 1}&episode=${
                  item.episode || 1
                }${startParam ? `&${startParam}` : ""}`
              : `/watch/movie/${item.tmdbId}${startParam ? `?${startParam}` : ""}`;

          const isTv = item.mediaType === "tv";
          const imageSrc = isTv
            ? (item.stillPath
                ? `https://image.tmdb.org/t/p/w500${item.stillPath}`
                : item.backdropPath
                ? `https://image.tmdb.org/t/p/w500${item.backdropPath}`
                : item.posterPath
                ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
                : null)
            : (item.backdropPath
                ? `https://image.tmdb.org/t/p/w500${item.backdropPath}`
                : item.posterPath
                ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
                : null);

          const progressPercent = Math.min(100, Math.max(0, item.progress || 0));

          return (
            <div
              key={item._id || `${item.tmdbId}-${item.season}-${item.episode}`}
              className="continue-card"
              onClick={() => navigate(watchUrl)}
            >
              <div className="continue-thumb">
                {imageSrc ? (
                  <img src={imageSrc} alt={item.title} loading="lazy" />
                ) : (
                  <div className="continue-fallback">VIDORA</div>
                )}
                <div className="continue-play-overlay">
                  <span className="continue-play-badge">
                    <Play size={18} fill="currentColor" />
                  </span>
                </div>
                {/* Visual Progress Bar */}
                {progressPercent > 0 && (
                  <div className="continue-progress-bar" title={`${progressPercent}% completed`}>
                    <div
                      className="continue-progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="continue-meta">
                <span className="continue-type">
                  {item.mediaType === "tv"
                    ? `S${item.season} · E${item.episode}${
                        item.episodeTitle ? ` - ${item.episodeTitle}` : ""
                      }`
                    : "Film"}
                </span>
                <h3 title={item.title}>{item.title}</h3>
                <div className="continue-footer-line">
                  <span className="continue-time">
                    <Clock size={11} />{" "}
                    {item.lastWatchedAt
                      ? new Date(item.lastWatchedAt).toLocaleDateString()
                      : "Recently watched"}
                  </span>
                  {progressPercent > 0 && (
                    <span className="continue-percent-badge">{progressPercent}%</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
