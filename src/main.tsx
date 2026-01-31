import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCapacitor } from "./lib/capacitor-init";

// Initialize Capacitor for native edge-to-edge experience
initCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
