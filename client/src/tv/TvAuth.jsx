import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TvAuth({ mode = "login" }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(mode === "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsRegister(mode === "register");
    setError("");
  }, [mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register({ name: name.trim(), email: email.trim(), password });
      } else {
        await login({ email: email.trim(), password });
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tv-page-container">
      <div className="tv-auth-card">
        <h1>{isRegister ? "Create Account" : "Sign In to Antarctic TV"}</h1>
        <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 14 }}>
          Sync your Watchlist and Continue Watching across devices.
        </p>

        {error && (
          <div style={{ color: "#f87171", marginBottom: 14, fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              className="tv-auth-field tv-focusable"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            className="tv-auth-field tv-focusable"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="tv-auth-field tv-focusable"
            placeholder="Password (min 8 chars for Sign Up)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="tv-btn-primary tv-focusable"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          >
            {loading ? "Please wait..." : isRegister ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          className="tv-btn-secondary tv-focusable"
          style={{ width: "100%", justifyContent: "center", marginTop: 14, fontSize: 14 }}
          onClick={() => {
            setError("");
            setIsRegister((v) => !v);
          }}
        >
          {isRegister ? "Already have an account? Sign In" : "New to Antarctic? Create Account"}
        </button>
      </div>
    </div>
  );
}
