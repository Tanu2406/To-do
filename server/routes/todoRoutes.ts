import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  updateTask,
} from "../controllers/todoController";

const router = Router();

router.route("/new").post(createTask);
router.route("/get").get(getTask);
router.route("/update/:id").put(updateTask);
router.route("/delete/:id").delete(deleteTask);

export default router;
