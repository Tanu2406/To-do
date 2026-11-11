import { configureStore } from "@reduxjs/toolkit";
import {
  LOGIN_API_URL,
  REGISTER_API_URL,
} from "../api";
import authReducer, { login, register } from "./authSlice";

jest.mock("../api", () => ({
  LOGIN_API_URL: "https://api.example/auth/login",
  REGISTER_API_URL: "https://api.example/auth/register",
  SESSION_API_URL: "https://api.example/auth/session",
  LOGOUT_API_URL: "https://api.example/auth/logout",
}));
jest.mock("../apolloClient", () => ({
  apolloClient: { clearStore: jest.fn().mockResolvedValue(undefined) },
}));

const createStore = () => configureStore({ reducer: { auth: authReducer } });
const user = { id: "123", username: "alice" };

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe("cookie-based authentication", () => {
  test("logs in with credentials and keeps the JWT out of browser storage", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { user } }),
    });
    const store = createStore();

    await store.dispatch(login({ username: "alice", password: "correct horse" }));

    expect(global.fetch).toHaveBeenCalledWith(
      LOGIN_API_URL,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ username: "alice", password: "correct horse" }),
      })
    );
    expect(store.getState().auth.user).toEqual(user);
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(sessionStorage.length).toBe(0);
  });

  test("registers an account through the cookie-authenticated API", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { user } }),
    });
    const store = createStore();

    await store.dispatch(register({ username: "alice", password: "correct horse" }));

    expect(global.fetch).toHaveBeenCalledWith(
      REGISTER_API_URL,
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
    expect(store.getState().auth.user).toEqual(user);
  });

  test("surfaces API errors for invalid credentials", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ errorMessage: "Invalid username or password." }),
    });
    const store = createStore();

    const action = await store.dispatch(
      login({ username: "alice", password: "wrong" })
    );

    expect(action.type).toBe(login.rejected.type);
    expect(store.getState().auth.error).toBe("Invalid username or password.");
  });
});
