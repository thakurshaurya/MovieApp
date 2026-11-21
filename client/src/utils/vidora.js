/**
 * Vidora Streaming Embed API Integration & Customization Utility
 * Documentation & Playground: https://vidora.ac/#customize
 */

export const VIDORA_ORIGIN = "https://vidora.ac";

export const DEFAULT_VIDORA_SETTINGS = {
  primaryColor: "00e5ff",   // Antarctic Cyan (hex without #)
  secondaryColor: "06090e", // Deep Glacial Background
  iconColor: "f0fdfa",      // Arctic Ice White
  title: true,              // Show media title
  poster: true,             // Show poster image before playback
  autoplay: true,           // Autoplay on load (default true)
  nextbutton: true,         // Show next episode button at 90% watched
  sub_file: "",             // Optional external VTT subtitle URL
  sub_label: "English",     // External subtitle label
  fallback_url: ""          // Fallback URL if stream cannot be played
};

export const COLOR_PRESETS = [
  { name: "Antarctic Cyan", primary: "00e5ff", secondary: "06090e", icon: "f0fdfa" },
  { name: "Glacier Blue",   primary: "38bdf8", secondary: "0c1929", icon: "f8fafc" },
  { name: "Atlantic Gold",  primary: "d8b36c", secondary: "101116", icon: "f4f4f6" },
  { name: "Crimson Red",    primary: "e50914", secondary: "170000", icon: "ffffff" },
  { name: "Emerald Mint",   primary: "10b981", secondary: "064e3b", icon: "ecfdf5" },
  { name: "Amethyst Violet", primary: "8b5cf6", secondary: "2e1065", icon: "faf5ff" },
  { name: "Pure White",     primary: "ffffff", secondary: "1c1d20", icon: "ffffff" }
];

const SETTINGS_STORAGE_KEY = "vidora_player_customization";
const PROGRESS_STORAGE_KEY = "vidoraProgress";

/**
 * Clean hex color string to omit '#'
 */
export function sanitizeHex(color) {
  if (!color) return "";
  return color.replace(/^#/, "").trim();
}

/**
 * Load saved player customization from localStorage
 */
export function getSavedVidoraSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VIDORA_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_VIDORA_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_VIDORA_SETTINGS };
  }
}

/**
 * Save player customization to localStorage
 */
export function saveVidoraSettings(settings) {
  try {
    const merged = { ...DEFAULT_VIDORA_SETTINGS, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error("Failed to save Vidora settings to localStorage", e);
    return settings;
  }
}

/**
 * Construct the full Vidora embed URL with query parameters
 *
 * @param {Object} options
 * @param {string} options.type - "movie" | "tv" | "anime"
 * @param {string|number} options.id - TMDB ID (or MyAnimeList ID for anime)
 * @param {number} [options.season=1] - TV Season number
 * @param {number} [options.episode=1] - TV Episode number
 * @param {string} [options.subOrDub="sub"] - Anime sub/dub
 * @param {number} [options.startAt] - Starting second (cross-device resume)
 * @param {Object} [options.customSettings] - Custom settings overrides
 * @returns {string} Fully formed Vidora URL
 */
export function buildVidoraUrl({
  type = "movie",
  id,
  season = 1,
  episode = 1,
  subOrDub = "sub",
  startAt,
  customSettings = {}
}) {
  const settings = {
    ...getSavedVidoraSettings(),
    ...customSettings
  };

  let basePath = "";
  if (type === "tv") {
    const s = Math.max(1, Number(season) || 1);
    const e = Math.max(1, Number(episode) || 1);
    basePath = `/tv/${encodeURIComponent(id)}/${s}/${e}`;
  } else if (type === "anime") {
    const epNum = Math.max(1, Number(episode) || 1);
    basePath = `/anime/${encodeURIComponent(id)}/${epNum}/${subOrDub || "sub"}`;
  } else {
    basePath = `/movie/${encodeURIComponent(id)}`;
  }

  const params = new URLSearchParams();

  if (settings.primaryColor) params.set("primaryColor", sanitizeHex(settings.primaryColor));
  if (settings.secondaryColor) params.set("secondaryColor", sanitizeHex(settings.secondaryColor));
  if (settings.iconColor) params.set("iconColor", sanitizeHex(settings.iconColor));

  params.set("title", String(settings.title !== false));
  params.set("poster", String(settings.poster !== false));
  params.set("autoplay", String(settings.autoplay !== false));
  params.set("nextbutton", String(settings.nextbutton !== false));

  if (type === "anime") {
    params.set("fallback", "true");
  }

  // Cross-device and continue-watching timestamp resume
  if (typeof startAt === "number" && startAt > 0) {
    params.set("startAt", String(Math.floor(startAt)));
  }

  if (settings.sub_file && settings.sub_file.trim()) {
    params.set("sub_file", settings.sub_file.trim());
    if (settings.sub_label && settings.sub_label.trim()) {
      params.set("sub_label", settings.sub_label.trim());
    }
  }

  if (settings.fallback_url && settings.fallback_url.trim()) {
    params.set("fallback_url", settings.fallback_url.trim());
  }

  const queryString = params.toString();
  return `${VIDORA_ORIGIN}${basePath}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Get Vidora watch progress for a specific title / episode from localStorage
 */
export function getStoredVidoraProgress(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const progressData = JSON.parse(raw);
    const item = progressData[String(tmdbId)];
    if (!item) return null;

    if (mediaType === "tv") {
      const key = `s${season}e${episode}`;
      if (item.show_progress && item.show_progress[key]) {
        return item.show_progress[key].progress;
      }
    }
    return item.progress || null;
  } catch {
    return null;
  }
}
