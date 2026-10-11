const dotenvFlow = require("dotenv-flow");
dotenvFlow.config();

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { randomUUID } = require("node:crypto");
const app = require("../app");
const pool = require("../config/db");

let server;
let baseUrl;

before(async () => {
  await pool.query("SELECT 1");
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await pool.end();
});

test("todos API persists create, read, update, and delete operations", async () => {
  const listResponse = await fetch(`${baseUrl}/get`);
  assert.equal(listResponse.status, 200);
  assert.ok(Array.isArray(await listResponse.json()));

  const uniqueTask = `API integration test ${randomUUID()}`;
  const createResponse = await fetch(`${baseUrl}/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: uniqueTask }),
  });
  let createdId;
  try {
    assert.equal(createResponse.status, 201);
    const { newList } = await createResponse.json();
    createdId = newList?._id;
    assert.ok(createdId);
    assert.equal(newList.task, uniqueTask);
    assert.equal(newList.isCompleted, false);

    const persistedResponse = await fetch(`${baseUrl}/get`);
    const persistedTodos = await persistedResponse.json();
    assert.ok(persistedTodos.some((todo) => todo._id === createdId));

    const updateResponse = await fetch(`${baseUrl}/update/${createdId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: `${uniqueTask} updated`,
        isCompleted: true,
      }),
    });
    assert.equal(updateResponse.status, 200);
    const { updated } = await updateResponse.json();
    assert.equal(updated.task, `${uniqueTask} updated`);
    assert.equal(updated.isCompleted, true);

    const verifyUpdateResponse = await fetch(`${baseUrl}/get`);
    const updatedTodos = await verifyUpdateResponse.json();
    assert.ok(
      updatedTodos.some(
        (todo) =>
          todo._id === createdId &&
          todo.task === `${uniqueTask} updated` &&
          todo.isCompleted
      )
    );

    const deleteResponse = await fetch(`${baseUrl}/delete/${createdId}`, {
      method: "DELETE",
    });
    assert.equal(deleteResponse.status, 200);

    const verifyDeleteResponse = await fetch(`${baseUrl}/get`);
    const remainingTodos = await verifyDeleteResponse.json();
    assert.ok(remainingTodos.every((todo) => todo._id !== createdId));
  } finally {
    if (createdId) {
      await pool.execute("DELETE FROM todos WHERE id = ?", [createdId]);
    }
  }
});

test("todos API rejects invalid input and missing records", async () => {
  const invalidCreate = await fetch(`${baseUrl}/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: "  " }),
  });
  assert.equal(invalidCreate.status, 400);

  const invalidUpdate = await fetch(`${baseUrl}/update/not-an-id`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isCompleted: "yes" }),
  });
  assert.equal(invalidUpdate.status, 400);

  const invalidFields = await fetch(`${baseUrl}/update/1`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isCompleted: "yes" }),
  });
  assert.equal(invalidFields.status, 400);

  const missingDelete = await fetch(`${baseUrl}/delete/4294967295`, {
    method: "DELETE",
  });
  assert.equal(missingDelete.status, 404);
});
