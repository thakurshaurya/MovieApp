import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, Info, Sparkles, BookmarkPlus, Check, ChevronLeft, ChevronRight, Film, Tv, Flame } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ContentRow from "../components/ContentRow";
import ContinueWatchingRow from "../components/ContinueWatchingRow";

const BACKDROP = "https://image.tmdb.org/t/p/original";
const TOTAL_HERO_SLIDES = 7;
const ROTATION_INTERVAL_MS = 6000; // 6s per slide

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [recentHistory, setRecentHistory] = useState([]);
  const [userWatchlist, setUserWatchlist] = useState([]);
  const [heroSaved, setHeroSaved] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { user } = useAuth();

  // Groq AI Recommendations State
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [tasteAnalysis, setTasteAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(true);
  const [groqConfigured, setGroqConfigured] = useState(true);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const loadAiRecommendations = useCallback((forceRefresh = false) => {
    setAiLoading(true);

    let guestTitles = [];
    if (!user) {
      try {
        const raw = localStorage.getItem("vidoraProgress");
        if (raw) {
          const parsed = JSON.parse(raw);
          guestTitles = Object.values(parsed).map((x) => x.title).filter(Boolean);
        }
      } catch { }
    }

    const endpoint = forceRefresh
      ? "/movies/recommendations/ai?refresh=true"
      : "/movies/recommendations/ai";

    const request =
      guestTitles.length > 0
        ? api.post(endpoint, { titles: guestTitles })
        : api.get(endpoint);

    request
      .then((res) => {
        setGroqConfigured(res.data.groqConfigured !== false);
        setTasteAnalysis(res.data.tasteAnalysis || "");
        setAiRecommendations(res.data.recommendations || []);
      })
      .catch(() => {
        setAiRecommendations([]);
      })
      .finally(() => {
        setAiLoading(false);
      });
  }, [user]);

  // Refresh recommendations whenever watch history updates
  useEffect(() => {
    loadAiRecommendations(false);
  }, [recentHistory, loadAiRecommendations]);

  useEffect(() => {
    let isMounted = true;

    // Fetch catalogue
    api.get("/movies/home")
      .then((r) => {
        if (isMounted) setData(r.data);
      })
      .catch(() => {
        if (isMounted) {
          setError("Could not load titles. Check server and TMDB configuration.");
        }
      });

    // If user is logged in, fetch history and watchlist
    if (user) {
      api.get("/history?limit=10")
        .then((r) => {
          if (isMounted) setRecentHistory(r.data);
        })
        .catch(() => { });

      api.get("/watchlist")
        .then((r) => {
          if (isMounted) setUserWatchlist(r.data);
        })
        .catch(() => { });
    } else {
      setRecentHistory([]);
      setUserWatchlist([]);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Extract top 7 high-quality spotlight recommendations with backdrops and overviews
  const spotlightItems = useMemo(() => {
    if (!data) return [];
    const pool = [
      ...(data.trending || []),
      ...(data.popularMovies || []),
      ...(data.popularTv || [])
    ];

    // Filter to items with high-res backdrop & descriptions, then deduplicate by ID
    const valid = pool.filter((item) => item.backdrop_path && item.overview && item.overview.length > 20);
    const unique = Array.from(new Map(valid.map((item) => [item.id, item])).values());
    return unique.slice(0, TOTAL_HERO_SLIDES);
  }, [data]);

  const totalSlides = spotlightItems.length;

  // Unstoppable automatic timer: runs continuously and only pauses temporarily while hover is active
  useEffect(() => {
    if (totalSlides <= 1) return;

    const timer = setInterval(() => {
      if (!isPausedRef.current) {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
      }
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [totalSlides]);

  // Currently active spotlight item
  const currentItem = spotlightItems[currentIndex] || null;

  // Check if current hero item is in the user's watchlist
  useEffect(() => {
    if (currentItem && userWatchlist.length > 0) {
      const exists = userWatchlist.some((item) => item.tmdbId === currentItem.id);
      setHeroSaved(exists);
    } else {
      setHeroSaved(false);
    }
  }, [currentItem, userWatchlist]);

  async function handleHeroWatchlist() {
    if (!user || !currentItem) return;
    try {
      if (heroSaved) {
        await api.delete(`/watchlist/${currentItem.media_type || "movie"}/${currentItem.id}`);
        setHeroSaved(false);
        setUserWatchlist((prev) => prev.filter((item) => item.tmdbId !== currentItem.id));
      } else {
        await api.post("/watchlist", {
          tmdbId: currentItem.id,
          mediaType: currentItem.media_type || "movie",
          title: currentItem.title || currentItem.name,
          posterPath: currentItem.poster_path,
          backdropPath: currentItem.backdrop_path,
          voteAverage: currentItem.vote_average,
          releaseDate: currentItem.release_date || currentItem.first_air_date,
          overview: currentItem.overview
        });
        setHeroSaved(true);
      }
    } catch {
      // ignore
    }
  }

  const prevSlide = () => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const nextSlide = () => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  return (
    <main className="home-main">
      {/* Dynamic Auto-Rotating Hero Section */}
      <section
        className="hero"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={
          currentItem?.backdrop_path
            ? {
              backgroundImage: `linear-gradient(90deg, #06090e 0%, rgba(6,9,14,0.92) 36%, rgba(6,9,14,0.3) 100%), linear-gradient(0deg, #06090e 0%, transparent 60%), url(${BACKDROP}${currentItem.backdrop_path})`
            }
            : {}
        }
      >
        <div className="hero-content">
          <div className="eyebrow">
            <Sparkles size={14} className="text-gold" />
            <span>FEATURED SPOTLIGHT</span>
          </div>
          <p className="hero-kicker">
            {currentItem?.media_type === "tv" ? "THE ANTARCTIC SERIES" : "THE ANTARCTIC PREMIERE"}
          </p>
          <h1>{currentItem?.title || currentItem?.name || "Cinema Beyond Boundaries"}</h1>
          <p className="hero-description">
            {currentItem?.overview ||
              "Stream top-tier movies, award-winning dramas, and captivating series directly on Antarctic."}
          </p>

          <div className="hero-actions">
            {currentItem && (
              <Link
                className="primary-button"
                to={`/watch/${currentItem.media_type || "movie"}/${currentItem.id}`}
              >
                <Play size={16} fill="currentColor" /> Play Now
              </Link>
            )}
            {currentItem && (
              <Link
                className="secondary-button"
                to={`/title/${currentItem.media_type || "movie"}/${currentItem.id}`}
              >
                <Info size={16} /> Details
              </Link>
            )}
            {user && currentItem && (
              <button
                type="button"
                onClick={handleHeroWatchlist}
                className="secondary-button hero-watchlist-btn"
                title={heroSaved ? "Remove from my list" : "Add to my list"}
              >
                {heroSaved ? (
                  <>
                    <Check size={16} className="text-gold" /> In My List
                  </>
                ) : (
                  <>
                    <BookmarkPlus size={16} /> Add to List
                  </>
                )}
              </button>
            )}
          </div>

          <div className="hero-footnote">
            <span className="live-dot" />
            <span>METADATA BY TMDB · STREAMED VIA ANTARCTIC EMBED</span>
          </div>
        </div>

        {/* Dynamic Index Indicator (01 / 07) & Step Dots */}
        <div className="hero-index">
          <div className="hero-carousel-nav">
            <button
              onClick={prevSlide}
              className="hero-arrow-btn"
              aria-label="Previous recommendation"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="hero-number-box">
              <span className="current-num">
                {String(currentIndex + 1).padStart(2, "0")}
              </span>
              <span className="slash">/</span>
              <span className="total-num">
                {String(totalSlides || TOTAL_HERO_SLIDES).padStart(2, "0")}
              </span>
            </div>
            <button
              onClick={nextSlide}
              className="hero-arrow-btn"
              aria-label="Next recommendation"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <i />
          <div className="hero-pagination-dots">
            {spotlightItems.map((_, idx) => (
              <button
                key={idx}
                className={`dot-pill ${idx === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to recommendation ${idx + 1}`}
              >
                {idx === currentIndex && (
                  <span
                    key={`progress-${idx}`}
                    className="dot-progress-fill"
                    style={{
                      animationDuration: `${ROTATION_INTERVAL_MS}ms`,
                      animationPlayState: isPaused ? "paused" : "running"
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <div className="notice">{error}</div>}

      {!data && !error && (
        <div className="catalogue">
          <div className="skeleton-row">
            <div className="skeleton-title" />
            <div className="skeleton-cards">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="catalogue">
          {/* Continue Watching (Logged in users with history) */}
          {user && recentHistory.length > 0 && (
            <ContinueWatchingRow items={recentHistory} />
          )}

          {/* Recommended For You Section */}
          {aiRecommendations.length > 0 && (
            <ContentRow
              title="Recommended For You"
              subtitle="Stories curated for your taste"
              items={aiRecommendations}
              link="/explore"
            />
          )}

          {/* User Watchlist Row (if they have items) */}
          {user && userWatchlist.length > 0 && (
            <ContentRow
              title="From Your Watchlist"
              subtitle="Titles saved for later viewing"
              items={userWatchlist}
              link="/watchlist"
            />
          )}

          {/* Trending Movies & Shows */}
          <ContentRow
            title="Trending This Week"
            subtitle="The most-watched stories right now"
            items={data.trending}
            link="/explore"
          />

          {/* New Hindi Releases */}
          {data.newHindi && data.newHindi.length > 0 && (
            <ContentRow
              title="New Hindi Releases"
              subtitle="Latest theatrical and digital Hindi cinema"
              items={data.newHindi}
              link="/explore"
            />
          )}

          {/* Trending Hindi Movies */}
          {data.trendingHindi && data.trendingHindi.length > 0 && (
            <ContentRow
              title="Trending Hindi This Week"
              subtitle="The most popular Bollywood blockbusters right now"
              items={data.trendingHindi}
              link="/explore"
            />
          )}

          {/* All-Time Bollywood Classics */}
          {data.classicHindi && data.classicHindi.length > 0 && (
            <ContentRow
              title="All-Time Bollywood Classics"
              subtitle="Timeless cinematic masterpieces and iconic performances"
              items={data.classicHindi}
              link="/movies"
            />
          )}

          {/* Indian TV & Web Series */}
          {data.indianSeries && data.indianSeries.length > 0 && (
            <ContentRow
              title="Indian TV & Web Series"
              subtitle="Sacred Games, Mirzapur, The Family Man, Panchayat, and top Indian originals"
              items={data.indianSeries}
              link="/tvshows"
            />
          )}

          {/* Popular Movies */}
          <ContentRow
            title="Popular Feature Films"
            subtitle="Blockbusters and acclaimed cinematic releases"
            items={data.popularMovies}
            link="/movies"
          />

          {/* Popular Series */}
          <ContentRow
            title="Critically Acclaimed TV Shows"
            subtitle="Engaging serialized storytelling"
            items={data.popularTv}
            link="/tvshows"
          />

          {/* Top Rated */}
          <ContentRow
            title="All-Time Classics"
            subtitle="Top-rated films with unforgettable performances"
            items={data.topRated}
            link="/movies"
          />
        </div>
      )}
    </main>
  );
}
