import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";
import type { Request, Response, NextFunction } from "express";

export const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry });

const requestLabels = ["method", "route", "status_code"];

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of completed HTTP requests.",
  labelNames: requestLabels,
  registers: [metricsRegistry],
});

export const httpRequestErrorsTotal = new Counter({
  name: "http_request_errors_total",
  help: "Total number of completed HTTP requests with 4xx or 5xx status codes.",
  labelNames: requestLabels,
  registers: [metricsRegistry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of completed HTTP requests in seconds.",
  labelNames: requestLabels,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export function trackHttpRequests(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.once("finish", () => {
    const routePath = req.route?.path;
    const route =
      typeof routePath === "string"
        ? `${req.baseUrl}${routePath}` || "/"
        : "unmatched";
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    if (res.statusCode >= 400) {
      httpRequestErrorsTotal.inc(labels);
    }
    httpRequestDurationSeconds.observe(
      labels,
      Number(process.hrtime.bigint() - startedAt) / 1e9
    );
  });

  next();
}
