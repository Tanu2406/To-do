const express = require("express");
const cors = require("cors");
const todoRoutes = require("./routes/todoRoutes");
const { baseRoot } = require("./controllers/todoController");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      callback(
        null,
        !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)
      );
    },
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
    return res.status(400).json({ errorMessage: "Invalid JSON request body." });
  }

  console.error("Request error:", err);
  return res.status(500).json({ errorMessage: "An unexpected error occurred." });
});

module.exports = app;
