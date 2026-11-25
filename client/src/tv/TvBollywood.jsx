import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const POSTER = "https://image.tmdb.org/t/p/w185";

function TvBollywoodRail({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="tv-rail">
      <h2 className="tv-rail-title">{title}</h2>
      <div className="tv-rail-row">
        {items.slice(0, 14).map((item) => {
          const type = item.media_type || (item.first_air_date ? "tv" : "movie");
          const label = item.title || item.name || "Untitled";
          return (
            <Link key={`${title}-${type}-${item.id}`} to={`/title/${type}/${item.id}`} className="tv-card tv-focusable">
              {item.poster_path ? (
                <img src={`${POSTER}${item.poster_path}`} alt={label} className="tv-card-poster" loading="lazy" />
              ) : (
                <div className="tv-card-poster" style={{ display: "grid", placeItems: "center", fontSize: 12 }}>ANTARCTIC</div>
              )}
              <div className="tv-card-info">
                <h3 className="tv-card-title">{label}</h3>
                <span className="tv-card-sub">{type === "tv" ? "Hindi Series" : "Hindi Movie"}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function TvBollywood() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get("/movies/bollywood")
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="tv-loading">Loading Bollywood & Hindi...</div>;

  return (
    <div className="tv-page-container">
      <h1 className="tv-page-title" style={{ marginBottom: 24 }}>Bollywood & Hindi</h1>
      <TvBollywoodRail title="Trending Hindi Movies" items={data?.trendingHindi} />
      <TvBollywoodRail title="New Hindi Releases" items={data?.newHindi} />
      <TvBollywoodRail title="Indian Web Series" items={data?.indianSeries} />
      <TvBollywoodRail title="Classic Hindi Cinema" items={data?.classicHindi} />
    </div>
  );
}
