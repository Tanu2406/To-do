process.env.CLIENT_ORIGIN = "https://todo.example";

const request = require("supertest");
const app = require("../app");

describe("Prometheus metrics", () => {
  test("exposes request, error, and duration metrics without tracking scrapes", async () => {
    await request(app).get("/api/health");
    const response = await request(app).get("/metrics");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/plain/);
    expect(response.text).toContain("# HELP http_requests_total");
    expect(response.text).toContain("# HELP http_request_errors_total");
    expect(response.text).toContain("# HELP http_request_duration_seconds");
    expect(response.text).toMatch(/route="\/api\/health"/);
    expect(response.text).not.toMatch(/route="\/metrics"/);
  });

  test("counts HTTP error responses", async () => {
    await request(app).get("/not-a-route");
    const response = await request(app).get("/metrics");

    expect(response.text).toMatch(
      /http_request_errors_total\{[^}]*route="unmatched"[^}]*status_code="404"[^}]*\} [1-9]/
    );
  });
});
