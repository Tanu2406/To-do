const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { authenticateCredentials } = require("../../dist/models/userModel");

let connectionPromise;

const response = (statusCode, body, origin) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    ...(origin
      ? { "access-control-allow-origin": origin, vary: "Origin" }
      : {}),
  },
  body: body === null ? "" : JSON.stringify(body),
});

const getHeader = (headers, name) => {
  const key = Object.keys(headers || {}).find(
    (header) => header.toLowerCase() === name.toLowerCase()
  );
  return key ? headers[key] : undefined;
};

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be configured.");
  }
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  await connectionPromise;
};

const parseBody = (event) => {
  if (event.body === null || event.body === undefined || event.body === "") return {};
  if (typeof event.body === "object") return event.body;
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  return JSON.parse(rawBody);
};

exports.handler = async (event = {}) => {
  const headers = event.headers || {};
  const requestContext = event.requestContext || {};
  const method = event.httpMethod || requestContext.http?.method;
  const origin = getHeader(headers, "origin");
  const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!process.env.JWT_SECRET || allowedOrigins.length === 0) {
    console.error("Login Lambda requires JWT_SECRET and CLIENT_ORIGIN configuration.");
    return response(500, { errorMessage: "Authentication service is not configured." });
  }
  if (origin && !allowedOrigins.includes(origin)) {
    return response(403, { errorMessage: "Origin not allowed by CORS." });
  }
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
        "access-control-allow-methods": "POST,OPTIONS",
        "access-control-allow-headers": "Content-Type,Authorization",
        "access-control-max-age": "600",
      },
      body: "",
    };
  }
  if (method !== "POST") {
    return response(405, { errorMessage: "Method not allowed." }, origin);
  }

  let body;
  try {
    body = parseBody(event);
  } catch {
    return response(400, { errorMessage: "Invalid JSON request body." }, origin);
  }
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof body.username !== "string" ||
    !body.username.trim() ||
    typeof body.password !== "string" ||
    !body.password
  ) {
    return response(
      400,
      { errorMessage: "Username and password are required." },
      origin
    );
  }

  try {
    await connectDatabase();
    const user = await authenticateCredentials(body.username, body.password);
    if (!user) {
      return response(401, { errorMessage: "Invalid username or password." }, origin);
    }
    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      {
        subject: String(user._id),
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      }
    );
    return response(
      200,
      {
        token,
        user: { id: String(user._id), username: user.username },
      },
      origin
    );
  } catch (error) {
    console.error(
      "Login Lambda request failed:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return response(500, { errorMessage: "An unexpected error occurred." }, origin);
  }
};
