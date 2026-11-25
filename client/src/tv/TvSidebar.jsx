import { NavLink } from "react-router-dom";
import { Home, Search, Film, Tv, Bookmark, UserRound, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TvSidebar() {
  const { user } = useAuth();

  return (
    <aside className="tv-sidebar" aria-label="TV Navigation">
      <div className="tv-brand">
        <span className="tv-brand-mark">A</span>
        <span className="tv-brand-text">ANTARCTIC</span>
      </div>

      <nav className="tv-nav-list">
        <NavLink to="/search" className={({ isActive }) => `tv-nav-item ${isActive ? "active" : ""}`}>
          <Search size={22} />
          <span className="tv-nav-label">Search</span>
        </NavLink>

        <NavLink to="/" end className={({ isActive }) => `tv-nav-item ${isActive ? "active" : ""}`}>
          <Home size={22} />
          <span className="tv-nav-label">Home</span>
        </NavLink>

        <NavLink to="/movies" className={({ isActive }) => `tv-nav-item ${isActive ? "active" : ""}`}>
          <Film size={22} />
          <span className="tv-nav-label">Movies</span>
        </NavLink>

        <NavLink to="/tvshows" className={({ isActive }) => `tv-nav-item ${isActive ? "active" : ""}`}>
          <Tv size={22} />
          <span className="tv-nav-label">TV Shows</span>
        </NavLink>

        <NavLink to="/bollywood" className={({ isActive }) => `tv-nav-item ${isActive ? "active" : ""}`}>
          <Sparkles size={22} />
          <span className="tv-nav-label">Bollywood</span>
        </NavLink>

        <NavLink to="/watchlist" className={({ isActive }) => `tv-nav-item ${isActive ? "active" : ""}`}>
          <Bookmark size={22} />
          <span className="tv-nav-label">My List</span>
        </NavLink>

        <NavLink
          to={user ? "/profile" : "/login"}
          className={({ isActive }) => `tv-nav-item ${isActive ? "active" : ""}`}
        >
          <UserRound size={22} />
          <span className="tv-nav-label">{user ? user.name?.split(" ")[0] || "Account" : "Sign In"}</span>
        </NavLink>
      </nav>
    </aside>
  );
}
