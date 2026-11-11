import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  createTask,
  deleteTask,
  getTask,
  updateTask,
} from "../controllers/todoController";
import { authenticateUser } from "../middleware/auth";
import { authenticateCredentials, registerUser } from "../models/userModel";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookies";
import { getJwtSecret } from "../utils/jwtSecret";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!username.trim() || !password) {
    return res.status(400).json({ errorMessage: "Username and password are required." });
  }

  const user = await authenticateCredentials(username, password);
  if (!user) {
    return res.status(401).json({ errorMessage: "Invalid username or password." });
  }

  const token = jwt.sign({ username: user.username }, getJwtSecret(), {
    subject: String(user._id),
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  } as jwt.SignOptions);
  setAuthCookie(res, token);
  return res.status(200).json({
    data: {
      user: { id: String(user._id), username: user.username },
    },
  });
});

router.post("/auth/register", async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({
      errorMessage: "Username must be between 3 and 50 characters.",
    });
  }
  if (password.length < 6 || password.length > 72) {
    return res.status(400).json({
      errorMessage: "Password must be between 6 and 72 characters.",
    });
  }

  try {
    const user = await registerUser(username, password);
    const token = jwt.sign({ username: user.username }, getJwtSecret(), {
      subject: String(user._id),
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    } as jwt.SignOptions);
    setAuthCookie(res, token);
    return res.status(201).json({
      data: { user: { id: String(user._id), username: user.username } },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Username is already registered.") {
      return res.status(409).json({ errorMessage: error.message });
    }
    throw error;
  }
});

router.post("/auth/password-reset", (_req, res) => {
  return res.status(202).json({
    message:
      "If this account supports password recovery, reset instructions will be sent.",
  });
});

router.post("/auth/logout", (_req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out successfully." });
});

router.get("/auth/session", authenticateUser, (req, res) => {
  const user = req.user;
  return res.status(200).json({
    user: user
      ? { id: user.id, username: user.username }
      : null,
  });
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
