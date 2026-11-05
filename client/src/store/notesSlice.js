import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../api";
import { logout } from "./authSlice";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

export const fetchNotes = createAsyncThunk("notes/fetch", async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    const { token } = getState().auth;
    const response = await axios.get(`${API_BASE_URL}/notes`, { headers: authHeaders(token) });
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data.map((note) => ({ ...note, title: note.title || note.task })) : [];
  } catch (error) {
    if (error.response?.status === 401) dispatch(logout());
    return rejectWithValue(error.response?.data?.message || error.response?.data?.errorMessage || "Could not load notes.");
  }
});

export const addNote = createAsyncThunk("notes/add", async ({ title, content }, { getState, dispatch, rejectWithValue }) => {
  try {
    const { token } = getState().auth;
    const response = await axios.post(`${API_BASE_URL}/notes`, { task: title, title, content }, { headers: authHeaders(token) });
    const created = response.data.newList || response.data.data;
    return { ...created, title: created.title || created.task };
  } catch (error) {
    if (error.response?.status === 401) dispatch(logout());
    return rejectWithValue(error.response?.data?.message || error.response?.data?.errorMessage || "Could not add note.");
  }
});

export const updateNote = createAsyncThunk("notes/update", async ({ id, title, content }, { getState, dispatch, rejectWithValue }) => {
  try {
    const { token } = getState().auth;
    const response = await axios.put(`${API_BASE_URL}/notes/${id}`, { task: title, title, content }, { headers: authHeaders(token) });
    const updated = response.data.updated || response.data.data;
    return { ...updated, title: updated.title || updated.task };
  } catch (error) {
    if (error.response?.status === 401) dispatch(logout());
    return rejectWithValue(error.response?.data?.message || error.response?.data?.errorMessage || "Could not update note.");
  }
});

export const deleteNote = createAsyncThunk("notes/delete", async (id, { getState, dispatch, rejectWithValue }) => {
  try {
    const { token } = getState().auth;
    await axios.delete(`${API_BASE_URL}/notes/${id}`, { headers: authHeaders(token) });
    return id;
  } catch (error) {
    if (error.response?.status === 401) dispatch(logout());
    return rejectWithValue(error.response?.data?.message || error.response?.data?.errorMessage || "Could not delete note.");
  }
});

const notesSlice = createSlice({
  name: "notes",
  initialState: { items: [], isLoading: false, isSaving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => { state.items = []; state.error = null; })
      .addCase(fetchNotes.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchNotes.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchNotes.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(addNote.pending, (state) => { state.isSaving = true; state.error = null; })
      .addCase(addNote.fulfilled, (state, action) => { state.isSaving = false; state.items.unshift(action.payload); })
      .addCase(addNote.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })
      .addCase(updateNote.pending, (state) => { state.isSaving = true; state.error = null; })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.isSaving = false;
        const index = state.items.findIndex((note) => note._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateNote.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })
      .addCase(deleteNote.pending, (state) => { state.isSaving = true; state.error = null; })
      .addCase(deleteNote.fulfilled, (state, action) => { state.isSaving = false; state.items = state.items.filter((note) => note._id !== action.payload); })
      .addCase(deleteNote.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; });
  },
});

export default notesSlice.reducer;
