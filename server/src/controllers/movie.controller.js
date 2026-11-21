const BASE = "https://api.tmdb.org/3";

// Simple in-memory cache for catalogue queries (TTL 5 minutes)
const cache = new Map();
const TTL = 5 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  if (cache.size > 200) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { timestamp: Date.now(), data });
}

async function tmdb(path) {
  if (!process.env.TMDB_API_KEY) throw new Error("TMDB_API_KEY is not configured");
  const cached = getCached(path);
  if (cached) return cached;

  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${process.env.TMDB_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status})`);
  }
  const data = await response.json();
  setCache(path, data);
  return data;
}

export async function getHome(req, res) {
  try {
    const [
      trending,
      popularMovies,
      popularTv,
      topRated,
      newHindi,
      trendingHindi,
      classicHindi,
      indianSeries
    ] = await Promise.all([
      tmdb("/trending/all/week"),
      tmdb("/movie/popular"),
      tmdb("/tv/popular"),
      tmdb("/movie/top_rated"),
      tmdb("/discover/movie?with_original_language=hi&sort_by=primary_release_date.desc&vote_count.gte=3"),
      tmdb("/discover/movie?with_original_language=hi&sort_by=popularity.desc"),
      tmdb("/discover/movie?with_original_language=hi&sort_by=vote_average.desc&vote_count.gte=80"),
      tmdb("/discover/tv?with_original_language=hi&sort_by=vote_count.desc")
    ]);
    res.json({
      trending: trending.results || [],
      popularMovies: popularMovies.results || [],
      popularTv: popularTv.results || [],
      topRated: topRated.results || [],
      newHindi: (newHindi.results || []).map((x) => ({ ...x, media_type: "movie" })),
      trendingHindi: (trendingHindi.results || []).map((x) => ({ ...x, media_type: "movie" })),
      classicHindi: (classicHindi.results || []).map((x) => ({ ...x, media_type: "movie" })),
      indianSeries: (indianSeries.results || []).map((x) => ({ ...x, media_type: "tv" }))
    });
  } catch (error) {
    console.error("getHome error:", error);
    res.status(502).json({ message: error.message || "Unable to load catalogue." });
  }
}

export async function getBollywood(req, res) {
  try {
    const [newHindi, trendingHindi, classicHindi, indianSeries] = await Promise.all([
      tmdb("/discover/movie?with_original_language=hi&sort_by=primary_release_date.desc&vote_count.gte=3"),
      tmdb("/discover/movie?with_original_language=hi&sort_by=popularity.desc"),
      tmdb("/discover/movie?with_original_language=hi&sort_by=vote_average.desc&vote_count.gte=80"),
      tmdb("/discover/tv?with_original_language=hi&sort_by=vote_count.desc")
    ]);
    res.json({
      newHindi: (newHindi.results || []).map((x) => ({ ...x, media_type: "movie" })),
      trendingHindi: (trendingHindi.results || []).map((x) => ({ ...x, media_type: "movie" })),
      classicHindi: (classicHindi.results || []).map((x) => ({ ...x, media_type: "movie" })),
      indianSeries: (indianSeries.results || []).map((x) => ({ ...x, media_type: "tv" }))
    });
  } catch (error) {
    console.error("getBollywood error:", error);
    res.status(502).json({ message: "Unable to load Bollywood collection." });
  }
}

export async function getDiscover(req, res) {
  try {
    const type = req.params.type === "tv" ? "tv" : "movie";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const sortBy = req.query.sort_by || "popularity.desc";
    const year = req.query.year ? parseInt(req.query.year) : null;
    const genre = req.query.genre ? req.query.genre.trim() : null;

    let path = `/discover/${type}?page=${page}&sort_by=${encodeURIComponent(sortBy)}&include_adult=false`;

    // When sorting by vote_average, require a minimum threshold of votes to avoid obscure 10/10 single-vote entries
    if (sortBy === "vote_average.desc") {
      path += "&vote_count.gte=200";
    }

    if (year) {
      if (type === "tv") {
        path += `&first_air_date_year=${year}`;
      } else {
        path += `&primary_release_year=${year}`;
      }
    }

    if (genre) {
      path += `&with_genres=${encodeURIComponent(genre)}`;
    }

    const data = await tmdb(path);

    res.json({
      page: data.page || page,
      totalPages: data.total_pages || 1,
      totalResults: data.total_results || 0,
      results: (data.results || []).map((item) => ({ ...item, media_type: type }))
    });
  } catch (error) {
    console.error("getDiscover error:", error);
    res.status(502).json({ message: error.message || "Failed to discover titles." });
  }
}

export async function getGenres(req, res) {
  try {
    const type = req.params.type === "tv" ? "tv" : "movie";
    const data = await tmdb(`/genre/${type}/list`);
    res.json(data.genres || []);
  } catch (error) {
    console.error("getGenres error:", error);
    res.status(502).json({ message: "Failed to fetch genres." });
  }
}

export async function searchTitles(req, res) {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) return res.json({ results: [] });
    const data = await tmdb(`/search/multi?query=${encodeURIComponent(query)}&include_adult=false`);
    res.json({ results: (data.results || []).filter(x => ["movie", "tv"].includes(x.media_type)) });
  } catch (error) {
    console.error("searchTitles error:", error);
    res.status(502).json({ message: error.message || "Search failed." });
  }
}

export async function getDetails(req, res) {
  try {
    const type = req.params.type === "tv" ? "tv" : "movie";
    const id = req.params.id;
    const [details, credits, videos, recommendations] = await Promise.all([
      tmdb(`/${type}/${id}`),
      tmdb(`/${type}/${id}/credits`).catch(() => ({ cast: [], crew: [] })),
      tmdb(`/${type}/${id}/videos`).catch(() => ({ results: [] })),
      tmdb(`/${type}/${id}/recommendations`).catch(() => ({ results: [] }))
    ]);
    res.json({
      ...details,
      media_type: type,
      credits,
      videos,
      recommendations: recommendations.results || []
    });
  } catch (error) {
    console.error("getDetails error:", error);
    res.status(502).json({ message: error.message || "Could not load title." });
  }
}

export async function getPersonCredits(req, res) {
  try {
    const { id } = req.params;
    const [person, credits] = await Promise.all([
      tmdb(`/person/${id}`),
      tmdb(`/person/${id}/combined_credits`).catch(() => ({ cast: [] }))
    ]);

    // Sort credits by popularity and only include entries with posters
    const knownFor = (credits.cast || [])
      .filter((item) => item.poster_path && (item.media_type === "movie" || item.media_type === "tv"))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    res.json({
      person: {
        id: person.id,
        name: person.name,
        biography: person.biography || "",
        profile_path: person.profile_path,
        known_for_department: person.known_for_department || "Acting"
      },
      credits: knownFor
    });
  } catch (error) {
    console.error("getPersonCredits error:", error);
    res.status(502).json({ message: error.message || "Failed to load actor filmography." });
  }
}

export async function getTvSeason(req, res) {
  try {
    const { id, seasonNumber } = req.params;
    const season = await tmdb(`/tv/${id}/season/${seasonNumber}`);
    res.json(season);
  } catch (error) {
    console.error("getTvSeason error:", error);
    res.status(502).json({ message: error.message || "Could not load TV season details." });
  }
}
