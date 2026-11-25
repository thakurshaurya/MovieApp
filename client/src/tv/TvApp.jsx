import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import TvSidebar from "./TvSidebar";
import TvHome from "./TvHome";
import TvExplore from "./TvExplore";
import TvSearch from "./TvSearch";
import TvWatchlist from "./TvWatchlist";
import TvTitle from "./TvTitle";
import TvPlayer from "./TvPlayer";
import TvAuth from "./TvAuth";
import TvProfile from "./TvProfile";
import TvBollywood from "./TvBollywood";
import WelcomeSplash from "../components/WelcomeSplash";
import { initTvNavigation } from "../utils/tvNav";

export default function TvApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const isWatching = location.pathname.startsWith("/watch/");

  useEffect(() => {
    const cleanup = initTvNavigation();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = CapApp.addListener("backButton", ({ canGoBack }) => {
      if (location.pathname === "/" || !canGoBack) {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    });
    return () => {
      listenerPromise.then((l) => l.remove()).catch(() => {});
    };
  }, [location.pathname, navigate]);

  return (
    <div className="tv-shell">
      <WelcomeSplash />
      {!isWatching && <TvSidebar />}
      <main className={isWatching ? "" : "tv-main"}>
        <Routes>
          <Route path="/" element={<TvHome />} />
          <Route path="/movies" element={<TvExplore mediaType="movie" />} />
          <Route path="/tvshows" element={<TvExplore mediaType="tv" />} />
          <Route path="/bollywood" element={<TvBollywood />} />
          <Route path="/search" element={<TvSearch />} />
          <Route path="/watchlist" element={<TvWatchlist />} />
          <Route path="/title/:type/:id" element={<TvTitle />} />
          <Route path="/watch/:type/:id" element={<TvPlayer />} />
          <Route path="/login" element={<TvAuth mode="login" />} />
          <Route path="/register" element={<TvAuth mode="register" />} />
          <Route path="/profile" element={<TvProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
