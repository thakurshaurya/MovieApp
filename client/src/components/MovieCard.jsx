import { Link } from "react-router-dom";
import { Play } from "lucide-react";

const IMG = "https://image.tmdb.org/t/p/w500";

export default function MovieCard({ item }) {
  if (!item) return null;
  const type = item.media_type || item.mediaType || (item.first_air_date ? "tv" : "movie");
  const id = item.id || item.tmdbId;
  const title = item.title || item.name || "Untitled";
  const poster = item.poster_path || item.posterPath;
  const rating = typeof item.vote_average === "number"
    ? item.vote_average.toFixed(1)
    : (typeof item.voteAverage === "number" && item.voteAverage > 0 ? item.voteAverage.toFixed(1) : null);
  const date = item.release_date || item.first_air_date || item.releaseDate || "";
  const year = date ? date.slice(0, 4) : "—";

  return (
    <Link to={`/title/${type}/${id}`} className="movie-card group" aria-label={`View ${title}`}>
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
  );
}
