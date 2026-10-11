const dotenvFlow = require("dotenv-flow");
dotenvFlow.config();

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ MySQL connected successfully");
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to MySQL:", error.message);
    process.exitCode = 1;
    await pool.end();
  }
}

startServer();
