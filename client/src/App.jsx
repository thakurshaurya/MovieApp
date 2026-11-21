import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import Header from "./components/Header";
import MobileBottomNav from "./components/MobileBottomNav";
import { useAuth } from "./context/AuthContext";

// Lazy-load pages for optimal bundle splitting and performance
const Home = lazy(() => import("./pages/Home"));
const Explore = lazy(() => import("./pages/Explore"));
const Search = lazy(() => import("./pages/Search"));
const Title = lazy(() => import("./pages/Title"));
const Auth = lazy(() => import("./pages/Auth"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Profile = lazy(() => import("./pages/Profile"));
const Player = lazy(() => import("./pages/Player"));

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-shell"><div className="loading">Authenticating...</div></div>;
  }

  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

function PageLoader() {
  return (
    <div className="page-shell">
      <div className="loading">Loading Antarctic...</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <span className="brand">
          <span className="brand-mark">A</span> ANTARCTIC<span className="brand-dot">.</span>
        </span>
        <p className="footer-tagline">Cinematic storytelling and seamless streaming anywhere.</p>
      </div>
      <div className="footer-info">
        <span>Metadata provided by TMDB. Stream delivery powered by Vidora Embed API.</span>
        <span>© {new Date().getFullYear()} Antarctic Streaming. All rights reserved.</span>
      </div>
    </footer>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Native Android Status Bar & Back Button Integration
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Set status bar theme to dark with Antarctic background
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: "#070b12" }).catch(() => {});

      // Android hardware back button handler
      const backListenerPromise = CapApp.addListener("backButton", ({ canGoBack }) => {
        if (location.pathname === "/" || !canGoBack) {
          CapApp.exitApp();
        } else {
          navigate(-1);
        }
      });

      return () => {
        backListenerPromise.then((listener) => listener.remove()).catch(() => {});
      };
    }
  }, [location.pathname, navigate]);

  return (
    <>
      <Header />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Explore defaultType="movie" />} />
          <Route path="/tvshows" element={<Explore defaultType="tv" />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/search" element={<Search />} />
          <Route path="/title/:type/:id" element={<Title />} />
          <Route path="/watch/:type/:id" element={<Player />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route
            path="/watchlist"
            element={
              <Protected>
                <Watchlist />
              </Protected>
            }
          />
          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route
            path="*"
            element={
              <main className="page-shell">
                <div className="empty-state">
                  <h1>404 — Page Not Found</h1>
                  <p>The page or title you requested does not exist.</p>
                </div>
              </main>
            }
          />
        </Routes>
      </Suspense>
      <MobileBottomNav />
      <Footer />
    </>
  );
}
