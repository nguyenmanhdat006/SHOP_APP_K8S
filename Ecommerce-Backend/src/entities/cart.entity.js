import { BaseEntity } from "./base.entity.js";

export class CartEntity extends BaseEntity {
  static tableName = "carts";

  constructor(data = {}) {
    super({
      id: data.id,
      userId: data.userId ?? data.user_id,
      createdAt: data.createdAt ?? data.created_at ?? null,
      updatedAt: data.updatedAt ?? data.updated_at ?? null,
      items: data.items || [],
    });
  }
}

export class CartItemEntity extends BaseEntity {
  static tableName = "cart_items";

  constructor(data = {}) {
    super({
      id: data.id,
      cartId: data.cartId ?? data.cart_id,
      productId: data.productId ?? data.product_id,
      quantity: data.quantity ?? 1,
      unitPrice: Number(data.unitPrice ?? data.unit_price ?? 0),
      createdAt: data.createdAt ?? data.created_at ?? null,
      updatedAt: data.updatedAt ?? data.updated_at ?? null,
    });
  }
}
