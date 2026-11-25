import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const POSTER = "https://image.tmdb.org/t/p/w342";

function BollywoodRail({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="m-rail">
      <h2 className="m-rail-title">{title}</h2>
      <div className="m-rail-row">
        {items.slice(0, 18).map((item) => {
          const type = item.media_type || (item.first_air_date ? "tv" : "movie");
          const label = item.title || item.name || "Untitled";
          return (
            <Link key={`${title}-${type}-${item.id}`} to={`/title/${type}/${item.id}`} className="m-card">
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
    </section>
  );
}

export default function MobileBollywood() {
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

  if (loading) return <div className="m-loading">Loading Bollywood & Hindi...</div>;

  return (
    <div style={{ paddingTop: "calc(64px + env(safe-area-inset-top, 0px))", paddingBottom: 24 }}>
      <h1 className="m-page-title" style={{ padding: "0 16px" }}>Bollywood & Hindi</h1>
      <BollywoodRail title="Trending Hindi Movies" items={data?.trendingHindi} />
      <BollywoodRail title="New Hindi Releases" items={data?.newHindi} />
      <BollywoodRail title="Indian Web Series" items={data?.indianSeries} />
      <BollywoodRail title="Classic Hindi Cinema" items={data?.classicHindi} />
    </div>
  );
}
