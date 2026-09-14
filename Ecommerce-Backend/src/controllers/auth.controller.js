import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  listUsers,
  updateUserRole,
} from "../services/auth.service.js";
import { auditContext, logAudit } from "../services/audit.service.js";

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body, req);
    res.status(201).json(result);
  } catch (error) {
    await logAudit({
      ...auditContext(req),
      action: "user.register_failed",
      result: "failure",
      detail: { reason: error.auditReason || "internal_error" },
    });
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body, req);
    res.json(result);
  } catch (error) {
    await logAudit({
      ...auditContext(req),
      action: "user.login_failed",
      result: "failure",
      detail: { reason: error.auditReason || "internal_error" },
    });
    next(error);
  }
};

export const logout = async (req, res) => {
  const result = await logoutUser(req);
  res.json(result);
};

export const me = async (req, res) => {
  const result = await getCurrentUser(req.user);
  res.json(result);
};

export const users = async (req, res, next) => {
  try {
    res.json(await listUsers());
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req, res, next) => {
  try {
    res.json(await updateUserRole(Number(req.params.id), req.body.role, req));
  } catch (error) {
    await logAudit({
      ...auditContext(req),
      action: "user.role_change",
      targetType: "user",
      targetId: req.params.id,
      result: "failure",
      detail: { reason: error.auditReason || "internal_error" },
    });
    next(error);
  }
};
