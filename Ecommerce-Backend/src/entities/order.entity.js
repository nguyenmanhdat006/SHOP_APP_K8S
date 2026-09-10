import { BaseEntity } from "./base.entity.js";

export class OrderEntity extends BaseEntity {
  static tableName = "orders";

  constructor(data = {}) {
    super({
      id: data.id,
      userId: data.userId ?? data.user_id,
      status: data.status || "PENDING",
      totalAmount: Number(data.totalAmount ?? data.total_amount ?? 0),
      shippingName: data.shippingName ?? data.shipping_name,
      shippingEmail: data.shippingEmail ?? data.shipping_email,
      shippingAddress: data.shippingAddress ?? data.shipping_address,
      createdAt: data.createdAt ?? data.created_at ?? null,
      updatedAt: data.updatedAt ?? data.updated_at ?? null,
      items: data.items || [],
    });
  }
}

export class OrderItemEntity extends BaseEntity {
  static tableName = "order_items";

  constructor(data = {}) {
    super({
      id: data.id,
      orderId: data.orderId ?? data.order_id,
      productId: data.productId ?? data.product_id,
      productName: data.productName ?? data.product_name,
      quantity: data.quantity ?? 1,
      unitPrice: Number(data.unitPrice ?? data.unit_price ?? 0),
    });
  }
}
