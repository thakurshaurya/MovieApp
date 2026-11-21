import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Search, Menu, X, UserRound, Bookmark, Clock, Film, Tv, Home as HomeIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const avatar = user?.avatar;
  const displayName = user?.name ? user.name.split(" ")[0] : "Account";

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="mobile-menu icon-button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="brand" aria-label="Antarctic Home">
          <span className="brand-mark">A</span> ANTARCTIC<span className="brand-dot">.</span>
        </Link>

        <nav className={`nav-links ${open ? "nav-open" : ""}`}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            <HomeIcon size={16} className="nav-icon" />
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/movies"
            className={({ isActive }) =>
              isActive || (location.pathname === "/explore" && !location.search.includes("type=tv"))
                ? "active"
                : ""
            }
          >
            <Film size={16} className="nav-icon" />
            <span>Movies</span>
          </NavLink>
          <NavLink
            to="/tvshows"
            className={({ isActive }) =>
              isActive || (location.pathname === "/explore" && location.search.includes("type=tv"))
                ? "active"
                : ""
            }
          >
            <Tv size={16} className="nav-icon" />
            <span>TV Series</span>
          </NavLink>
          {user && (
            <NavLink to="/watchlist" className={({ isActive }) => (isActive ? "active" : "")}>
              <Bookmark size={16} className="nav-icon" />
              <span>My Watchlist</span>
            </NavLink>
          )}

          {/* Mobile view only additional profile & search links inside drawer */}
          <div className="mobile-drawer-footer">
            <NavLink to="/search" className="drawer-link">
              <Search size={16} />
              <span>Search Catalog</span>
            </NavLink>
            {user && (
              <NavLink to="/profile" className="drawer-link">
                <UserRound size={16} />
                <span>My Profile & History</span>
              </NavLink>
            )}
          </div>
        </nav>

        <div className="header-actions">
          {/* Quick link button to the dedicated real-time Search Page */}
          <Link
            to="/search"
            className={`header-search-btn ${location.pathname === "/search" ? "active" : ""}`}
            title="Open Live Search"
            aria-label="Search titles"
          >
            <Search size={16} />
            <span className="search-btn-label">Search library...</span>
            <kbd className="search-shortcut">⌘K</kbd>
          </Link>

          {user ? (
            <div className="user-controls">
              <Link to="/profile" className="profile-link" title="Open member profile">
                {avatar ? (
                  <img src={avatar} alt={displayName} className="header-avatar-img" />
                ) : (
                  <div className="header-avatar-fallback">{displayName.slice(0, 1)}</div>
                )}
                <span>{displayName}</span>
              </Link>
            </div>
          ) : (
            <Link className="login-button" to="/login">
              <UserRound size={15} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
