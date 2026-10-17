const express = require("express");
const cors = require("cors");
const todoRoutes = require("./routes/todoRoutes");
const { baseRoot } = require("./controllers/todoController");

const app = express();

const allowedOrigins = [
  "https://to-do-1-aets.onrender.com",
  ...(process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/", baseRoot);
app.use("/api", todoRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      errorMessage: "Invalid JSON request body.",
    });
  }

  console.error("Request error:", err);

  return res.status(500).json({
    errorMessage: "An unexpected error occurred.",
  });
});

module.exports = app;