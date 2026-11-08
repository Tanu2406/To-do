export const API_BASE_URL = (
  (typeof process !== "undefined" && process.env?.VITE_API_BASE_URL)
    || (typeof process === "undefined" ? import.meta.env.VITE_API_BASE_URL : undefined)
    || "http://localhost:3000/api"
).replace(/\/+$/, "");

export const GRAPHQL_URL = API_BASE_URL.replace(/\/api$/, "/graphql");
