const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { User } = require("../models/userModel");
const { handler } = require("../lambda/login/handler");

const userId = "507f1f77bcf86cd799439011";
let passwordHash;

const makeEvent = (body, origin = "https://todo.example", method = "POST") => ({
  version: "2.0",
  headers: { origin, "content-type": "application/json" },
  requestContext: { http: { method } },
  body: typeof body === "string" ? body : JSON.stringify(body),
});

beforeAll(async () => {
  passwordHash = await bcrypt.hash("correct horse battery", 4);
});

beforeEach(() => {
  process.env.CLIENT_ORIGIN = "https://todo.example";
  process.env.JWT_SECRET = "test-only-login-secret-with-more-than-32-characters";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/todo-test";
  jest.spyOn(mongoose, "connect").mockResolvedValue(mongoose);
  jest.spyOn(User, "findOne").mockReturnValue({
    lean: () => ({
      exec: async () => ({
        _id: userId,
        username: "alice",
        passwordHash,
      }),
    }),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("API Gateway login Lambda", () => {
  test("authenticates the stored password hash and issues a verifiable JWT", async () => {
    const result = await handler(
      makeEvent({ username: "alice", password: "correct horse battery" })
    );
    const payload = JSON.parse(result.body);
    const decoded = jwt.verify(payload.token, process.env.JWT_SECRET);

    expect(result.statusCode).toBe(200);
    expect(result.headers["access-control-allow-origin"]).toBe("https://todo.example");
    expect(payload.user).toEqual({ id: userId, username: "alice" });
    expect(decoded.sub).toBe(userId);
    expect(decoded.username).toBe("alice");
  });

  test("rejects invalid credentials without returning a token", async () => {
    const result = await handler(makeEvent({ username: "alice", password: "wrong" }));

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body)).toEqual({
      errorMessage: "Invalid username or password.",
    });
  });

  test("rejects missing credentials without querying users", async () => {
    const result = await handler(makeEvent({ username: "alice" }));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).errorMessage).toBe(
      "Username and password are required."
    );
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test("answers allowed CORS preflight requests", async () => {
    const result = await handler(makeEvent("", "https://todo.example", "OPTIONS"));

    expect(result.statusCode).toBe(204);
    expect(result.headers["access-control-allow-origin"]).toBe("https://todo.example");
    expect(result.headers["access-control-allow-methods"]).toBe("POST,OPTIONS");
  });

  test("rejects requests from origins outside the CORS allowlist", async () => {
    const result = await handler(
      makeEvent({ username: "alice", password: "correct horse battery" }, "https://evil.example")
    );

    expect(result.statusCode).toBe(403);
    expect(result.headers["access-control-allow-origin"]).toBeUndefined();
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test("returns a client error for malformed JSON", async () => {
    const result = await handler(makeEvent("{invalid-json"));

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).errorMessage).toBe("Invalid JSON request body.");
  });
});
