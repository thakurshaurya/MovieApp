import ViewingHistory from "../models/ViewingHistory.js";

const BASE_TMDB = "https://api.tmdb.org/3";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Prioritized list of supported Groq models
const CANDIDATE_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];

// 15-minute in-memory cache for AI recommendations
const aiCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

export function invalidateAiCache(userId) {
  if (userId) {
    aiCache.delete(`user_${userId}`);
  }
}

async function tmdbFetch(path) {
  if (!process.env.TMDB_API_KEY) throw new Error("TMDB_API_KEY not configured");
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE_TMDB}${path}${sep}api_key=${process.env.TMDB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

/**
 * Call Groq API with automatic model candidate fallback
 */
async function callGroqChat({ messages }) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    return null;
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const payload = {
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 3500
      };

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Groq model ${model} failed (${response.status}): ${errorText.slice(0, 100)}... Trying next.`);
        lastError = new Error(`Groq ${model} failed (${response.status})`);
        continue;
      }

      const result = await response.json();
      const rawContent = result.choices?.[0]?.message?.content;
      if (rawContent) {
        return JSON.parse(rawContent);
      }
    } catch (err) {
      console.warn(`Groq model ${model} error:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Groq candidate models failed");
}

/**
 * Match a text title to a verified TMDB entry with posters and metadata
 */
async function matchTitleWithTmdb(title, preferredType) {
  try {
    const searchRes = await tmdbFetch(
      `/search/multi?query=${encodeURIComponent(title)}&include_adult=false`
    );
    const results = searchRes.results || [];
    if (results.length === 0) return null;

    // Filter to valid media types with poster art
    const match =
      results.find(
        (r) =>
          (!preferredType || r.media_type === preferredType) &&
          (r.poster_path || r.backdrop_path)
      ) ||
      results.find((r) => r.poster_path || r.backdrop_path) ||
      results[0];

    if (!match) return null;

    return {
      id: match.id,
      tmdbId: match.id,
      media_type: match.media_type || preferredType || "movie",
      title: match.title || match.name || title,
      poster_path: match.poster_path,
      backdrop_path: match.backdrop_path,
      vote_average: typeof match.vote_average === "number" ? Math.round(match.vote_average * 10) / 10 : 0,
      overview: match.overview || "",
      release_date: match.release_date || match.first_air_date || ""
    };
  } catch {
    return null;
  }
}

/**
 * Controller: Get AI-powered recommendations based on watch history
 * Route: GET /api/movies/recommendations/ai
 * Accepts query: ?refresh=true and optional body titles
 */
