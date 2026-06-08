import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

try {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  rootEl.innerHTML = `<div style="color:white;padding:2rem;font-family:sans-serif;"><h1>App crashed</h1><pre>${String(e)}</pre></div>`;
  console.error(e);
}
