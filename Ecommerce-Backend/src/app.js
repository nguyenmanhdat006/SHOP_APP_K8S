import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { requestIdMiddleware } from "./middlewares/requestId.middleware.js";
import { metricsMiddleware } from "./middlewares/metrics.middleware.js";
import { register } from "./config/metrics.js";
import prisma from "./config/prisma.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || true,
    credentials: true,
  }),
);
app.use(express.json());

app.use(requestIdMiddleware);
app.use(metricsMiddleware);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);

app.get("/metrics", async (req, res, next) => {
  try {
    const appMetrics = await register.metrics();
    let prismaMetrics = "";

    if (prisma.$metrics?.prometheus) {
      try {
        prismaMetrics = await prisma.$metrics.prometheus();
      } catch (error) {
        console.warn({ requestId: req.requestId, message: "Prisma metrics unavailable", error: error.message });
      }
    }

    res.set("Content-Type", register.contentType);
    res.end(appMetrics + prismaMetrics);
  } catch (error) {
    next(error);
  }
});

app.use(notFound);
app.use(errorHandler);

export default app;
