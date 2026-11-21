import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Search, Menu, X, UserRound, Bookmark, Film, Tv, Home as HomeIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const avatar = user?.avatar;
  const displayName = user?.name ? user.name.split(" ")[0] : "Account";

  const isMoviesActive =
    location.pathname === "/movies" ||
    (location.pathname === "/explore" && !location.search.includes("type=tv"));

  const isTvActive =
    location.pathname === "/tvshows" ||
    (location.pathname === "/explore" && location.search.includes("type=tv"));

  const drawerContent = (
    <>
      <div className="mobile-drawer-header">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">A</span> ANTARCTIC<span className="brand-dot">.</span>
        </Link>
        <button
          className="mobile-drawer-close"
          onClick={() => setOpen(false)}
          aria-label="Close navigation menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="drawer-links-list">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={() => setOpen(false)}
        >
          <HomeIcon size={18} className="nav-icon" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/movies"
          className={isMoviesActive ? "active" : ""}
          onClick={() => setOpen(false)}
        >
          <Film size={18} className="nav-icon" />
          <span>Movies</span>
        </NavLink>

        <NavLink
          to="/tvshows"
          className={isTvActive ? "active" : ""}
          onClick={() => setOpen(false)}
        >
          <Tv size={18} className="nav-icon" />
          <span>TV Series</span>
        </NavLink>

        <NavLink
          to={user ? "/watchlist" : "/login"}
          className={location.pathname === "/watchlist" ? "active" : ""}
          onClick={() => setOpen(false)}
        >
          <Bookmark size={18} className="nav-icon" />
          <span>My Watchlist</span>
        </NavLink>

        <NavLink
          to="/search"
          className={location.pathname === "/search" ? "active" : ""}
          onClick={() => setOpen(false)}
        >
          <Search size={18} className="nav-icon" />
          <span>Search Library</span>
        </NavLink>
      </div>

      <div className="mobile-drawer-footer">
        {user ? (
          <NavLink to="/profile" className="drawer-profile-card" onClick={() => setOpen(false)}>
            {avatar ? (
              <img src={avatar} alt={displayName} className="drawer-avatar-img" />
            ) : (
              <div className="drawer-avatar-fallback">{displayName.slice(0, 1)}</div>
            )}
            <div className="drawer-user-info">
              <span className="drawer-user-name">{user.name || "Member Profile"}</span>
              <span className="drawer-user-sub">History & Settings →</span>
            </div>
          </NavLink>
        ) : (
          <Link to="/login" className="drawer-login-btn" onClick={() => setOpen(false)}>
            <UserRound size={16} />
            <span>Sign In to Antarctic</span>
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="mobile-menu icon-button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="brand" aria-label="Antarctic Home">
            <span className="brand-mark">A</span> ANTARCTIC<span className="brand-dot">.</span>
          </Link>

          {/* Desktop Navigation Links (hidden on mobile <=768px) */}
          <nav className="desktop-nav-links">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
              <HomeIcon size={16} className="nav-icon" />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/movies"
              className={isMoviesActive ? "active" : ""}
            >
              <Film size={16} className="nav-icon" />
              <span>Movies</span>
            </NavLink>
            <NavLink
              to="/tvshows"
              className={isTvActive ? "active" : ""}
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
          </nav>

          <div className="header-actions">
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

      {/* Render Mobile Drawer into document.body to bypass header container clipping */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="mobile-drawer-portal">
            <div
              className="mobile-drawer-overlay"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <aside className="mobile-drawer-panel" aria-label="Navigation drawer">
              {drawerContent}
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
