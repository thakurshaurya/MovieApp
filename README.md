# Antarctic Streaming Platform

A full-stack streaming platform with a frosty Antarctic aesthetic and cyan outlining. Use only video sources you own or are licensed to distribute.

## Stack
- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, MongoDB/Mongoose, JWT
- Movie metadata: TMDB API

## Requirements
- Node.js 20+
- MongoDB local instance or MongoDB Atlas account
- TMDB API key (https://www.themoviedb.org/settings/api)

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Fill in `MONGO_URI`, `JWT_SECRET`, `TMDB_API_KEY`, and `GROQ_API_KEY` in `server/.env`.

Get your free Groq API key at: https://console.groq.com/keys

### 2. Frontend
In a second terminal:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally http://localhost:5173).

## Current implementation
- Dark streaming-style home page with responsive navigation
- Hero feature, trending/popular/movie/TV rows
- Search page
- Movie/TV detail page
- Register/login/logout
- Authenticated watchlist endpoints and UI
- TMDB metadata proxy in the backend
- Groq AI-powered personalized movie & show recommendations based on watch history (powered by Llama 3.3)

## Important
TMDB provides metadata and images, not streaming rights or video files. The player page is a placeholder until you connect a legitimate source such as your own hosted videos or a licensed provider. Do not embed unauthorized streams.


## Vidora Embed Playback Integration

The platform embeds streaming video playback via the [Vidora API](https://vidora.ac/#customize).

### Embed Endpoints
- **Movies**: `https://vidora.ac/movie/{tmdbId}`
- **TV Episodes**: `https://vidora.ac/tv/{tmdbId}/{season}/{episode}`
- **Anime**: `https://vidora.ac/anime/{MALid}/{episode}/{subOrDub}?fallback=true`

### Customization Parameters
Append parameters to the URL query string:
- `primaryColor`: Hex code without `#` (default: `00e5ff` Antarctic Cyan). Controls sliders, progress, and autoplay buttons.
- `secondaryColor`: Hex code without `#` (default: `06090e`). Progress bar track backing color.
- `iconColor`: Hex code without `#` (default: `f0fdfa`). Controls icon color.
- `title`: `true` | `false`. Controls whether the media title overlay is shown.
- `poster`: `true` | `false`. Determines whether the poster image is shown prior to playback.
- `autoplay`: `true` | `false`. Auto starts playback.
- `nextbutton`: `true` | `false`. Displays a "Next Episode" button once 90% of an episode is watched.
- `startAt`: Number of seconds to resume playback from (powers Continue Watching).
- `sub_file`: Direct URL to external WebVTT subtitle track.
- `sub_label`: Label for the subtitle track (e.g. `English`).
- `fallback_url`: Fallback destination if the stream cannot be loaded.

### PostMessage & Real-Time Sync
The player listens to `window.addEventListener('message', ...)` from `https://vidora.ac`:
1. `MEDIA_DATA`: Automatically updates `localStorage` (`vidoraProgress`) with watch time and episode history.
2. `PLAYER_EVENT`: Tracks `play`, `pause`, `seeked`, `timeupdate`, and `ended` events with `currentTime` and `duration`, syncing progress with the user's viewing history in the database.

---

## Android App (Capacitor Native)

The platform is fully packaged as a native Android app using **Capacitor**:
- Package ID: `com.antarctic.streaming`
- Native project location: `client/android/`
- Hardware accelerated video playback & fullscreen stream compatibility.
- Native Android back button routing and dark Antarctic Cyan status bar theming.
- Network security configuration allowing cleartext HTTP traffic for local/LAN dev servers.

### Building & Running on Android

#### 1. Sync & Build Assets
```bash
cd client
npm run android:build
```

#### 2. Open in Android Studio
```bash
npm run android:open
```
*Alternatively, launch Android Studio and open the folder `client/android`.*

#### 3. Run Directly on Connected Device / Emulator
```bash
npm run android:run
```

#### 4. Build APK via Gradle CLI
```bash
cd client/android
./gradlew assembleDebug
```
The compiled debug APK will be generated at:
`client/android/app/build/outputs/apk/debug/app-debug.apk`
