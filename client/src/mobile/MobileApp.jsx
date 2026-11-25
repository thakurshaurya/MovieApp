import { useEffect } from "react";
import { Routes, Route, Navigate, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Home, Flame, Bookmark, UserRound, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MobileHome from "./MobileHome";
import MobileExplore from "./MobileExplore";
import MobileSearch from "./MobileSearch";
import MobileTitle from "./MobileTitle";
import MobilePlayer from "./MobilePlayer";
import MobileWatchlist from "./MobileWatchlist";
import MobileAuth from "./MobileAuth";
import MobileProfile from "./MobileProfile";

export default function MobileApp() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isWatching = location.pathname.startsWith("/watch/");
  const isDetail = location.pathname.startsWith("/title/");

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
    <div className={isWatching ? "" : "m-shell"}>
      {!isWatching && !isDetail && (
        <header className="m-topbar">
          <Link to="/" className="m-brand">
            <span className="m-brand-mark">A</span>
            <span>ANTARCTIC</span>
          </Link>
          <div className="m-topbar-actions">
            <Link to="/search" className="m-icon-btn" aria-label="Search">
              <Search size={18} />
            </Link>
            <Link to={user ? "/profile" : "/login"} className="m-icon-btn" aria-label="Account">
              <UserRound size={18} />
            </Link>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<MobileHome />} />
        <Route path="/movies" element={<MobileExplore mediaType="movie" />} />
        <Route path="/tvshows" element={<MobileExplore mediaType="tv" />} />
        <Route path="/search" element={<MobileSearch />} />
        <Route path="/watchlist" element={<MobileWatchlist />} />
        <Route path="/title/:type/:id" element={<MobileTitle />} />
        <Route path="/watch/:type/:id" element={<MobilePlayer />} />
        <Route path="/login" element={<MobileAuth mode="login" />} />
        <Route path="/register" element={<MobileAuth mode="register" />} />
        <Route path="/profile" element={<MobileProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isWatching && (
        <nav className="m-bottom-nav" aria-label="Bottom Navigation">
          <NavLink to="/" end className={({ isActive }) => `m-bottom-item ${isActive ? "active" : ""}`}>
            <Home size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/movies" className={({ isActive }) => `m-bottom-item ${isActive ? "active" : ""}`}>
            <Flame size={20} />
            <span>Movies</span>
          </NavLink>
          <NavLink to="/watchlist" className={({ isActive }) => `m-bottom-item ${isActive ? "active" : ""}`}>
            <Bookmark size={20} />
            <span>My List</span>
          </NavLink>
          <NavLink to={user ? "/profile" : "/login"} className={({ isActive }) => `m-bottom-item ${isActive ? "active" : ""}`}>
            <UserRound size={20} />
            <span>{user ? "Profile" : "Sign In"}</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
