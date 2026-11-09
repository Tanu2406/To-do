import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  createTask,
  deleteTask,
  getTask,
  updateTask,
} from "../controllers/todoController";
import { authenticateUser } from "../middleware/auth";
import { authenticateCredentials } from "../models/userModel";
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
      token,
      user: { id: String(user._id), username: user.username },
    },
  });
});

router.post("/auth/register", (_req, res) => {
  return res.status(501).json({
    errorMessage: "Registration is not enabled.",
  });
});

router.post("/auth/password-reset", (_req, res) => {
  return res.status(202).json({
    message:
      "If this account supports password recovery, reset instructions will be sent.",
  });
});

router.post("/auth/logout", authenticateUser, (_req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out successfully." });
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