export async function getAiRecommendations(req, res) {
  try {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const isGroqConfigured = Boolean(groqKey && groqKey !== "your_groq_api_key_here");

    if (!isGroqConfigured) {
      return res.json({
        groqConfigured: false,
        message: "Groq API key not configured. Add GROQ_API_KEY to server/.env to enable AI recommendations.",
        tasteAnalysis: "Enter your Groq API key in server/.env to generate personalized recommendations with Llama 3.3.",
        recommendations: []
      });
    }

    const userId = req.user?.id;
    const forceRefresh = req.query.refresh === "true";
    const cacheKey = userId ? `user_${userId}` : `guest_${JSON.stringify(req.body?.titles || [])}`;

    if (!forceRefresh && aiCache.has(cacheKey)) {
      const cached = aiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return res.json(cached.data);
      }
      aiCache.delete(cacheKey);
    }

    // 1. Gather viewing history
    let watchHistoryItems = [];
    if (userId) {
      const records = await ViewingHistory.find({ userId })
        .sort({ lastWatchedAt: -1 })
        .limit(12);

      watchHistoryItems = records.map((r) => ({
        title: r.title,
        mediaType: r.mediaType,
        season: r.season,
        episode: r.episode,
        progress: r.progress > 0 ? `${r.progress}% watched` : "started",
        overview: r.overview ? r.overview.slice(0, 100) : ""
      }));
    }

    // Also support guest titles passed from client vidoraProgress
    if (watchHistoryItems.length === 0 && Array.isArray(req.body?.titles)) {
      watchHistoryItems = req.body.titles.slice(0, 10).map((t) =>
        typeof t === "string" ? { title: t } : t
      );
    }

    // 2. Prepare Groq Prompt
    const hasHistory = watchHistoryItems.length > 0;
    const historyContext = hasHistory
      ? watchHistoryItems
          .map(
            (item, idx) =>
              `${idx + 1}. "${item.title}" (${item.mediaType || "film"}) - ${item.progress || "watched"}`
          )
          .join("\n")
      : "No watch history recorded yet. The user enjoys acclaimed, high-concept, narrative-driven cinema and prestige television.";

    const systemPrompt = `You are Antarctic Cinema's lead AI curator.
Your task is to analyze the user's viewing history and recommend 22 to 25 outstanding movies or TV series tailored specifically to their taste.

Strict rules:
1. Provide at least 22 distinct, acclaimed titles that directly complement the genres, tone, psychological depth, or pacing of the titles in their watch history.
2. Provide a 1-sentence personalized explanation ("reason") for each recommendation highlighting why it fits what they watched.
3. Return ONLY valid JSON matching this exact structure:
{
  "tasteAnalysis": "A 1-2 sentence compelling summary of their unique cinematic profile and preferences",
  "recommendations": [
    {
      "title": "Exact Title of Movie or Series",
      "mediaType": "movie" | "tv",
      "reason": "1 sentence explaining why they will love it based on their history"
    }
  ]
}`;

    const userPrompt = `Here is my watch history:\n${historyContext}\n\nPlease generate my 22 to 25 personalized recommendations.`;

    // 3. Call Groq
    const groqResponse = await callGroqChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    if (!groqResponse || !Array.isArray(groqResponse.recommendations)) {
      throw new Error("Invalid response format received from Groq");
    }

    // 4. Enrich Groq titles with TMDB posters, backdrops, and ratings
    const enrichedPromises = groqResponse.recommendations.map(async (rec) => {
      const tmdbData = await matchTitleWithTmdb(rec.title, rec.mediaType);
      if (!tmdbData) return null;
      return {
        ...tmdbData,
        aiReason: rec.reason || "Recommended based on your viewing history."
      };
    });

    let enrichedResults = (await Promise.all(enrichedPromises)).filter(Boolean);

    // Deduplicate by tmdb ID
    const seenIds = new Set();
    enrichedResults = enrichedResults.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    // If fewer than 20 items resolved, supplement with popular titles so the user always has at least 20 items
    if (enrichedResults.length < 20) {
      try {
        const fallback = await tmdbFetch("/trending/all/week");
        for (const item of (fallback.results || [])) {
          if (enrichedResults.length >= 25) break;
          if (item.poster_path && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            enrichedResults.push({
              id: item.id,
              tmdbId: item.id,
              media_type: item.media_type || "movie",
              title: item.title || item.name,
              poster_path: item.poster_path,
              backdrop_path: item.backdrop_path,
              vote_average: typeof item.vote_average === "number" ? Math.round(item.vote_average * 10) / 10 : 0,
              overview: item.overview || "",
              release_date: item.release_date || item.first_air_date || "",
              aiReason: "Popular title matching your genre preferences."
            });
          }
        }
      } catch {
        // Fallback fetch error ignored
      }
    }

    const finalResponse = {
      groqConfigured: true,
      tasteAnalysis:
        groqResponse.tasteAnalysis ||
        "Curated specifically for you based on your recent viewing history.",
      recommendations: enrichedResults,
      generatedAt: new Date().toISOString()
    };

    // Cache the result
    aiCache.set(cacheKey, { timestamp: Date.now(), data: finalResponse });

    res.json(finalResponse);
  } catch (error) {
    console.error("getAiRecommendations error:", error);
    res.status(500).json({
      groqConfigured: Boolean(process.env.GROQ_API_KEY),
      message: error.message || "Failed to generate AI recommendations",
      recommendations: []
    });
  }
}
