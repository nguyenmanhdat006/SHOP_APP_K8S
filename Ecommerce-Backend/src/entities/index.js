export { BaseEntity } from "./base.entity.js";
export { UserEntity } from "./user.entity.js";
export { RoleEntity } from "./role.entity.js";
export { ProductEntity } from "./product.entity.js";
export { CartEntity, CartItemEntity } from "./cart.entity.js";
export { OrderEntity, OrderItemEntity } from "./order.entity.js";

export const entityTableMap = Object.freeze({
  Role: "roles",
  User: "users",
  Product: "products",
  Cart: "carts",
  CartItem: "cart_items",
  Order: "orders",
  OrderItem: "order_items",
});
