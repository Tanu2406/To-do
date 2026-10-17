const { Todo, getTodos, createTodo, updateTodo, deleteTodo } = require("../models/todoModel");

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("Todo model", () => {
  test("schema validates task length, defaults completion, and timestamps", () => {
    const taskPath = Todo.schema.path("task");
    const completionPath = Todo.schema.path("isCompleted");

    expect(taskPath.isRequired).toBe(true);
    expect(taskPath.options.maxlength).toBe(255);
    expect(taskPath.options.trim).toBe(true);
    expect(completionPath.defaultValue).toBe(false);
    expect(Todo.schema.options.timestamps).toBe(true);
  });

  test("getTodos sorts and returns todos", async () => {
    const todos = [{ _id: "507f1f77bcf86cd799439011", task: "Read a book" }];
    const query = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(todos),
    };
    const find = jest.spyOn(Todo, "find").mockReturnValue(query);

    await expect(getTodos()).resolves.toEqual(todos);
    expect(find).toHaveBeenCalledWith();
    expect(query.sort).toHaveBeenCalledWith({ _id: 1 });
  });

  test("createTodo persists and returns the created todo", async () => {
    const todo = {
      _id: "507f1f77bcf86cd799439011",
      task: "Read a book",
      isCompleted: false,
      toObject: jest.fn().mockReturnValue({
        _id: "507f1f77bcf86cd799439011",
        task: "Read a book",
        isCompleted: false,
      }),
    };
    const create = jest.spyOn(Todo, "create").mockResolvedValue(todo);

    await expect(createTodo({ task: "Read a book" })).resolves.toEqual(
      todo.toObject()
    );
    expect(create).toHaveBeenCalledWith({
      task: "Read a book",
      isCompleted: false,
    });
  });

  test("updateTodo applies only validated fields and returns the updated todo", async () => {
    const todo = { _id: "507f1f77bcf86cd799439011", task: "Read two books" };
    const query = {
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(todo),
    };
    const update = jest
      .spyOn(Todo, "findByIdAndUpdate")
      .mockReturnValue(query);

    await expect(
      updateTodo(todo._id, { task: "Read two books" })
    ).resolves.toEqual(todo);
    expect(update).toHaveBeenCalledWith(
      todo._id,
      { task: "Read two books" },
      { new: true, runValidators: true }
    );
  });

  test("updateTodo returns null when the todo does not exist", async () => {
    const query = {
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };
    jest.spyOn(Todo, "findByIdAndUpdate").mockReturnValue(query);

    await expect(
      updateTodo("507f1f77bcf86cd799439011", { isCompleted: true })
    ).resolves.toBeNull();
  });

  test("deleteTodo removes and returns the todo", async () => {
    const todo = { _id: "507f1f77bcf86cd799439011", task: "Read a book" };
    const query = {
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(todo),
    };
    const remove = jest
      .spyOn(Todo, "findByIdAndDelete")
      .mockReturnValue(query);

    await expect(deleteTodo(todo._id)).resolves.toEqual(todo);
    expect(remove).toHaveBeenCalledWith(todo._id);
  });

  test("deleteTodo returns null when the todo does not exist", async () => {
    const query = {
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };
    jest.spyOn(Todo, "findByIdAndDelete").mockReturnValue(query);

    await expect(
      deleteTodo("507f1f77bcf86cd799439011")
    ).resolves.toBeNull();
  });
});
