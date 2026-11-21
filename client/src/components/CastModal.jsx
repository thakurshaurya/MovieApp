import { useEffect, useState } from "react";
import { X, Film, Star, User } from "lucide-react";
import api from "../api";
import MovieCard from "./MovieCard";

const PROFILE_IMG = "https://image.tmdb.org/t/p/w185";

export default function CastModal({ isOpen, actorId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !actorId) {
      setData(null);
      setError("");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    api.get(`/movies/person/${actorId}`)
      .then((res) => {
        if (isMounted) setData(res.data);
      })
      .catch((err) => {
        if (isMounted) setError("Could not load filmography for this actor.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, actorId]);

  // Handle ESC key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const person = data?.person;
  const credits = data?.credits || [];

  return (
    <div className="actor-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="actor-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="actor-modal-header">
          <div className="actor-hero">
            {person?.profile_path ? (
              <img
                src={`${PROFILE_IMG}${person.profile_path}`}
                alt={person.name}
                className="actor-hero-img"
              />
            ) : (
              <div className="actor-hero-fallback">
                <User size={30} />
              </div>
            )}
            <div className="actor-hero-info">
              <h2>{person?.name || "Actor Filmography"}</h2>
              <span className="actor-hero-dept">
                {credits.length} {credits.length === 1 ? "Performance" : "Performances"} Recorded
              </span>
            </div>
          </div>
          <button
            type="button"
            className="actor-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="actor-modal-body">
          {loading ? (
            <div className="actor-loading">
              <div className="loading-spinner" />
              <span>Loading filmography...</span>
            </div>
          ) : error ? (
            <div className="actor-error">{error}</div>
          ) : (
            <>
              {person?.biography && (
                <p className="actor-bio">
                  {person.biography.length > 320
                    ? `${person.biography.slice(0, 320)}...`
                    : person.biography}
                </p>
              )}

              <div className="actor-credits-section">
                <div className="actor-credits-title">
                  <Film size={16} className="text-gold" />
                  <h3>Known For & Filmography</h3>
                </div>

                {credits.length === 0 ? (
                  <p className="actor-empty">No titles found for this performer.</p>
                ) : (
                  <div className="actor-filmography-grid">
                    {credits.map((movie) => (
                      <div key={`${movie.media_type}-${movie.id}`} onClick={onClose}>
                        <MovieCard item={movie} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
