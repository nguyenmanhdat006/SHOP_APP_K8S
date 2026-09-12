import client from "prom-client";

const { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } = client;

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

export const httpRequestDurationSeconds = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestsInFlight = new Gauge({
  name: "http_requests_in_flight",
  help: "Number of HTTP requests currently being handled",
  registers: [register],
});

export const loginFailedTotal = new Counter({
  name: "login_failed_total",
  help: "Total number of failed login attempts",
  labelNames: ["reason"],
  registers: [register],
});

export const authTokenInvalidTotal = new Counter({
  name: "auth_token_invalid_total",
  help: "Total number of invalid authentication tokens",
  labelNames: ["reason"],
  registers: [register],
});
