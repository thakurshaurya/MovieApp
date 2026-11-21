import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, KeyRound, Shield, Clock, LogOut, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Edit State
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordMessage, setPasswordMessage] = useState({ text: "", type: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [clearingHistory, setClearingHistory] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.avatar) setAvatar(user.avatar);
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await api.get("/history?limit=25");
      setHistory(res.data);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileMessage({ text: "", type: "" });
    setSavingProfile(true);

    try {
      const res = await api.patch("/auth/profile", { name, avatar });
      updateUser(res.data.user);
      setProfileMessage({ text: "Profile details updated successfully.", type: "success" });
    } catch (err) {
      setProfileMessage({
        text: err.response?.data?.message || "Could not update profile.",
        type: "error"
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordMessage({ text: "", type: "" });

    if (passwords.newPassword.length < 8) {
      setPasswordMessage({ text: "New password must be at least 8 characters long.", type: "error" });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswordMessage({ text: "Password changed successfully.", type: "success" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMessage({
        text: err.response?.data?.message || "Could not change password.",
        type: "error"
      });
    } finally {
      setChangingPassword(false);
    }
  }

  async function deleteHistoryItem(id) {
    try {
      await api.delete(`/history/${id}`);
      setHistory(prev => prev.filter(item => item._id !== id));
    } catch {
      // silently handle
    }
  }

  async function clearAllHistory() {
    if (!window.confirm("Are you sure you want to clear your entire viewing history?")) return;
    setClearingHistory(true);
    try {
      await api.delete("/history/clear");
      setHistory([]);
    } catch {
      // silently handle
    } finally {
      setClearingHistory(false);
    }
  }

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    : "Member";

  return (
    <main className="page-shell profile-container">
      <div className="page-heading">
        <p className="eyebrow">ACCOUNT SETTINGS</p>
        <h1>Member Profile</h1>
        <p>Manage your identity, security preferences, and viewing history.</p>
      </div>

      <div className="profile-grid">
        {/* Left Column: Profile Card & Quick Info */}
        <section className="profile-card">
          <div className="avatar-header">
            <div className="avatar-preview">
              {avatar ? (
                <img src={avatar} alt={user?.name || "User avatar"} onError={() => setAvatar("")} />
              ) : (
                <div className="avatar-fallback">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "AT"}
                </div>
              )}
            </div>
            <div className="user-info">
              <h2>{user?.name}</h2>
              <span className="user-email">{user?.email}</span>
              <span className="join-badge">
                <Clock size={12} /> Joined {joinDate}
              </span>
            </div>
          </div>

          <div className="card-divider" />

          {/* Edit Profile Form */}
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <h3>Personal Information</h3>
            <div className="input-field">
              <label>Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-field">
              <label>Avatar Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
              <span className="field-hint">Paste an image URL for your profile picture.</span>
            </div>

            {profileMessage.text && (
              <div className={`message-banner ${profileMessage.type}`}>
                {profileMessage.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <button type="submit" disabled={savingProfile} className="primary-button">
              {savingProfile ? "Saving changes..." : "Save Profile Details"}
            </button>
          </form>

          <div className="card-divider" />

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <h3>
              <KeyRound size={16} /> Change Password
            </h3>
            <div className="input-field">
              <label>Current Password</label>
              <input
                type="password"
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              />
            </div>
            <div className="input-field">
              <label>New Password</label>
              <input
                type="password"
                minLength={8}
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              />
            </div>
            <div className="input-field">
              <label>Confirm New Password</label>
              <input
                type="password"
                minLength={8}
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </div>

            {passwordMessage.text && (
              <div className={`message-banner ${passwordMessage.type}`}>
                {passwordMessage.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <button type="submit" disabled={changingPassword} className="secondary-button">
              {changingPassword ? "Updating password..." : "Update Password"}
            </button>
          </form>

          <div className="card-divider" />

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="logout-button"
          >
            <LogOut size={16} /> Sign out from Antarctic
          </button>
        </section>

        {/* Right Column: Viewing History */}
        <section className="history-section">
          <div className="history-header">
            <div>
              <h2>Viewing History</h2>
              <p>Records from your playback sessions across devices.</p>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearAllHistory}
                disabled={clearingHistory}
                className="clear-history-btn"
                title="Clear all viewing history"
              >
                <Trash2 size={14} /> Clear all
              </button>
            )}
          </div>

          {loadingHistory ? (
            <div className="loading">Loading your viewing history...</div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              No viewing history recorded yet. As you stream films and episodes, they will show up here.
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => {
                const isTv = item.mediaType === "tv";
                const imageSrc = isTv
                  ? (item.stillPath
                      ? `https://image.tmdb.org/t/p/w300${item.stillPath}`
                      : item.backdropPath
                      ? `https://image.tmdb.org/t/p/w300${item.backdropPath}`
                      : item.posterPath
                      ? `https://image.tmdb.org/t/p/w300${item.posterPath}`
                      : null)
                  : (item.posterPath || item.backdropPath
                      ? `https://image.tmdb.org/t/p/w300${item.posterPath || item.backdropPath}`
                      : null);

                return (
                  <div key={item._id} className="history-card">
                    <div className="history-thumb">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="thumb-fallback">{isTv ? "EPISODE" : "ANTARCTIC"}</div>
                      )}
                    </div>
                    <div className="history-details">
                      <span className="history-tag">
                        {item.mediaType === "tv" ? `TV SERIES · S${item.season} E${item.episode}` : "FEATURE FILM"}
                      </span>
                      <h4>{item.title}</h4>
                      {item.mediaType === "tv" && item.episodeTitle && (
                        <p className="episode-title">{item.episodeTitle}</p>
                      )}
                      <div className="history-meta-row">
                        <span className="history-time">
                          Watched {new Date(item.lastWatchedAt).toLocaleDateString()} at{" "}
                          {new Date(item.lastWatchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {item.progress > 0 && (
                          <span className="history-progress-badge">{item.progress}% completed</span>
                        )}
                      </div>
                    </div>
                    <div className="history-actions">
                      <button
                        onClick={() => {
                          const startParam = item.currentTime > 5 ? `startAt=${Math.floor(item.currentTime)}` : "";
                          navigate(
                            item.mediaType === "tv"
                              ? `/watch/tv/${item.tmdbId}?season=${item.season}&episode=${item.episode}${
                                  startParam ? `&${startParam}` : ""
                                }`
                              : `/watch/movie/${item.tmdbId}${startParam ? `?${startParam}` : ""}`
                          );
                        }}
                        className="primary-button small-btn"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item._id)}
                        className="remove-btn"
                        title="Remove from history"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
