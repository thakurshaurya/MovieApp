import { useEffect, useState } from "react";
import api from "../api";
import ContentRow from "../components/ContentRow";

export default function Bollywood() {
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

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading">Loading Bollywood & Hindi Cinema...</div>
      </main>
    );
  }

  return (
    <main className="page-shell" style={{ paddingTop: 96 }}>
      <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, marginBottom: 24 }}>
        Bollywood & Hindi Cinema
      </h1>
      <ContentRow title="Trending Hindi Movies" subtitle="Popular Bollywood blockbusters" items={data?.trendingHindi || []} link="" />
      <ContentRow title="New Hindi Releases" subtitle="Latest Hindi films" items={data?.newHindi || []} link="" />
      <ContentRow title="Indian Web Series" subtitle="Top Hindi series" items={data?.indianSeries || []} link="" />
      <ContentRow title="Classic Hindi Cinema" subtitle="Timeless favorites" items={data?.classicHindi || []} link="" />
    </main>
  );
}
