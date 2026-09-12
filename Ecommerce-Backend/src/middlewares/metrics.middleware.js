import {
  httpRequestDurationSeconds,
  httpRequestsInFlight,
  httpRequestsTotal,
} from "../config/metrics.js";

const excludedPaths = new Set(["/metrics", "/health", "/healthz", "/readyz"]);

export function getRoutePattern(req) {
  if (!req.route) return "unmatched";
  const base = req.baseUrl || "";
  return (base + req.route.path) || "/";
}

export const metricsMiddleware = (req, res, next) => {
  if (excludedPaths.has(req.path)) {
    return next();
  }

  const startedAt = process.hrtime.bigint();
  httpRequestsInFlight.inc();

  res.on("finish", () => {
    httpRequestsInFlight.dec();
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    const route = getRoutePattern(req);
    const method = req.method;
    const status = String(res.statusCode);

    httpRequestsTotal.inc({ method, route, status });
    httpRequestDurationSeconds.observe({ method, route }, durationSeconds);
  });

  next();
};
