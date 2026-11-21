import { useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import MovieCard from "./MovieCard";

export default function ContentRow({ title, items = [], link = "/explore", subtitle }) {
  const rowRef = useRef(null);

  if (!items || items.length === 0) return null;

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
    <section className="content-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link} className="section-link">
            <span>Explore all</span>
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      <div className="row-wrapper">
        <button
          className="row-nav left"
          onClick={() => scroll("left")}
          aria-label={`Scroll ${title} left`}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="movie-row" ref={rowRef}>
          {items.slice(0, 30).map((item) => (
            <MovieCard
              key={`${item.media_type || item.mediaType || "x"}-${item.id || item.tmdbId}`}
              item={item}
            />
          ))}
        </div>

        <button
          className="row-nav right"
          onClick={() => scroll("right")}
          aria-label={`Scroll ${title} right`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
