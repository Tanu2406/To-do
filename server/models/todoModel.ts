import { model, Schema } from "mongoose";
import type { TodoChanges, TodoFields, TodoRecord } from "../types";

const todoSchema = new Schema<TodoFields>(
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

const Todo = model<TodoFields>("Todo", todoSchema);

async function getTodos(): Promise<TodoRecord[]> {
  return Todo.find().sort({ _id: 1 }).lean<TodoRecord[]>().exec();
}

async function createTodo(
  { task, isCompleted = false }: Pick<TodoFields, "task"> & TodoChanges
): Promise<TodoRecord> {
  const todo = await Todo.create({ task, isCompleted });
  return todo.toObject();
}

async function updateTodo(
  id: string,
  changes: TodoChanges
): Promise<TodoRecord | null> {
  return Todo.findByIdAndUpdate(id, changes, {
    new: true,
    runValidators: true,
  })
    .lean<TodoRecord>()
    .exec();
}

async function deleteTodo(id: string): Promise<TodoRecord | null> {
  return Todo.findByIdAndDelete(id).lean<TodoRecord>().exec();
}

export { Todo, getTodos, createTodo, updateTodo, deleteTodo };
export type { TodoFields, TodoRecord, TodoChanges };
