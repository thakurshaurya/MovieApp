import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const POSTER = "https://image.tmdb.org/t/p/w342";

export default function MobileExplore({ mediaType = "movie" }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [mediaType]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/movies/discover/${mediaType}?page=${page}&sort_by=popularity.desc`)
      .then((res) => {
        if (!mounted) return;
        const list = res.data?.results || [];
        setItems((prev) => (page === 1 ? list : [...prev, ...list]));
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [mediaType, page]);

  return (
    <div className="m-page">
      <h1 className="m-page-title">{mediaType === "tv" ? "TV Shows" : "Movies"}</h1>
      {loading && page === 1 ? (
        <div className="m-loading">Loading...</div>
      ) : (
        <>
          <div className="m-grid">
            {items.map((item) => {
              const label = item.title || item.name;
              return (
                <Link key={`${mediaType}-${item.id}`} to={`/title/${mediaType}/${item.id}`} className="m-card">
                  {item.poster_path ? (
                    <img src={`${POSTER}${item.poster_path}`} alt={label} className="m-card-img" loading="lazy" />
                  ) : (
                    <div className="m-card-img" style={{ display: "grid", placeItems: "center", fontSize: 10 }}>ANTARCTIC</div>
                  )}
                  <div className="m-card-title">{label}</div>
                </Link>
              );
            })}
          </div>
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <button type="button" className="m-btn-list" style={{ width: "100%" }} onClick={() => setPage((p) => p + 1)}>
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
