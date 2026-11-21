import { useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, RotateCcw, ChevronLeft, ChevronRight, Play, Cpu, AlertCircle } from "lucide-react";

const IMG = "https://image.tmdb.org/t/p/w500";

export default function AIRecommendationsRow({
  recommendations = [],
  tasteAnalysis = "",
  loading = false,
  groqConfigured = true,
  onRefresh
}) {
  const rowRef = useRef(null);

  function scroll(direction) {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth"
      });
    }
  }

  return (
    <section className="content-section ai-recommendations-section">
      <div className="section-heading">
        <div className="ai-heading-group">
          <div className="ai-title-row">
            <span className="ai-sparkle-icon">
              <Sparkles size={18} />
            </span>
            <h2>Recommended For You</h2>
            <span className="ai-groq-badge">
              <Cpu size={12} /> Groq · Llama 3.3
            </span>
          </div>
          {tasteAnalysis ? (
            <p className="ai-taste-subtitle">
              <span className="taste-quote">"{tasteAnalysis}"</span>
            </p>
          ) : (
            <p className="section-subtitle">
              Curated by Groq AI based on your recent viewing history
            </p>
          )}
        </div>

        <div className="ai-header-actions">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="ai-refresh-btn"
              title="Generate fresh AI recommendations"
            >
              <RotateCcw size={13} className={loading ? "spin-icon" : ""} />
              <span>{loading ? "Analyzing..." : "Refresh AI Picks"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Unconfigured Groq Key Notice */}
      {!groqConfigured && (
        <div className="groq-notice-banner">
          <AlertCircle size={16} />
          <div>
            <strong>Configure Groq API Key</strong>
            <p>
              Add <code>GROQ_API_KEY=your_key_here</code> to <code>server/.env</code> to unlock
              instant personalized film & show recommendations powered by Llama 3.3.
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="skeleton-row">
          <div className="skeleton-cards">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="row-wrapper">
          <button
            className="row-nav left"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="movie-row" ref={rowRef}>
            {recommendations.map((item) => {
              const type = item.media_type || item.mediaType || "movie";
              const id = item.id || item.tmdbId;
              const title = item.title || item.name || "Untitled";
              const poster = item.poster_path || item.posterPath;
              const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
              const date = item.release_date || item.first_air_date || "";
              const year = date ? date.slice(0, 4) : "—";

              return (
                <div key={`${type}-${id}`} className="ai-movie-card-wrap">
                  <Link
                    to={`/title/${type}/${id}`}
                    className="movie-card group"
                    aria-label={`View ${title}`}
                  >
                    <div className="poster-wrap">
                      {poster ? (
                        <img
                          loading="lazy"
                          src={`${IMG}${poster}`}
                          alt={`${title} poster`}
                          width="300"
                          height="450"
                        />
                      ) : (
                        <div className="poster-fallback">
                          <span>ANTARCTIC</span>
                        </div>
                      )}
                      {rating && <span className="rating">{rating}</span>}
                      <span className="card-play">
                        <Play size={20} fill="currentColor" />
                      </span>
                    </div>
                    <div className="card-meta">
                      <h3 title={title}>{title}</h3>
                      <span>{year}</span>
                    </div>
                  </Link>

                  {/* AI Reason Badge below card */}
                  {item.aiReason && (
                    <div className="ai-reason-box" title={item.aiReason}>
                      <span className="ai-reason-label">
                        <Sparkles size={10} /> Why this:
                      </span>
                      <p>{item.aiReason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            className="row-nav right"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      ) : (
        !loading &&
        groqConfigured && (
          <div className="ai-empty-box">
            <div className="ai-empty-content">
              <Sparkles size={22} className="text-gold" />
              <div>
                <strong>Personalized AI Recommendations Ready</strong>
                <p>
                  As you stream titles, Groq AI learns your taste in genres, tone, and pacing to curate custom suggestions. Click below to generate your picks.
                </p>
              </div>
            </div>
            {onRefresh && (
              <button onClick={onRefresh} className="ai-generate-btn">
                <Sparkles size={14} /> Generate My Picks
              </button>
            )}
          </div>
        )
      )}
    </section>
  );
}
