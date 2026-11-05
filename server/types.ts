import type { Server } from "socket.io";
import type { HydratedDocument, Types } from "mongoose";

export interface TodoFields {
  task: string;
  isCompleted: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TodoDocument = HydratedDocument<TodoFields>;

export type TodoChanges = Partial<Pick<TodoFields, "task" | "isCompleted">>;

export interface TodoRequestPayload extends Record<string, unknown> {
  task?: unknown;
  isCompleted?: unknown;
}

export interface TodoRecord extends TodoFields {
  _id: Types.ObjectId;
}

export interface ApiErrorResponse {
  errorMessage: string;
}

export interface ApiMessageResponse {
  message: string;
}

export type ApiResponse =
  | TodoRecord
  | TodoRecord[]
  | (ApiMessageResponse & { newList: TodoRecord })
  | (ApiMessageResponse & { updated: TodoRecord })
  | (ApiMessageResponse & { deleted: TodoRecord })
  | { status: string; message: string }
  | ApiErrorResponse
  | string;

export interface AppLocals extends Record<string, unknown> {
  allowedOrigins: string[];
  io?: Server;
}

declare global {
  namespace Express {
    interface Locals {
      allowedOrigins: string[];
      io?: Server;
    }
  }
}
