const dotenvFlow = require("dotenv-flow");
dotenvFlow.config();

const http = require("node:http");
const { Server } = require("socket.io");
const app = require("./app");
const mongoose = require("mongoose");
const { connectDatabase } = require("./config/db");

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

async function startServer() {
  try {
    await connectDatabase();
    console.log("MongoDB connected successfully");
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    const message = process.env.MONGODB_URI
      ? error.message.replace(process.env.MONGODB_URI, "[redacted]")
      : error.message;
    console.error("Unable to connect to MongoDB:", error.name, message);
    process.exitCode = 1;
    await mongoose.disconnect();
  }
}

startServer();
