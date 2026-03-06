import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Defer non-critical init to after first render
createRoot(document.getElementById("root")!).render(<App />);

// Post-render: init Capacitor + perf observer
requestIdleCallback(() => {
  import("./lib/capacitor-init").then(({ initCapacitor }) => initCapacitor());
  import("./lib/perf").then(({ initPerfObserver }) => initPerfObserver());
});
