import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  createTask,
  deleteTask,
  getTask,
  updateTask,
} from "../controllers/todoController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.post("/auth/login", (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const expectedUsername = process.env.AUTH_USERNAME || "demo";
  const expectedPassword = process.env.AUTH_PASSWORD || "demo";
  if (username !== expectedUsername || password !== expectedPassword) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  const secret = process.env.JWT_SECRET || "development-only-change-me";
  const userId = process.env.AUTH_USER_ID || username;
  const token = jwt.sign({ username }, secret, {
    subject: userId,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  } as jwt.SignOptions);
  return res.status(200).json({ data: { token } });
});

router.use(authenticateUser);
router.route("/new").post(createTask);
router.route("/get").get(getTask);
router.route("/tasks").get(getTask);
router.route("/notes").get(getTask).post(createTask);
router.route("/update/:id").put(updateTask);
router.route("/notes/:id").put(updateTask).delete(deleteTask);
router.route("/delete/:id").delete(deleteTask);

export default router;
