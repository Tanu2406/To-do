import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apolloClient } from "../apolloClient";
import { LOGIN_MUTATION } from "../graphql";

const TOKEN_KEY = "skillpilot_token";

const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(atob(payload).split("").map((character) =>
      `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`
    ).join("")));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  return !payload?.exp || payload.exp * 1000 <= Date.now();
};

const storedToken = sessionStorage.getItem(TOKEN_KEY);
const validStoredToken = storedToken && !isTokenExpired(storedToken) ? storedToken : null;
if (!validStoredToken) sessionStorage.removeItem(TOKEN_KEY);

export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await apolloClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: credentials,
    });
    const token = response.data.login.token;
    if (isTokenExpired(token)) return rejectWithValue("The login token is invalid or expired.");
    sessionStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch (error) {
    return rejectWithValue(error.graphQLErrors?.[0]?.message || error.message || "Login failed.");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: validStoredToken,
    isAuthenticated: Boolean(validStoredToken),
    isLoading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      sessionStorage.removeItem(TOKEN_KEY);
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      void apolloClient.resetStore();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
