import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apolloClient } from "../apolloClient";
import {
  CREATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  TASKS_QUERY,
  UPDATE_TASK_MUTATION,
} from "../graphql";
import { logout } from "./authSlice";

const normalizeTask = (task) => ({
  ...task,
  _id: task.id || task._id,
  title: task.task || task.title,
});

export const fetchNotes = createAsyncThunk("notes/fetch", async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await apolloClient.query({ query: TASKS_QUERY, fetchPolicy: "network-only" });
    return response.data.tasks.map(normalizeTask);
  } catch (error) {
    if (error.graphQLErrors?.some(({ extensions }) => extensions?.code === "UNAUTHENTICATED")) dispatch(logout());
    return rejectWithValue(error.graphQLErrors?.[0]?.message || error.message || "Could not load notes.");
  }
});

export const addNote = createAsyncThunk("notes/add", async ({ title }, { dispatch, rejectWithValue }) => {
  try {
    const response = await apolloClient.mutate({ mutation: CREATE_TASK_MUTATION, variables: { task: title } });
    return normalizeTask(response.data.createTask);
  } catch (error) {
    if (error.graphQLErrors?.some(({ extensions }) => extensions?.code === "UNAUTHENTICATED")) dispatch(logout());
    return rejectWithValue(error.graphQLErrors?.[0]?.message || error.message || "Could not add note.");
  }
});

export const updateNote = createAsyncThunk("notes/update", async ({ id, title }, { dispatch, rejectWithValue }) => {
  try {
    const response = await apolloClient.mutate({
      mutation: UPDATE_TASK_MUTATION,
      variables: { id, task: title },
    });
    return normalizeTask(response.data.updateTask);
  } catch (error) {
    if (error.graphQLErrors?.some(({ extensions }) => extensions?.code === "UNAUTHENTICATED")) dispatch(logout());
    return rejectWithValue(error.graphQLErrors?.[0]?.message || error.message || "Could not update note.");
  }
});

export const deleteNote = createAsyncThunk("notes/delete", async (id, { dispatch, rejectWithValue }) => {
  try {
    await apolloClient.mutate({ mutation: DELETE_TASK_MUTATION, variables: { id } });
    return id;
  } catch (error) {
    if (error.graphQLErrors?.some(({ extensions }) => extensions?.code === "UNAUTHENTICATED")) dispatch(logout());
    return rejectWithValue(error.graphQLErrors?.[0]?.message || error.message || "Could not delete note.");
  }
});

const notesSlice = createSlice({
  name: "notes",
  initialState: { items: [], isLoading: false, isSaving: false, error: null },
  reducers: {
    taskCreatedOrUpdated(state, action) {
      const task = normalizeTask(action.payload);
      const index = state.items.findIndex((item) => item._id === task._id);
      if (index === -1) state.items.unshift(task);
      else state.items[index] = task;
    },
    taskDeleted(state, action) {
      state.items = state.items.filter((item) => item._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => { state.items = []; state.error = null; })
      .addCase(fetchNotes.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchNotes.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchNotes.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(addNote.pending, (state) => { state.isSaving = true; state.error = null; })
      .addCase(addNote.fulfilled, (state, action) => {
        state.isSaving = false;
        if (!state.items.some((item) => item._id === action.payload._id)) state.items.unshift(action.payload);
      })
      .addCase(addNote.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })
      .addCase(updateNote.pending, (state) => { state.isSaving = true; state.error = null; })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.isSaving = false;
        const index = state.items.findIndex((note) => note._id === action.payload._id);
        if (index === -1) state.items.unshift(action.payload);
        else state.items[index] = action.payload;
      })
      .addCase(updateNote.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })
      .addCase(deleteNote.pending, (state) => { state.isSaving = true; state.error = null; })
      .addCase(deleteNote.fulfilled, (state, action) => { state.isSaving = false; state.items = state.items.filter((note) => note._id !== action.payload); })
      .addCase(deleteNote.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; });
  },
});

export const { taskCreatedOrUpdated, taskDeleted } = notesSlice.actions;
export default notesSlice.reducer;
