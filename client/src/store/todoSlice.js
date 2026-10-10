import { createSlice } from "@reduxjs/toolkit";

const todoSlice = createSlice({
  name: "todos",
  initialState: [],
  reducers: {
    setTodos: (_state, action) => action.payload,
    addTodo: (state, action) => {
      state.push(action.payload);
    },
    deleteTodo: (state, action) =>
      state.filter((todo) => todo._id !== action.payload),
    toggleTodo: (state, action) => {
      const todo = state.find((item) => item._id === action.payload);
      if (todo) {
        todo.isCompleted = !todo.isCompleted;
      }
    },
    editTodo: (state, action) => {
      const todo = state.find((item) => item._id === action.payload._id);
      if (todo) {
        Object.assign(todo, action.payload);
      }
    },
  },
});

export const { setTodos, addTodo, deleteTodo, toggleTodo, editTodo } =
  todoSlice.actions;

export default todoSlice.reducer;
