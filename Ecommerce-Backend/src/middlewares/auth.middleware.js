import jwt from "jsonwebtoken";
import { authTokenInvalidTotal } from "../config/metrics.js";
import { auditContext, logAudit } from "../services/audit.service.js";

export const ROLES = Object.freeze({
  CUSTOMER: "CUSTOMER",
  SHOP_OWNER: "SHOP_OWNER",
  ADMIN: "ADMIN",
});

export const normalizeRole = (role) => {
  if (role === ROLES.ADMIN) return ROLES.ADMIN;
  if (role === ROLES.SHOP_OWNER) return ROLES.SHOP_OWNER;
  return ROLES.CUSTOMER;
};

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    authTokenInvalidTotal.inc({ reason: "token_malformed" });
    await logAudit({
      ...auditContext(req),
      action: "security.invalid_token",
      result: "failure",
      detail: { reason: "token_malformed" },
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key",
    );
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: normalizeRole(payload.role),
    };
    next();
  } catch (error) {
    const reason = error.name === "TokenExpiredError" ? "token_expired" : "token_malformed";
    authTokenInvalidTotal.inc({ reason });
    await logAudit({
      ...auditContext(req),
      action: "security.invalid_token",
      result: "failure",
      detail: { reason },
    });
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...allowedRoles) => async (req, res, next) => {
  if (!req.user || !allowedRoles.includes(normalizeRole(req.user.role))) {
    await logAudit({
      ...auditContext(req),
      action: "security.access_denied",
      result: "failure",
      detail: { requiredRoles: allowedRoles },
    });
    return res.status(403).json({ message: "You do not have permission for this action" });
  }

  next();
};
