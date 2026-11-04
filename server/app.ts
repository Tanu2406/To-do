import cors from "cors";
import dotenvFlow from "dotenv-flow";
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import todoRoutes from "./routes/todoRoutes";
import { baseRoot } from "./controllers/todoController";
import type { ApiResponse, AppLocals } from "./types";

dotenvFlow.config();

const app = express();

const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && configuredOrigins.length === 0) {
  throw new Error("CLIENT_ORIGIN must be set in production.");
}

const allowedOrigins = [
  ...(isProduction
    ? []
    : ["http://localhost:3000", "http://127.0.0.1:3000"]),
  ...configuredOrigins,
];

const rateLimitExceeded = (_req: Request, res: Response): void => {
  res.status(429).json({
    errorMessage: "Too many requests. Please try again later.",
  });
};

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.locals.allowedOrigins = allowedOrigins;

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitExceeded,
  })
);
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !["POST", "PUT", "PATCH", "DELETE"].includes(req.method),
    handler: rateLimitExceeded,
  })
);

app.use(express.json());

app.get("/", baseRoot);
app.use("/api", todoRoutes);
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Todo API is running",
  });
});

const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response<ApiResponse>,
  next
) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof Error && err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      errorMessage: "Origin not allowed by CORS.",
    });
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    return res.status(400).json({
      errorMessage: "Invalid JSON request body.",
    });
  }

  console.error("Request error:", err);

  return res.status(500).json({
    errorMessage: "An unexpected error occurred.",
  });
};

app.use(errorHandler);

export = app;
