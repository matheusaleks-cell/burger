import { createRoot } from "react-dom/client";
console.log("🚀 Main.tsx executing...");
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
