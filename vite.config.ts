import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  optimizeDeps: {
    exclude: ["@react-pdf/renderer"],
  },
  build: {
    rollupOptions: {
      treeshake: {
        // @react-pdf/renderer has internal circular refs that break under treeshaking
        moduleSideEffects: (id) => id.includes("@react-pdf"),
      },
      output: {
        manualChunks(id) {
          // PDF renderer — isolated chunk, loaded only when user triggers PDF download
          if (id.includes("@react-pdf") || id.includes("pdfjs-dist")) return "pdf";
          // Supabase client
          if (id.includes("@supabase")) return "supabase";
          // Radix UI primitives
          if (id.includes("@radix-ui")) return "radix";
          // TanStack query
          if (id.includes("@tanstack")) return "tanstack";
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "react";
          // Sentry
          if (id.includes("@sentry")) return "sentry";
          // PostHog
          if (id.includes("posthog-js")) return "posthog";
        },
      },
    },
  },
}));
