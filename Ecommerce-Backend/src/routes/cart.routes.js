import { Router } from "express";
import { addItem, getCurrentCart, removeItem, updateItem } from "../controllers/cart.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/cart", getCurrentCart);
router.post("/cart/items", addItem);
router.patch("/cart/items/:productId", updateItem);
router.delete("/cart/items/:productId", removeItem);

export default router;
