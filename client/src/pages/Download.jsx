import { Download as DownloadIcon, Smartphone, Tv, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function Download() {
  return (
    <main className="page-shell" style={{ maxWidth: 1100, margin: "0 auto", paddingTop: 100, paddingBottom: 80 }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 12 }}>
          <DownloadIcon size={14} />
          <span>ANTARCTIC NATIVE APPS</span>
        </div>
        <h1 style={{ fontSize: "clamp(30px, 4.5vw, 48px)", fontWeight: 800, margin: "0 0 14px" }}>
          Download Antarctic
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 620, margin: "0 auto", fontSize: 16, lineHeight: 1.6 }}>
          Get the dedicated streaming experience on your Android phone or Android TV. Sign in with your
          account to sync your Watchlist and Continue Watching across all devices.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: 24,
          marginBottom: 48
        }}
      >
        {/* Android Phone Card */}
        <section
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 16,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 20
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: "rgba(0, 229, 255, 0.12)",
                  color: "var(--gold-primary)",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Smartphone size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Android Phone</h2>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>antarctic.apk · Android 7.0+</span>
              </div>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, color: "var(--text-secondary)", fontSize: 14 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} className="text-gold" /> Netflix-style mobile interface & bottom tabs
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} className="text-gold" /> Full-screen edge-to-edge notch support
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} className="text-gold" /> Multi-server switcher & ad-popup protection
              </li>
            </ul>
          </div>

          <a
            href="/downloads/antarctic.apk"
            download="antarctic.apk"
            className="primary-button"
            style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
          >
            <DownloadIcon size={18} /> Download Phone APK
          </a>
        </section>

        {/* Android TV Card */}
        <section
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 16,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 20
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: "rgba(0, 229, 255, 0.12)",
                  color: "var(--gold-primary)",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Tv size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Android TV</h2>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>antarctic-tv.apk · Leanback TV</span>
              </div>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, color: "var(--text-secondary)", fontSize: 14 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} className="text-gold" /> 10-foot Netflix TV layout & D-Pad navigation
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} className="text-gold" /> Built-in Pointer Mode for player settings
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} className="text-gold" /> Lightweight & tuned for 1 GB RAM TVs
              </li>
            </ul>
          </div>

          <a
            href="/downloads/antarctic-tv.apk"
            download="antarctic-tv.apk"
            className="primary-button"
            style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
          >
            <DownloadIcon size={18} /> Download TV APK
          </a>
        </section>
      </div>

      {/* Quick Install Guide */}
      <section
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 14,
          padding: 24
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <ShieldCheck size={18} className="text-gold" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>How to Install</h3>
        </div>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
          1. Download the APK for your device above. 2. Open the downloaded file and allow{" "}
          <strong>Install unknown apps</strong> when prompted by Android. 3. Launch{" "}
          <strong>Antarctic</strong> (or <strong>Antarctic TV</strong>) and sign in to sync your library.
        </p>
      </section>
    </main>
  );
}
