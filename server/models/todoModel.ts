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
    userId: {
      type: String,
      index: true,
      default: undefined,
    },
  },
  { timestamps: true, versionKey: false }
);

const Todo = model<TodoFields>("Todo", todoSchema);

async function getTodos(userId?: string): Promise<TodoRecord[]> {
  const filter = { userId };
  const query = userId
    ? Todo.find(filter)
    : Todo.find();
  return query.sort({ _id: 1 }).lean<TodoRecord[]>().exec();
}

async function createTodo(
  { task, isCompleted = false, userId }: Pick<TodoFields, "task"> &
    Partial<Pick<TodoFields, "isCompleted" | "userId">>
): Promise<TodoRecord> {
  const todo = await Todo.create({ task, isCompleted, userId });
  return todo.toObject();
}

async function updateTodo(
  id: string,
  changes: TodoChanges,
  userId?: string
): Promise<TodoRecord | null> {
  if (userId) {
    const existing = await Todo.findById(id).lean<{ userId?: string }>().exec();
    if (!existing || existing.userId !== userId) return null;
  }
  return Todo.findByIdAndUpdate(id, changes, {
    new: true,
    runValidators: true,
  })
    .lean<TodoRecord>()
    .exec();
}

async function deleteTodo(id: string, userId?: string): Promise<TodoRecord | null> {
  if (userId) {
    const existing = await Todo.findById(id).lean<{ userId?: string }>().exec();
    if (!existing || existing.userId !== userId) return null;
  }
  return Todo.findByIdAndDelete(id).lean<TodoRecord>().exec();
}

export { Todo, getTodos, createTodo, updateTodo, deleteTodo };
export type { TodoFields, TodoRecord, TodoChanges };
