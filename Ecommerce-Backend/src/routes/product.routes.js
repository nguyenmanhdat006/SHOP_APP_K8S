import { Router } from "express";
import multer from "multer";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductImage,
  searchProducts,
  purchaseProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import { requireAuth, requireRole, ROLES } from "../middlewares/auth.middleware.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/products", getAllProducts);
router.get("/products/search", searchProducts);
router.get("/product/:id", getProductById);
router.get("/product/:id/image", getProductImage);
router.post(
  "/product",
  requireAuth,
  requireRole(ROLES.SHOP_OWNER, ROLES.ADMIN),
  upload.fields([
    { name: "imageFile", maxCount: 1 },
    { name: "product", maxCount: 1 },
  ]),
  createProduct,
);
router.put(
  "/product/:id",
  requireAuth,
  requireRole(ROLES.SHOP_OWNER, ROLES.ADMIN),
  upload.fields([
    { name: "imageFile", maxCount: 1 },
    { name: "product", maxCount: 1 },
  ]),
  updateProduct,
);
router.post(
  "/product/:id/purchase",
  requireAuth,
  requireRole(ROLES.CUSTOMER, ROLES.SHOP_OWNER, ROLES.ADMIN),
  purchaseProduct,
);
router.delete("/product/:id", requireAuth, requireRole(ROLES.SHOP_OWNER, ROLES.ADMIN), deleteProduct);

export default router;
