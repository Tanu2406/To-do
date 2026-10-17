const dotenvFlow = require("dotenv-flow");
dotenvFlow.config();

const app = require("./app");
const mongoose = require("mongoose");
const { connectDatabase } = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
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
