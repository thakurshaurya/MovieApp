import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import TvApp from "./tv/TvApp";
import MobileApp from "./mobile/MobileApp";
import { AuthProvider } from "./context/AuthContext";

const target = import.meta.env.VITE_APP_TARGET;

if (target === "tv") {
  import("./tv/tv.css");
} else if (target === "mobile") {
  import("./mobile/mobile.css");
} else {
  import("./index.css");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {target === "tv" ? <TvApp /> : target === "mobile" ? <MobileApp /> : <App />}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
