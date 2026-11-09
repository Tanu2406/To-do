jest.mock("../models/todoModel", () => ({
  getTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
}));

process.env.CLIENT_ORIGIN = "https://todo.example";

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const Todo = require("../models/todoModel");
const { User } = require("../models/userModel");

const todo = {
  _id: "507f1f77bcf86cd799439011",
  task: "Buy groceries",
  isCompleted: false,
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  app.locals.io = { emit: jest.fn() };
});

afterEach(() => {
  jest.restoreAllMocks();
  delete app.locals.io;
});

describe("Todo API", () => {
  test("GET / returns the API welcome page", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("MongoDB");
  });

  test("CORS allows the configured frontend origin", async () => {
    const response = await request(app)
      .get("/")
      .set("Origin", "https://todo.example");

    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://todo.example"
    );
  });

  test("CORS allows the local development frontend", async () => {
    const response = await request(app)
      .get("/")
      .set("Origin", "http://localhost:3000");

    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    );
  });

  test("CORS does not allow unconfigured frontend origins", async () => {
    const response = await request(app)
      .get("/")
      .set("Origin", "https://untrusted.example");

    expect(response.status).toBe(403);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(response.body).toEqual({
      errorMessage: "Origin not allowed by CORS.",
    });
  });

  test("Helmet sets security headers", async () => {
    const response = await request(app).get("/");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  test("Helmet sets a restrictive CSP", async () => {
    const response = await request(app).get("/api/health");

    expect(response.headers["content-security-policy"]).toContain(
      "default-src 'self'"
    );
    expect(response.headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'"
    );
  });

  test("login rejects demo credentials that do not belong to a stored user", async () => {
    jest.spyOn(User, "findOne").mockReturnValue({
      lean: () => ({ exec: async () => null }),
    });
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "demo", password: "demo" });

    expect(response.status).toBe(401);
    expect(response.body.errorMessage).toBe("Invalid username or password.");
  });

  test("logout clears the authentication cookie", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"][0]).toContain(
      "todo_auth_token=;"
    );
  });

  test("authentication endpoints return 429 after the strict limit", async () => {
    jest.spyOn(User, "findOne").mockReturnValue({
      lean: () => ({ exec: async () => null }),
    });
    let response;
    for (let attempt = 0; attempt < 11; attempt += 1) {
      response = await request(app)
        .post("/api/auth/login")
        .send({ username: "demo", password: "wrong" });
    }

    expect(response.status).toBe(429);
    expect(response.body.errorMessage).toContain("Too many requests");
  });

  test("CORS handles allowed preflight requests", async () => {
    const response = await request(app)
      .options("/api/new")
      .set("Origin", "https://todo.example")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://todo.example"
    );
    expect(response.headers["access-control-allow-methods"]).toContain("POST");
    expect(response.headers["access-control-allow-headers"]).toContain(
      "Content-Type"
    );
  });

  test("CORS rejects unapproved preflight requests", async () => {
    const response = await request(app)
      .options("/api/new")
      .set("Origin", "https://untrusted.example")
      .set("Access-Control-Request-Method", "POST");

    expect(response.status).toBe(403);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("GET /api/get returns all todos", async () => {
    Todo.getTodos.mockResolvedValue([todo]);

    const response = await request(app).get("/api/get");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([todo]);
  });

  test("GET /api/get reports database failures", async () => {
    const error = new Error("database unavailable");
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    Todo.getTodos.mockRejectedValue(error);

    const response = await request(app).get("/api/get");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      errorMessage: "Unable to retrieve todo.",
    });
    expect(log).toHaveBeenCalledWith("Unable to retrieve todo:", error);
  });

  test("POST /api/new creates a todo using the validated fields", async () => {
    const created = { ...todo, task: "Buy groceries" };
    Todo.createTodo.mockResolvedValue(created);

    const response = await request(app)
      .post("/api/new")
      .send({ task: "  Buy groceries  " });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Task created successfully.",
      newList: created,
    });
    expect(Todo.createTodo).toHaveBeenCalledWith({ task: "Buy groceries" });
    expect(app.locals.io.emit).toHaveBeenCalledWith("todo:created", created);
  });

  test.each([
    ["missing task", {}],
    ["blank task", { task: "  " }],
    ["too-long task", { task: "x".repeat(256) }],
    ["non-string task", { task: 1 }],
    ["unknown field", { task: "Valid", extra: true }],
    ["non-object body", ["Valid"]],
  ])("POST /api/new rejects %s", async (_caseName, body) => {
    const response = await request(app).post("/api/new").send(body);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errorMessage");
    expect(Todo.createTodo).not.toHaveBeenCalled();
  });

  test("POST /api/new reports database failures", async () => {
    const error = new Error("database unavailable");
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    Todo.createTodo.mockRejectedValue(error);

    const response = await request(app)
      .post("/api/new")
      .send({ task: "Valid task", isCompleted: true });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ errorMessage: "Unable to create todo." });
    expect(Todo.createTodo).toHaveBeenCalledWith({
      task: "Valid task",
      isCompleted: true,
    });
    expect(app.locals.io.emit).not.toHaveBeenCalled();
  });

  test("POST /api/new reports Mongoose validation failures as client errors", async () => {
    Todo.createTodo.mockRejectedValue(
      new mongoose.Error.ValidationError()
    );

    const response = await request(app)
      .post("/api/new")
      .send({ task: "Valid task" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errorMessage: "Todo validation failed.",
    });
  });

  test("PUT /api/update/:id updates provided fields", async () => {
    const updated = { ...todo, task: "Updated", isCompleted: true };
    Todo.updateTodo.mockResolvedValue(updated);

    const response = await request(app)
      .put(`/api/update/${todo._id}`)
      .send({ task: " Updated ", isCompleted: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Task updated successfully.",
      updated,
    });
    expect(Todo.updateTodo).toHaveBeenCalledWith(todo._id, {
      task: "Updated",
      isCompleted: true,
    });
    expect(app.locals.io.emit).toHaveBeenCalledWith("todo:updated", updated);
  });

  test.each(["0", "not-an-id", "507f1f77bcf86cd79943901z"])(
    "PUT /api/update/%s rejects an invalid ID",
    async (id) => {
      const response = await request(app)
        .put(`/api/update/${id}`)
        .send({ task: "Updated" });

      expect(response.status).toBe(400);
      expect(response.body.errorMessage).toBe("Task ID is not valid.");
      expect(Todo.updateTodo).not.toHaveBeenCalled();
    }
  );

  test.each([
    ["empty fields", {}],
    ["invalid completion flag", { isCompleted: "yes" }],
    ["blank task", { task: " " }],
    ["unknown field", { task: "Valid", extra: true }],
    ["non-object body", null],
  ])("PUT /api/update/1 rejects %s", async (_caseName, body) => {
    const response = await request(app)
      .put(`/api/update/${todo._id}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errorMessage");
    expect(Todo.updateTodo).not.toHaveBeenCalled();
  });

  test("PUT /api/update/:id rejects _id as an immutable field", async () => {
    const response = await request(app)
      .put(`/api/update/${todo._id}`)
      .send({ _id: todo._id, isCompleted: true });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errorMessage: "Unknown field: _id.",
    });
    expect(Todo.updateTodo).not.toHaveBeenCalled();
  });

  test("PUT /api/update/:id returns 404 when the todo does not exist", async () => {
    Todo.updateTodo.mockResolvedValue(null);

    const response = await request(app)
      .put("/api/update/507f1f77bcf86cd799439042")
      .send({ isCompleted: true });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ errorMessage: "Task not found." });
    expect(app.locals.io.emit).not.toHaveBeenCalled();
  });

  test("PUT /api/update/:id reports database failures", async () => {
    const error = new Error("database unavailable");
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    Todo.updateTodo.mockRejectedValue(error);

    const response = await request(app)
      .put(`/api/update/${todo._id}`)
      .send({ task: "Updated" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ errorMessage: "Unable to update todo." });
    expect(app.locals.io.emit).not.toHaveBeenCalled();
  });

  test("DELETE /api/delete/:id deletes an existing todo", async () => {
    Todo.deleteTodo.mockResolvedValue(todo);

    const response = await request(app).delete(`/api/delete/${todo._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Task deleted successfully.",
      deleted: todo,
    });
    expect(Todo.deleteTodo).toHaveBeenCalledWith(todo._id);
    expect(app.locals.io.emit).toHaveBeenCalledWith("todo:deleted", {
      _id: todo._id,
    });
  });

  test.each(["0", "bad-id", "507f1f77bcf86cd79943901z"])(
    "DELETE /api/delete/%s rejects an invalid ID",
    async (id) => {
      const response = await request(app).delete(`/api/delete/${id}`);

      expect(response.status).toBe(400);
      expect(response.body.errorMessage).toBe("Task ID is not valid.");
      expect(Todo.deleteTodo).not.toHaveBeenCalled();
    }
  );

  test("DELETE /api/delete/:id returns 404 when the todo does not exist", async () => {
    Todo.deleteTodo.mockResolvedValue(null);

    const response = await request(app).delete(
      "/api/delete/507f1f77bcf86cd799439042"
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ errorMessage: "Task not found." });
    expect(app.locals.io.emit).not.toHaveBeenCalled();
  });

  test("DELETE /api/delete/:id reports database failures", async () => {
    const error = new Error("database unavailable");
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    Todo.deleteTodo.mockRejectedValue(error);

    const response = await request(app).delete(`/api/delete/${todo._id}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ errorMessage: "Unable to delete todo." });
    expect(app.locals.io.emit).not.toHaveBeenCalled();
  });

  test("malformed JSON receives a 400 response", async () => {
    const response = await request(app)
      .post("/api/new")
      .set("Content-Type", "application/json")
      .send('{"task":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errorMessage: "Invalid JSON request body.",
    });
  });

  test("unexpected request errors receive a 500 response", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(app)
      .post("/api/new")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ task: "x".repeat(110_000) }));

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      errorMessage: "An unexpected error occurred.",
    });
    expect(log).toHaveBeenCalledWith(
      "Request error:",
      expect.objectContaining({ type: "entity.too.large" })
    );
  });

  test("API requests receive a 429 after the general rate limit", async () => {
    let response;

    for (let attempt = 0; attempt < 101; attempt += 1) {
      response = await request(app).get("/api/health");
      if (response.status === 429) {
        break;
      }
    }

    expect(response.status).toBe(429);
    expect(response.headers["ratelimit-limit"]).toBe("100");
    expect(response.body).toEqual({
      errorMessage: "Too many requests. Please try again later.",
    });
  });
});
