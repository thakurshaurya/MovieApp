import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MobileAuth({ mode = "login" }) {
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
    if (isRegister && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
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
      setError(err.response?.data?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="m-page">
      <div className="m-auth-box">
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>
          {isRegister ? "Create Account" : "Sign In"}
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 18 }}>
          Sync your Watchlist and Continue Watching.
        </p>
        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input type="text" className="m-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input type="email" className="m-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" className="m-input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="m-btn-play" style={{ width: "100%" }}>
            {loading ? "Please wait..." : isRegister ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <button
          type="button"
          className="m-btn-list"
          style={{ width: "100%", marginTop: 10, fontSize: 13 }}
          onClick={() => setIsRegister((v) => !v)}
        >
          {isRegister ? "Already have an account? Sign In" : "New to Antarctic? Create Account"}
        </button>
      </div>
    </div>
  );
}
