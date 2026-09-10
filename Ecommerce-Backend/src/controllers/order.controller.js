import { createOrderFromCart, listOrders } from "../services/order.service.js";

export const checkout = async (req, res, next) => {
  try {
    res.status(201).json(await createOrderFromCart(req.user.id, req.body));
  } catch (error) {
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
