import prisma from "../config/prisma.js";

const toCartItem = (item) => ({
  id: item.product.id,
  name: item.product.name,
  brand: item.product.brand,
  description: item.product.description,
  price: Number(item.unit_price),
  category: item.product.category,
  stockQuantity: item.product.stock_quantity,
  productAvailable: item.product.product_available,
  quantity: item.quantity,
});

const getOrCreateCart = async (userId, client = prisma) => {
  return client.carts.upsert({
    where: { user_id: userId },
    update: {},
    create: { user_id: userId },
  });
};

export const getCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  const fullCart = await prisma.carts.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true }, orderBy: { created_at: "asc" } } },
  });

  return { id: fullCart.id, items: fullCart.items.map(toCartItem) };
};

export const addCartItem = async (userId, productId, quantity = 1) => {
  const requestedQuantity = Number(quantity);
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    throw Object.assign(new Error("Quantity must be a positive integer"), { statusCode: 400 });
  }

  const product = await prisma.products.findUnique({ where: { id: Number(productId) } });
  if (!product || !product.product_available) {
    throw Object.assign(new Error("Product is unavailable"), { statusCode: 404 });
  }

  const cart = await getOrCreateCart(userId);
  const existing = await prisma.cart_items.findUnique({
    where: { cart_id_product_id: { cart_id: cart.id, product_id: product.id } },
  });
  const nextQuantity = (existing?.quantity || 0) + requestedQuantity;

  if (nextQuantity > product.stock_quantity) {
    throw Object.assign(new Error("Quantity exceeds available stock"), { statusCode: 409 });
  }

  await prisma.cart_items.upsert({
    where: { cart_id_product_id: { cart_id: cart.id, product_id: product.id } },
    update: { quantity: nextQuantity, unit_price: product.price },
    create: { cart_id: cart.id, product_id: product.id, quantity: requestedQuantity, unit_price: product.price },
  });

  return getCart(userId);
};

export const removeCartItem = async (userId, productId) => {
  const cart = await getOrCreateCart(userId);
  await prisma.cart_items.deleteMany({ where: { cart_id: cart.id, product_id: Number(productId) } });
  return getCart(userId);
};

export const updateCartItem = async (userId, productId, quantity) => {
  const nextQuantity = Number(quantity);
  if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
    throw Object.assign(new Error("Quantity must be a positive integer"), { statusCode: 400 });
  }

  const cart = await getOrCreateCart(userId);
  const product = await prisma.products.findUnique({ where: { id: Number(productId) } });
  if (!product || nextQuantity > product.stock_quantity) {
    throw Object.assign(new Error("Quantity exceeds available stock"), { statusCode: 409 });
  }

  await prisma.cart_items.update({
    where: { cart_id_product_id: { cart_id: cart.id, product_id: Number(productId) } },
    data: { quantity: nextQuantity, unit_price: product.price },
  });
  return getCart(userId);
};

export const clearCart = async (userId, client = prisma) => {
  const cart = await getOrCreateCart(userId, client);
  await client.cart_items.deleteMany({ where: { cart_id: cart.id } });
};
