import { createOrderFromCart, listOrders } from "../services/order.service.js";
import { auditContext, logAudit } from "../services/audit.service.js";

export const checkout = async (req, res, next) => {
  try {
    res.status(201).json(await createOrderFromCart(req.user.id, req.body, req));
  } catch (error) {
    await logAudit({
      ...auditContext(req),
      action: "order.checkout_failed",
      targetType: "order",
      result: "failure",
      detail: { reason: error.auditReason || "checkout_failed" },
    });
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    res.json(await listOrders(req.user.id));
  } catch (error) {
    next(error);
  }
};
