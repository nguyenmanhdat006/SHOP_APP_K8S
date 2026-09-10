import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || true,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
