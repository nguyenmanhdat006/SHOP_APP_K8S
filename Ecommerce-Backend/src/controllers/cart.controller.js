import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../services/cart.service.js";

export const getCurrentCart = async (req, res, next) => {
  try {
    res.json(await getCart(req.user.id));
  } catch (error) {
    next(error);
  }
};

export const addItem = async (req, res, next) => {
  try {
    res.json(await addCartItem(req.user.id, req.body.productId, req.body.quantity));
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    res.json(await removeCartItem(req.user.id, req.params.productId));
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    res.json(await updateCartItem(req.user.id, req.params.productId, req.body.quantity));
  } catch (error) {
    next(error);
  }
};
