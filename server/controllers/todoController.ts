import mongoose from "mongoose";
import type { NextFunction, Request, Response } from "express";
import type { ParsedQs } from "qs";
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from "../models/todoModel";
import type {
  ApiResponse,
  AppLocals,
  TodoChanges,
  TodoRequestPayload,
} from "../types";

type TodoRequest = Request<
  { id: string },
  ApiResponse,
  unknown,
  ParsedQs,
  AppLocals
>;

type ValidationResult =
  | { valid: true; changes: TodoChanges }
  | { valid: false; error: string };

type CreateValidationResult =
  | { valid: true; changes: TodoChanges & { task: string } }
  | { valid: false; error: string };

function isRequestObject(body: unknown): body is TodoRequestPayload {
  return body !== null && typeof body === "object" && !Array.isArray(body);
}

function validateTodoFields(
  body: unknown,
  options: { requireTask: true }
): CreateValidationResult;
function validateTodoFields(
  body: unknown,
  options?: { requireTask?: false }
): ValidationResult;
function validateTodoFields(
  body: unknown,
  { requireTask = false }: { requireTask?: boolean } = {}
): ValidationResult {
  if (!isRequestObject(body)) {
    return { valid: false, error: "Request body must be a JSON object." };
  }

  const allowedFields = ["task", "isCompleted"];
  const unknownField = Object.keys(body).find(
    (field) => !allowedFields.includes(field)
  );
  if (unknownField) {
    return { valid: false, error: `Unknown field: ${unknownField}.` };
  }

  const changes: TodoChanges = {};
  if (Object.hasOwn(body, "task")) {
    const task = body.task;
    if (
      typeof task !== "string" ||
      task.trim().length === 0 ||
      task.trim().length > 255
    ) {
      return {
        valid: false,
        error: "Task must be a non-empty string of at most 255 characters.",
      };
    }
    changes.task = task.trim();
  } else if (requireTask) {
    return { valid: false, error: "Task is required." };
  }

  if (Object.hasOwn(body, "isCompleted")) {
    const isCompleted = body.isCompleted;
    if (typeof isCompleted !== "boolean") {
      return { valid: false, error: "isCompleted must be a boolean." };
    }
    changes.isCompleted = isCompleted;
  }

  if (Object.keys(changes).length === 0) {
    return {
      valid: false,
      error: "At least one valid todo field is required.",
    };
  }

  return { valid: true, changes };
}

function parseId(id: string): string | null {
  return /^[a-f\d]{24}$/i.test(id) && mongoose.isValidObjectId(id) ? id : null;
}

function sendDatabaseError(
  res: Response<ApiResponse>,
  action: string,
  error: unknown
): Response<ApiResponse> {
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ errorMessage: "Todo validation failed." });
  }

  console.error(`Unable to ${action} todo:`, error);
  return res.status(500).json({ errorMessage: `Unable to ${action} todo.` });
}

export function baseRoot(
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  res
    .status(200)
    .send("<h1>Todo API</h1><p>Powered by Node.js, Express, and MongoDB.</p>");
}

export async function getTask(
  _req: TodoRequest,
  res: Response<ApiResponse>
): Promise<Response<ApiResponse>> {
  try {
    const allTask = await getTodos();
    return res.status(200).json(allTask);
  } catch (error) {
    return sendDatabaseError(res, "retrieve", error);
  }
}

export async function createTask(
  req: TodoRequest,
  res: Response<ApiResponse>
): Promise<Response<ApiResponse>> {
  const validation = validateTodoFields(req.body, { requireTask: true });
  if (!validation.valid) {
    return res.status(400).json({ errorMessage: validation.error });
  }

  try {
    const newList = await createTodo(validation.changes);
    req.app.locals.io?.emit("todo:created", newList);
    return res
      .status(201)
      .json({ message: "Task created successfully.", newList });
  } catch (error) {
    return sendDatabaseError(res, "create", error);
  }
}

export async function deleteTask(
  req: TodoRequest,
  res: Response<ApiResponse>
): Promise<Response<ApiResponse>> {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ errorMessage: "Task ID is not valid." });
  }

  try {
    const deleted = await deleteTodo(id);
    if (!deleted) {
      return res.status(404).json({ errorMessage: "Task not found." });
    }
    req.app.locals.io?.emit("todo:deleted", { _id: deleted._id });
    return res
      .status(200)
      .json({ message: "Task deleted successfully.", deleted });
  } catch (error) {
    return sendDatabaseError(res, "delete", error);
  }
}

export async function updateTask(
  req: TodoRequest,
  res: Response<ApiResponse>
): Promise<Response<ApiResponse>> {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ errorMessage: "Task ID is not valid." });
  }

  const validation = validateTodoFields(req.body);
  if (!validation.valid) {
    return res.status(400).json({ errorMessage: validation.error });
  }

  try {
    const updated = await updateTodo(id, validation.changes);
    if (!updated) {
      return res.status(404).json({ errorMessage: "Task not found." });
    }

    req.app.locals.io?.emit("todo:updated", updated);
    return res
      .status(200)
      .json({ message: "Task updated successfully.", updated });
  } catch (error) {
    return sendDatabaseError(res, "update", error);
  }
}
