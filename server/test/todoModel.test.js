jest.mock("../config/db", () => ({
  execute: jest.fn(),
}));

const pool = require("../config/db");
const Todo = require("../models/todoModel");

const databaseRow = {
  id: 3,
  task: "Read a book",
  isCompleted: 1,
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Todo model", () => {
  test("getTodos retrieves and formats all rows", async () => {
    pool.execute.mockResolvedValue([[databaseRow]]);

    await expect(Todo.getTodos()).resolves.toEqual([
      {
        _id: 3,
        task: "Read a book",
        isCompleted: true,
        createdAt: databaseRow.createdAt,
        updatedAt: databaseRow.updatedAt,
      },
    ]);
    expect(pool.execute).toHaveBeenCalledWith(
      "SELECT id, task, isCompleted, createdAt, updatedAt FROM todos ORDER BY id ASC"
    );
  });

  test("createTodo inserts and returns the created row", async () => {
    pool.execute
      .mockResolvedValueOnce([{ insertId: 3 }])
      .mockResolvedValueOnce([[databaseRow]]);

    await expect(Todo.createTodo({ task: "Read a book" })).resolves.toEqual({
      _id: 3,
      task: "Read a book",
      isCompleted: true,
      createdAt: databaseRow.createdAt,
      updatedAt: databaseRow.updatedAt,
    });
    expect(pool.execute).toHaveBeenNthCalledWith(
      1,
      "INSERT INTO todos (task, isCompleted) VALUES (?, ?)",
      ["Read a book", false]
    );
    expect(pool.execute).toHaveBeenNthCalledWith(
      2,
      "SELECT id, task, isCompleted, createdAt, updatedAt FROM todos WHERE id = ?",
      [3]
    );
  });

  test("updateTodo updates provided task and completion fields", async () => {
    pool.execute
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[databaseRow]]);

    await expect(
      Todo.updateTodo(3, { task: "Read two books", isCompleted: true })
    ).resolves.toEqual({
      _id: 3,
      task: "Read a book",
      isCompleted: true,
      createdAt: databaseRow.createdAt,
      updatedAt: databaseRow.updatedAt,
    });
    expect(pool.execute).toHaveBeenNthCalledWith(
      1,
      "UPDATE todos SET task = ?, isCompleted = ? WHERE id = ?",
      ["Read two books", true, 3]
    );
  });

  test("updateTodo supports updating only the task", async () => {
    pool.execute
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[databaseRow]]);

    await Todo.updateTodo(3, { task: "Read two books" });

    expect(pool.execute).toHaveBeenNthCalledWith(
      1,
      "UPDATE todos SET task = ? WHERE id = ?",
      ["Read two books", 3]
    );
  });

  test("updateTodo returns null when no row matches", async () => {
    pool.execute.mockResolvedValueOnce([{}]).mockResolvedValueOnce([[]]);

    await expect(Todo.updateTodo(99, { isCompleted: false })).resolves.toBeNull();
    expect(pool.execute).toHaveBeenNthCalledWith(
      1,
      "UPDATE todos SET isCompleted = ? WHERE id = ?",
      [false, 99]
    );
  });

  test("deleteTodo returns null without deleting a missing row", async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    await expect(Todo.deleteTodo(99)).resolves.toBeNull();
    expect(pool.execute).toHaveBeenCalledTimes(1);
    expect(pool.execute).toHaveBeenCalledWith(
      "SELECT id, task, isCompleted, createdAt, updatedAt FROM todos WHERE id = ?",
      [99]
    );
  });

  test("deleteTodo deletes and returns an existing row", async () => {
    pool.execute
      .mockResolvedValueOnce([[databaseRow]])
      .mockResolvedValueOnce([{}]);

    await expect(Todo.deleteTodo(3)).resolves.toMatchObject({
      _id: 3,
      task: "Read a book",
      isCompleted: true,
    });
    expect(pool.execute).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM todos WHERE id = ?",
      [3]
    );
  });
});
