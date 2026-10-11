const pool = require("../config/db");

const todoColumns = "id, task, isCompleted, createdAt, updatedAt";

function formatTodo(row) {
  return {
    _id: row.id,
    task: row.task,
    isCompleted: Boolean(row.isCompleted),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getTodos() {
  const [rows] = await pool.execute(
    `SELECT ${todoColumns} FROM todos ORDER BY id ASC`
  );
  return rows.map(formatTodo);
}

async function createTodo({ task, isCompleted = false }) {
  const [result] = await pool.execute(
    "INSERT INTO todos (task, isCompleted) VALUES (?, ?)",
    [task, isCompleted]
  );
  const [rows] = await pool.execute(
    `SELECT ${todoColumns} FROM todos WHERE id = ?`,
    [result.insertId]
  );
  return formatTodo(rows[0]);
}

async function updateTodo(id, changes) {
  const assignments = [];
  const values = [];

  if (Object.hasOwn(changes, "task")) {
    assignments.push("task = ?");
    values.push(changes.task);
  }
  if (Object.hasOwn(changes, "isCompleted")) {
    assignments.push("isCompleted = ?");
    values.push(changes.isCompleted);
  }

  values.push(id);
  await pool.execute(
    `UPDATE todos SET ${assignments.join(", ")} WHERE id = ?`,
    values
  );

  const [rows] = await pool.execute(
    `SELECT ${todoColumns} FROM todos WHERE id = ?`,
    [id]
  );
  return rows.length === 0 ? null : formatTodo(rows[0]);
}

async function deleteTodo(id) {
  const [rows] = await pool.execute(
    `SELECT ${todoColumns} FROM todos WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }

  await pool.execute("DELETE FROM todos WHERE id = ?", [id]);
  return formatTodo(rows[0]);
}

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
