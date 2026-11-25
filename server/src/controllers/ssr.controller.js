import fs from "fs/promises";
import path from "path";
import { fetchHomeData } from "./movie.controller.js";

let cachedHtmlTemplate = null;

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getHtmlTemplate() {
  if (cachedHtmlTemplate) return cachedHtmlTemplate;

  // 1. In Vercel Services mode, fetch index.html from the bound client service
  if (process.env.CLIENT_URL) {
    const res = await fetch(new URL("/index.html", process.env.CLIENT_URL));
    if (res.ok) {
      cachedHtmlTemplate = await res.text();
      return cachedHtmlTemplate;
    }
  }

  // 2. Local fallback: read built client/dist/index.html if available
  const localDistPath = path.resolve(process.cwd(), "../client/dist/index.html");
  try {
    const html = await fs.readFile(localDistPath, "utf-8");
    cachedHtmlTemplate = html;
    return html;
  } catch {
    return null;
  }
}

function renderHeroSsrHtml(homeData) {
  const hero = (homeData?.trending || []).find((x) => x.backdrop_path) || homeData?.trending?.[0];
  if (!hero) return "";

  const title = escapeHtml(hero.title || hero.name || "Antarctic");
  const overview = escapeHtml(
    hero.overview && hero.overview.length > 180
      ? `${hero.overview.slice(0, 180)}...`
      : hero.overview || ""
  );
  const mediaType = hero.media_type === "tv" ? "tv" : "movie";
  const backdropUrl = hero.backdrop_path
    ? `https://image.tmdb.org/t/p/original${hero.backdrop_path}`
    : "";

  return `
    <div class="app-shell">
      <main class="home-page">
        <section class="hero" style="${
          backdropUrl
            ? `background-image: linear-gradient(90deg, #08090c 0%, rgba(8,9,12,0.85) 45%, rgba(8,9,12,0.2) 100%), linear-gradient(0deg, #08090c 0%, transparent 50%), url('${backdropUrl}')`
            : ""
        }">
          <div class="hero-content">
            <div class="eyebrow"><span>FEATURED SPOTLIGHT</span></div>
            <h1>${title}</h1>
            <p>${overview}</p>
            <div class="hero-actions">
              <a class="primary-button" href="/watch/${mediaType}/${hero.id}">Play Now</a>
              <a class="secondary-button" href="/title/${mediaType}/${hero.id}">Details</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  `.trim();
}

export async function renderHomePage(req, res) {
  try {
    const [template, homeData] = await Promise.all([
      getHtmlTemplate(),
      fetchHomeData()
    ]);

    if (!template) {
      return res.status(503).send("Client template unavailable.");
    }

    const safeJson = JSON.stringify(homeData)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

    const ssrMarkup = renderHeroSsrHtml(homeData);
    const stateScript = `<script>window.__INITIAL_HOME_DATA__=${safeJson};</script>`;

    let html = template.replace("</head>", `${stateScript}</head>`);
    if (ssrMarkup) {
      html = html.replace('<div id="root"></div>', `<div id="root">${ssrMarkup}</div>`);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).send(html);
  } catch (error) {
    console.error("SSR Home render error:", error);
    // Fallback to client SPA template if SSR fails
    try {
      const template = await getHtmlTemplate();
      if (template) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(template);
      }
    } catch {
      // ignore
    }
    return res.status(500).send("Unable to render home page.");
  }
}
