import prisma from "../config/prisma.js";
import { clearCart } from "./cart.service.js";

export const createOrderFromCart = async (userId, shipping = {}) => {
  return prisma.$transaction(async (transaction) => {
    const cart = await transaction.carts.findUnique({
      where: { user_id: userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw Object.assign(new Error("Your cart is empty"), { statusCode: 400 });
    }

    const total = cart.items.reduce(
      (sum, item) => sum + Number(item.unit_price) * item.quantity,
      0,
    );

    for (const item of cart.items) {
      const updated = await transaction.products.updateMany({
        where: {
          id: item.product_id,
          product_available: true,
          stock_quantity: { gte: item.quantity },
        },
        data: { stock_quantity: { decrement: item.quantity } },
      });

      if (updated.count === 0) {
        throw Object.assign(new Error(`${item.product.name} is out of stock`), { statusCode: 409 });
      }
    }

    const order = await transaction.orders.create({
      data: {
        user_id: userId,
        status: "CONFIRMED",
        total_amount: total,
        shipping_name: shipping.name || "Customer",
        shipping_email: shipping.email || "",
        shipping_address: shipping.address || "Not provided",
        items: {
          create: cart.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        },
      },
      include: { items: true },
    });

    await clearCart(userId, transaction);
    return order;
  });
};

export const listOrders = async (userId) => {
  return prisma.orders.findMany({
    where: { user_id: userId },
    include: { items: true },
    orderBy: { created_at: "desc" },
  });
};
