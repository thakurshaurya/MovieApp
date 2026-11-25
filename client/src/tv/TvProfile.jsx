import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TvProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="tv-page-container">
      <div className="tv-auth-card" style={{ margin: "40px 0", maxWidth: 520 }}>
        <h1>{user.name || "Antarctic Member"}</h1>
        <p style={{ color: "#94a3b8", marginBottom: 28 }}>{user.email}</p>

        <button
          type="button"
          className="tv-btn-primary tv-focusable"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
