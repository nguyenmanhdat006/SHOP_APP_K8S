import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../services/cart.service.js";
import { auditContext, logAudit } from "../services/audit.service.js";

export const getCurrentCart = async (req, res, next) => {
  try {
    res.json(await getCart(req.user.id));
  } catch (error) {
    next(error);
  }
};

export const addItem = async (req, res, next) => {
  try {
    const result = await addCartItem(req.user.id, req.body.productId, req.body.quantity);
    await logAudit({
      ...auditContext(req),
      action: "cart.item_add",
      targetType: "cart_item",
      targetId: req.body.productId,
      detail: { quantity: Number(req.body.quantity || 1) },
    });
    res.json(result);
  } catch (error) {
    await logAudit({
      ...auditContext(req),
      action: "cart.item_add",
      targetType: "cart_item",
      targetId: req.body.productId,
      result: "failure",
      detail: { reason: error.auditReason || "operation_failed" },
    });
    next(error);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    const result = await removeCartItem(req.user.id, req.params.productId);
    await logAudit({
      ...auditContext(req),
      action: "cart.item_remove",
      targetType: "cart_item",
      targetId: req.params.productId,
    });
    res.json(result);
  } catch (error) {
    await logAudit({
      ...auditContext(req),
      action: "cart.item_remove",
      targetType: "cart_item",
      targetId: req.params.productId,
      result: "failure",
      detail: { reason: error.auditReason || "operation_failed" },
    });
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const result = await updateCartItem(req.user.id, req.params.productId, req.body.quantity);
    await logAudit({
      ...auditContext(req),
      action: "cart.item_update",
      targetType: "cart_item",
      targetId: req.params.productId,
      detail: { quantity: Number(req.body.quantity) },
    });
    res.json(result);
  } catch (error) {
    await logAudit({
      ...auditContext(req),
      action: "cart.item_update",
      targetType: "cart_item",
      targetId: req.params.productId,
      result: "failure",
      detail: { reason: error.auditReason || "operation_failed" },
    });
    next(error);
  }
};
