import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apolloClient } from "../apolloClient";
import {
  LOGIN_API_URL,
  LOGOUT_API_URL,
  REGISTER_API_URL,
  SESSION_API_URL,
} from "../api";

async function readResponse(response, fallbackMessage) {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(result.errorMessage || result.message || fallbackMessage);
  }

  return result;
}

async function submitCredentials(url, credentials) {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const result = await readResponse(response, "Authentication failed.");
  const user = result.data?.user || result.user;
  if (!user?.id || !user?.username) {
    throw new Error("The authentication response did not include a valid user.");
  }
  return user;
}

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      return await submitCredentials(LOGIN_API_URL, credentials);
    } catch (error) {
      return rejectWithValue(error.message || "Login failed.");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (credentials, { rejectWithValue }) => {
    try {
      return await submitCredentials(REGISTER_API_URL, credentials);
    } catch (error) {
      return rejectWithValue(error.message || "Registration failed.");
    }
  }
);

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(SESSION_API_URL, { credentials: "include" });
      if (response.status === 401) return null;
      const result = await readResponse(response, "Could not restore the session.");
      return result.user || null;
    } catch (error) {
      return rejectWithValue(error.message || "Could not restore the session.");
    }
  }
);

export const logoutSession = createAsyncThunk(
  "auth/logoutSession",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(LOGOUT_API_URL, {
        method: "POST",
        credentials: "include",
      });
      await readResponse(response, "Could not end the session.");
      dispatch(logout());
      return true;
    } catch (error) {
      dispatch(logout());
      return rejectWithValue(error.message || "Could not end the session.");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isCheckingSession: true,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      void apolloClient.clearStore().catch((error) => {
        console.error("Could not clear the GraphQL cache after logout.", error);
      });
    },
  },
  extraReducers: (builder) => {
    const addAuthenticationCases = (thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.isLoading = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.isLoading = false;
          state.user = action.payload;
          state.isAuthenticated = true;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
        });
    };

    addAuthenticationCases(login);
    addAuthenticationCases(register);

    builder
      .addCase(restoreSession.pending, (state) => {
        state.isCheckingSession = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isCheckingSession = false;
        state.user = action.payload;
        state.isAuthenticated = Boolean(action.payload);
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.isCheckingSession = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
