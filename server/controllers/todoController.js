const Todo = require("../models/todoModel");

function isRequestObject(body) {
  return body !== null && typeof body === "object" && !Array.isArray(body);
}

function validateTodoFields(body, { requireTask = false } = {}) {
  if (!isRequestObject(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const allowedFields = ["task", "isCompleted"];
  const unknownField = Object.keys(body).find(
    (field) => !allowedFields.includes(field)
  );
  if (unknownField) {
    return { error: `Unknown field: ${unknownField}.` };
  }

  const changes = {};
  if (Object.hasOwn(body, "task")) {
    if (
      typeof body.task !== "string" ||
      body.task.trim().length === 0 ||
      body.task.trim().length > 255
    ) {
      return {
        error: "Task must be a non-empty string of at most 255 characters.",
      };
    }
    changes.task = body.task.trim();
  } else if (requireTask) {
    return { error: "Task is required." };
  }

  if (Object.hasOwn(body, "isCompleted")) {
    if (typeof body.isCompleted !== "boolean") {
      return { error: "isCompleted must be a boolean." };
    }
    changes.isCompleted = body.isCompleted;
  }

  if (Object.keys(changes).length === 0) {
    return { error: "At least one valid todo field is required." };
  }

  return { changes };
}

function parseId(id) {
  if (!/^[1-9]\d*$/.test(id)) {
    return null;
  }
  const numericId = Number(id);
  return Number.isSafeInteger(numericId) ? numericId : null;
}

function sendDatabaseError(res, action, error) {
  console.error(`Unable to ${action} todo:`, error);
  return res.status(500).json({ errorMessage: `Unable to ${action} todo.` });
}

exports.baseRoot = (req, res) => {
  res.status(200).send("<h1>Todo API</h1><p>Powered by Node.js, Express, and MySQL.</p>");
};

exports.getTask = async (req, res) => {
  try {
    const allTask = await Todo.getTodos();
    return res.status(200).json(allTask);
  } catch (error) {
    return sendDatabaseError(res, "retrieve", error);
  }
};

exports.createTask = async (req, res) => {
  const { changes, error } = validateTodoFields(req.body, {
    requireTask: true,
  });
  if (error) {
    return res.status(400).json({ errorMessage: error });
  }

  try {
    const newList = await Todo.createTodo(changes);
    return res
      .status(201)
      .json({ message: "Task created successfully.", newList });
  } catch (error) {
    return sendDatabaseError(res, "create", error);
  }
};

exports.deleteTask = async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ errorMessage: "Task ID is not valid." });
  }

  try {
    const deleted = await Todo.deleteTodo(id);
    if (!deleted) {
      return res.status(404).json({ errorMessage: "Task not found." });
    }
    return res
      .status(200)
      .json({ message: "Task deleted successfully.", deleted });
  } catch (error) {
    return sendDatabaseError(res, "delete", error);
  }
};

exports.updateTask = async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ errorMessage: "Task ID is not valid." });
  }

  const { changes, error } = validateTodoFields(req.body);
  if (error) {
    return res.status(400).json({ errorMessage: error });
  }

  try {
    const updated = await Todo.updateTodo(id, changes);
    if (!updated) {
      return res.status(404).json({ errorMessage: "Task not found." });
    }

    return res
      .status(200)
      .json({ message: "Task updated successfully.", updated });
  } catch (error) {
    return sendDatabaseError(res, "update", error);
  }
};
