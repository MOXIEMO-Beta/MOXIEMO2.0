import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { getCtaVariant } from "./lib/ctaVariant";

getCtaVariant();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<HelmetProvider><App /></HelmetProvider>);
}
