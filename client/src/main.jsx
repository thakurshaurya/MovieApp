import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import TvApp from "./tv/TvApp";
import { AuthProvider } from "./context/AuthContext";

const isTvBuild = import.meta.env.VITE_APP_TARGET === "tv";

if (isTvBuild) {
  import("./tv/tv.css");
} else {
  import("./index.css");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {isTvBuild ? <TvApp /> : <App />}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
