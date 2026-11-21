import { NavLink, useLocation } from "react-router-dom";
import { Home, Film, Tv, Bookmark, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  // Hide bottom navigation bar inside the video player view for immersive viewing
  if (location.pathname.startsWith("/watch")) {
    return null;
  }

  const isMoviesActive =
    location.pathname === "/movies" ||
    (location.pathname === "/explore" && !location.search.includes("type=tv"));

  const isTvActive =
    location.pathname === "/tvshows" ||
    (location.pathname === "/explore" && location.search.includes("type=tv"));

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
      >
        <Home size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Home</span>
      </NavLink>

      <NavLink
        to="/movies"
        className={`bottom-nav-item ${isMoviesActive ? "active" : ""}`}
      >
        <Film size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Movies</span>
      </NavLink>

      <NavLink
        to="/tvshows"
        className={`bottom-nav-item ${isTvActive ? "active" : ""}`}
      >
        <Tv size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">TV Series</span>
      </NavLink>

      <NavLink
        to={user ? "/watchlist" : "/login"}
        className={({ isActive }) =>
          `bottom-nav-item ${isActive || location.pathname === "/watchlist" ? "active" : ""}`
        }
      >
        <Bookmark size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Watchlist</span>
      </NavLink>

      <NavLink
        to="/search"
        className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
      >
        <Search size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Search</span>
      </NavLink>
    </nav>
  );
}
