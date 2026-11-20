import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// CSS imports — order matters!
import "./styles/theme.css";      // Master theme (variables, base)
import "./styles/auth.css";       // Auth pages
import "./styles/dashboard.css";  // Dashboard
import "./styles/pages.css";  
import "./styles/admin.css";    // All user pages
import "./styles/landing.css";
import "./styles/workouts.css"   // Landing page
import { getInitialTheme, applyTheme } from "./utils/theme";

// Apply theme BEFORE render (no flash)
applyTheme(getInitialTheme());

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);