jest.mock("mongoose", () => ({
  connect: jest.fn(),
  connection: { readyState: 1 },
}));

const mongoose = require("mongoose");
const { connectDatabase } = require("../config/db");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MongoDB connection", () => {
  test("requires a connection string", async () => {
    await expect(connectDatabase("")).rejects.toThrow(
      "MONGODB_URI environment variable is required."
    );
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("connects using the supplied URI and returns the connection", async () => {
    mongoose.connect.mockResolvedValue(mongoose.connection);

    await expect(connectDatabase("mongodb://localhost/todo_app")).resolves.toBe(
      mongoose.connection
    );
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost/todo_app"
    );
  });
});
