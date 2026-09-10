import { Router } from "express";
import { changeUserRole, login, logout, me, register, users } from "../controllers/auth.controller.js";
import { requireAuth, requireRole, ROLES } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.get("/users", requireAuth, requireRole(ROLES.ADMIN), users);
router.patch("/users/:id/role", requireAuth, requireRole(ROLES.ADMIN), changeUserRole);

export default router;
