import { useEffect, useState } from "react";

export default function WelcomeSplash() {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 950);
    const hideTimer = setTimeout(() => setHidden(true), 1350);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#05070b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.4s ease",
        pointerEvents: fading ? "none" : "auto"
      }}
      aria-label="Welcome to Antarctic"
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "linear-gradient(135deg, #00e5ff, #0284c7)",
          color: "#041018",
          fontWeight: 800,
          fontSize: 32,
          display: "grid",
          placeItems: "center",
          boxShadow: "0 0 32px rgba(0, 229, 255, 0.45)"
        }}
      >
        A
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: "#f8fafc" }}>
          WELCOME TO ANTARCTIC
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
          Preparing your stream...
        </div>
      </div>
    </div>
  );
}
