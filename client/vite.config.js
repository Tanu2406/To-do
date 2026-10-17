import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const { VITE_API_BASE_URL: apiBaseUrl } = loadEnv(
    mode,
    process.cwd(),
    "VITE_"
  );

  if (!apiBaseUrl?.trim()) {
    throw new Error("VITE_API_BASE_URL must be set to the backend /api URL.");
  }

  let parsedApiUrl;
  try {
    parsedApiUrl = new URL(apiBaseUrl);
  } catch {
    throw new Error("VITE_API_BASE_URL must be a valid absolute URL.");
  }

  if (!["http:", "https:"].includes(parsedApiUrl.protocol)) {
    throw new Error("VITE_API_BASE_URL must use HTTP or HTTPS.");
  }

  if (parsedApiUrl.pathname.replace(/\/+$/, "") !== "/api") {
    throw new Error("VITE_API_BASE_URL must end with /api.");
  }

  return {
    plugins: [react()],
  };
});
