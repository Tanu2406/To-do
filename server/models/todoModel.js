const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

const Todo = mongoose.model("Todo", todoSchema);

async function getTodos() {
  return Todo.find().sort({ _id: 1 }).lean().exec();
}

async function createTodo({ task, isCompleted = false }) {
  const todo = await Todo.create({ task, isCompleted });
  return todo.toObject();
}

async function updateTodo(id, changes) {
  return Todo.findByIdAndUpdate(id, changes, {
    new: true,
    runValidators: true,
  })
    .lean()
    .exec();
}

async function deleteTodo(id) {
  return Todo.findByIdAndDelete(id).lean().exec();
}

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, Todo };
