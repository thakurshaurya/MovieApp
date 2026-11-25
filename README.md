# Antarctic

**Antarctic** is a full-stack streaming platform for movies and TV series, built with **React + Vite**, **Express + MongoDB**, and **Capacitor**—delivering three tailored experiences from one codebase:

- **Web App** — Responsive cinematic web experience deployed on Vercel.
- **Android Phone App (`antarctic.apk`)** — Netflix-style mobile interface with edge-to-edge notch support, auto-landscape fullscreen playback, and bottom tab navigation.
- **Android TV App (`antarctic-tv.apk`)** — 10-foot Leanback TV interface with D-Pad spatial navigation, on-screen remote keyboard, Pointer Mode for iframe controls, and optimizations for 1 GB RAM TVs.

---

## Features

- **Unified Catalogue & Discovery:** Trending, Popular Movies, Top Rated, TV Series, and a dedicated **Bollywood & Hindi** section (`/bollywood`) powered by TMDB.
- **AI Recommendations:** Personalized recommendations ("Recommended For You") based on watch history.
- **Multi-Server Playback:** Embedded streaming via Vidora (with customizable player colors, autoplay, and resume timestamps) plus quick server switching (`Vidora`, `VidSrc.cc`, `VidSrc.to`) and iframe `sandbox` pop-up protection.
- **Cast & Filmography:** Interactive cast cards with photos and full performer filmography modals.
- **Cross-Device Sync:** JWT authentication syncing **My List (Watchlist)** and **Continue Watching** history across Web, Phone, and TV.
- **Native App Downloads:** Dedicated `/download` page on the website hosting both APKs.

---

## Project Structure

```text
Antartic/
├── client/
│   ├── src/
│   │   ├── pages/          # Desktop & responsive web pages (Home, Explore, Title, Player, Bollywood, Download)
│   │   ├── mobile/         # Netflix-style Android Phone UI (VITE_APP_TARGET=mobile)
│   │   ├── tv/             # 10-foot Android TV UI (VITE_APP_TARGET=tv)
│   │   ├── components/     # Shared components (Header, MovieCard, CastModal, PlayerCustomizerModal)
│   │   └── utils/          # Vidora embed builder & TV D-Pad spatial navigation
│   ├── android/            # Capacitor Android Phone project (com.antarctic.streaming)
│   └── android-tv/         # Capacitor Android TV project (com.antarctic.tv)
├── server/
│   └── src/
│       ├── controllers/    # Auth, Movies/TMDB, Watchlist, History, AI Recommendations
│       ├── models/         # Mongoose User & ViewingHistory schemas
│       └── routes/         # Express API routes (/api/*)
└── vercel.json             # Vercel multi-service configuration (client + server)
```

---

## Local Development

### 1. Server
```bash
cd server
npm install
npm run dev
```
Configure `server/.env` with `MONGO_URI`, `JWT_SECRET`, `TMDB_API_KEY`, and optionally `GROQ_API_KEY`.

### 2. Web Client
```bash
cd client
npm install
npm run dev
```

---

## Building the Android APKs

> Ensure `client/public/downloads/` is not included during APK builds if you want minimal APK size.

- **Android Phone APK (`antarctic.apk`):**
  ```bash
  cd client
  VITE_APP_TARGET=mobile npm run build
  npx cap sync android
  cd android && ./gradlew assembleDebug
  ```
- **Android TV APK (`antarctic-tv.apk`):**
  ```bash
  cd client
  VITE_APP_TARGET=tv npm run build
  cp -R dist/* android-tv/app/src/main/assets/public/
  cd android-tv && ./gradlew assembleDebug
  ```

---

## Deployment

Configured for **Vercel Services** in [vercel.json](vercel.json), routing `/api/*` to the Express `server` service and all other routes to the Vite `client` service.
