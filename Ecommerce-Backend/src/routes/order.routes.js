import { Router } from "express";
import { checkout, getMyOrders } from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.post("/orders/checkout", checkout);
router.get("/orders", getMyOrders);

export default router;
