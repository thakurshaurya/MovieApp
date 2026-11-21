import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Film } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Auth({ mode = "login" }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!form.name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password
        });
      }
      navigate(location.state?.from || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-badge">
          <Film size={14} className="text-gold" />
          <span>ANTARCTIC PASS</span>
        </div>
        <h1>{mode === "login" ? "Sign In" : "Create Account"}</h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Sign in to access your watchlist, history, and tailored stream."
            : "Join the curated collection for uninterrupted discovery."}
        </p>

        {mode === "register" && (
          <div className="input-field">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g. Eleanor Vance"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        )}

        <div className="input-field">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="input-field">
          <label>Password</label>
          <div className="password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              minLength={8}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {mode === "register" && (
          <div className="input-field">
            <label>Confirm Password</label>
            <div className="password-wrap">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat password"
                minLength={8}
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        {error && <div className="form-error" role="alert">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="primary-button full-button"
        >
          {submitting
            ? "Authenticating..."
            : mode === "login"
            ? "Sign In"
            : "Create Account"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? "New to Antarctic?" : "Already registered?"}{" "}
          <Link to={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Create an account" : "Sign in here"}
          </Link>
        </p>
      </form>
    </main>
  );
}
