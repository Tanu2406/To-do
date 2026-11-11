export const API_BASE_URL = (
  (typeof process !== "undefined" && process.env?.VITE_API_BASE_URL)
    || (typeof process === "undefined" ? import.meta.env.VITE_API_BASE_URL : undefined)
    || "http://localhost:5000/api"
).replace(/\/+$/, "");

export const GRAPHQL_URL = API_BASE_URL.replace(/\/api$/, "/graphql");
export const SOCKET_URL = (
  (typeof process !== "undefined" && process.env?.VITE_SOCKET_URL)
    || (typeof process === "undefined" ? import.meta.env.VITE_SOCKET_URL : undefined)
    || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000")
).replace(/\/+$/, "");
export const LOGIN_API_URL = (
  (typeof process !== "undefined" && process.env?.VITE_LOGIN_API_URL)
    || (typeof process === "undefined" ? import.meta.env.VITE_LOGIN_API_URL : undefined)
    || `${API_BASE_URL}/auth/login`
).replace(/\/+$/, "");
export const REGISTER_API_URL = `${API_BASE_URL}/auth/register`;
export const SESSION_API_URL = `${API_BASE_URL}/auth/session`;
export const LOGOUT_API_URL = `${API_BASE_URL}/auth/logout`;
