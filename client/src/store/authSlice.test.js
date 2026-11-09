import { configureStore } from "@reduxjs/toolkit";
import { LOGIN_API_URL } from "../api";
import authReducer, { login } from "./authSlice";

jest.mock("../api", () => ({ LOGIN_API_URL: "https://api.example/login" }));
jest.mock("../apolloClient", () => ({ apolloClient: { resetStore: jest.fn() } }));

const createStore = () => configureStore({ reducer: { auth: authReducer } });
const createToken = () => {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
};

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe("login thunk", () => {
  test("posts credentials to the configured endpoint and stores the JWT", async () => {
    const token = createToken();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token }),
    });
    const store = createStore();

    await store.dispatch(login({ username: "alice", password: "correct horse" }));

    expect(global.fetch).toHaveBeenCalledWith(
      LOGIN_API_URL,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "alice", password: "correct horse" }),
      })
    );
    expect(store.getState().auth.token).toBe(token);
    expect(sessionStorage.getItem("skillpilot_token")).toBe(token);
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
