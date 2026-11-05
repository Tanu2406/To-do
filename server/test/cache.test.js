const store = new Map();
const client = {
  isReady: true,
  on: jest.fn(),
  get: jest.fn(async (key) => store.get(key) ?? null),
  set: jest.fn(async (key, value) => {
    store.set(key, value);
    return "OK";
  }),
  del: jest.fn(async (key) => store.delete(key)),
};

jest.mock("redis", () => ({
  createClient: () => client,
}));

const cache = require("../config/cache");

describe("task Redis cache", () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  test("uses a separate key for each authenticated user", () => {
    expect(cache.tasksCacheKey("user-a")).toBe("tasks:user:user-a");
    expect(cache.tasksCacheKey("user-b")).toBe("tasks:user:user-b");
    expect(cache.tasksCacheKey("user-a")).not.toBe(cache.tasksCacheKey("user-b"));
  });

  test("serializes and deserializes task lists", async () => {
    const tasks = [{ _id: "1", task: "Cached task", isCompleted: false }];
    await cache.setCachedTasks("user-a", tasks, 60);

    await expect(cache.getCachedTasks("user-a")).resolves.toEqual(tasks);
    expect(client.set).toHaveBeenCalledWith(
      "tasks:user:user-a",
      JSON.stringify(tasks),
      { EX: 60 }
    );
  });

  test("keeps cached task lists isolated between users", async () => {
    await cache.setCachedTasks("user-a", [{ task: "A" }], 60);
    await cache.setCachedTasks("user-b", [{ task: "B" }], 60);

    await expect(cache.getCachedTasks("user-a")).resolves.toEqual([{ task: "A" }]);
    await expect(cache.getCachedTasks("user-b")).resolves.toEqual([{ task: "B" }]);
  });

  test("invalidates only the requested user's cache", async () => {
    await cache.setCachedTasks("user-a", [{ task: "A" }], 60);
    await cache.setCachedTasks("user-b", [{ task: "B" }], 60);
    await cache.invalidateTasksCache("user-a");

    await expect(cache.getCachedTasks("user-a")).resolves.toBeNull();
    await expect(cache.getCachedTasks("user-b")).resolves.toEqual([{ task: "B" }]);
  });
});
