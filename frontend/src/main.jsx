import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";
import "./css/pages/app.css";
document.documentElement.setAttribute("data-color-theme", "CUSTOM_THEME");
document.documentElement.setAttribute("data-layout", "vertical");
document.documentElement.setAttribute("data-boxed-layout", "boxed");
document.documentElement.setAttribute("data-sidebar-type", "true");
document.documentElement.setAttribute("data-card-shadow", "false");
document.documentElement.classList.add("style-lyra");
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
