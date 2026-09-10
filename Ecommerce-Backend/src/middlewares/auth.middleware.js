import jwt from "jsonwebtoken";

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

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
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
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(normalizeRole(req.user.role))) {
    return res.status(403).json({ message: "You do not have permission for this action" });
  }

  next();
};
