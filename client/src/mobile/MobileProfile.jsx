import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MobileProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="m-page">
      <div className="m-auth-box">
        <h1 style={{ margin: "0 0 4px", fontSize: 22 }}>{user.name || "Antarctic Member"}</h1>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>{user.email}</p>
        <button
          type="button"
          className="m-btn-play"
          style={{ width: "100%" }}
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
