import { GraphQLError } from "graphql";
import { PubSub } from "graphql-subscriptions";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createTodo, deleteTodo, getTodos, Todo, updateTodo } from "../models/todoModel";
import { authenticateCredentials, registerUser, User } from "../models/userModel";
import type { GraphQLContext } from "./context";
import { setAuthCookie } from "../utils/authCookies";
import { getJwtSecret } from "../utils/jwtSecret";

export const pubsub = new PubSub();

const taskFields = (task: any) => ({
  id: String(task._id),
  task: task.task,
  isCompleted: task.isCompleted,
  userId: task.userId ? String(task.userId) : null,
  createdAt: task.createdAt?.toISOString?.() ?? task.createdAt,
  updatedAt: task.updatedAt?.toISOString?.() ?? task.updatedAt,
});

const requireUser = (context: GraphQLContext) => {
  if (!context.userId) {
    throw new GraphQLError("Authentication required.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return context.userId;
};

const issueToken = (userId: string, username: string) =>
  jwt.sign({ username }, getJwtSecret(), {
    subject: userId,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  } as jwt.SignOptions);

const userFields = (user: any) => ({
  id: String(user._id),
  username: user.username,
  createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
});

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const userId = requireUser(context);
      if (!mongoose.isValidObjectId(userId)) return null;
      const user = await User.findById(userId).lean().exec();
      return user ? userFields(user) : null;
    },
    tasks: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const userId = requireUser(context);
      const tasks = await getTodos(userId);
      return tasks.map(taskFields);
    },
    task: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const userId = requireUser(context);
      if (!mongoose.isValidObjectId(id)) return null;
      const task = await Todo.findOne({ _id: id, userId }).lean().exec();
      return task ? taskFields(task) : null;
    },
  },
  Mutation: {
    register: async (_: unknown, { username, password }: { username: string; password: string }, context: GraphQLContext) => {
      const cleanUsername = username.trim();
      if (cleanUsername.length < 3 || cleanUsername.length > 50) throw new GraphQLError("Username must be between 3 and 50 characters.");
      if (password.length < 6 || password.length > 72) throw new GraphQLError("Password must be between 6 and 72 characters.");
      const user = await registerUser(cleanUsername, password).catch((error: Error) => {
        throw new GraphQLError(error.message, { extensions: { code: "BAD_USER_INPUT" } });
      });
      const token = issueToken(String(user._id), user.username);
      if (context.res) setAuthCookie(context.res, token);
      return { user: userFields(user) };
    },
    login: async (_: unknown, { username, password }: { username: string; password: string }, context: GraphQLContext) => {
      const user = await authenticateCredentials(username, password);
      if (!user) throw new GraphQLError("Invalid username or password.", { extensions: { code: "UNAUTHENTICATED" } });
      const token = issueToken(String(user._id), user.username);
      if (context.res) setAuthCookie(context.res, token);
      return { user: userFields(user) };
    },
    createTask: async (_: unknown, input: { task: string; isCompleted?: boolean }, context: GraphQLContext) => {
      const userId = requireUser(context);
      const task = input.task.trim();
      if (!task || task.length > 255) throw new GraphQLError("Task must be between 1 and 255 characters.");
      const created = await createTodo({ task, isCompleted: input.isCompleted ?? false, userId });
      const output = taskFields(created);
      context.io?.to(`user:${userId}`).emit("taskCreated", output);
      await pubsub.publish(`taskCreated:${userId}`, { taskCreated: output });
      await pubsub.publish(`taskChanged:${userId}`, { taskChanged: { task: output, taskId: output.id } });
      return output;
    },
    updateTask: async (_: unknown, input: { id: string; task?: string; isCompleted?: boolean }, context: GraphQLContext) => {
      const userId = requireUser(context);
      if (!mongoose.isValidObjectId(input.id)) throw new GraphQLError("Task ID is not valid.", { extensions: { code: "BAD_USER_INPUT" } });
      if (input.task !== undefined && (!input.task.trim() || input.task.trim().length > 255)) throw new GraphQLError("Task must be between 1 and 255 characters.");
      const changes = { ...(input.task !== undefined ? { task: input.task.trim() } : {}), ...(input.isCompleted !== undefined ? { isCompleted: input.isCompleted } : {}) };
      if (Object.keys(changes).length === 0) throw new GraphQLError("At least one task field is required.");
      const updated = await updateTodo(input.id, changes, userId);
      if (!updated) throw new GraphQLError("Task not found.", { extensions: { code: "NOT_FOUND" } });
      const output = taskFields(updated);
      context.io?.to(`user:${userId}`).emit("taskUpdated", output);
      await pubsub.publish(`taskUpdated:${userId}`, { taskUpdated: output });
      await pubsub.publish(`taskChanged:${userId}`, { taskChanged: { task: output, taskId: output.id } });
      return output;
    },
    deleteTask: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const userId = requireUser(context);
      if (!mongoose.isValidObjectId(id)) throw new GraphQLError("Task ID is not valid.", { extensions: { code: "BAD_USER_INPUT" } });
      const deleted = await deleteTodo(id, userId);
      if (!deleted) throw new GraphQLError("Task not found.", { extensions: { code: "NOT_FOUND" } });
      const output = taskFields(deleted);
      context.io?.to(`user:${userId}`).emit("taskDeleted", output);
      await pubsub.publish(`taskDeleted:${userId}`, { taskDeleted: output });
      await pubsub.publish(`taskChanged:${userId}`, { taskChanged: { taskId: output.id } });
      return { taskId: output.id, task: null };
    },
  },
  Subscription: {
    taskChanged: { subscribe: (_: unknown, __: unknown, context: GraphQLContext) => pubsub.asyncIterableIterator(`taskChanged:${requireUser(context)}`) },
    taskCreated: { subscribe: (_: unknown, __: unknown, context: GraphQLContext) => pubsub.asyncIterableIterator(`taskCreated:${requireUser(context)}`) },
    taskUpdated: { subscribe: (_: unknown, __: unknown, context: GraphQLContext) => pubsub.asyncIterableIterator(`taskUpdated:${requireUser(context)}`) },
    taskDeleted: { subscribe: (_: unknown, __: unknown, context: GraphQLContext) => pubsub.asyncIterableIterator(`taskDeleted:${requireUser(context)}`) },
  },
};
