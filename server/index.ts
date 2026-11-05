import http from "node:http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import app = require("./app");
import { connectDatabase } from "./config/db";
import { connectRedis, disconnectRedis } from "./config/redis";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || app.locals.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST"],
  },
});

app.locals.io = io;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    console.log("MongoDB connected successfully");
    await connectRedis();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? process.env.MONGODB_URI
          ? error.message.replace(process.env.MONGODB_URI, "[redacted]")
          : error.message
        : String(error);
    console.error(
      "Unable to connect to MongoDB:",
      error instanceof Error ? error.name : "UnknownError",
      message
    );
    process.exitCode = 1;
    await mongoose.disconnect();
  }
}

async function shutdown(): Promise<void> {
  await disconnectRedis();
  await mongoose.disconnect();
  server.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

void startServer();
