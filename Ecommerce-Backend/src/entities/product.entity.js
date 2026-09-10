import { BaseEntity } from "./base.entity.js";

export class ProductEntity extends BaseEntity {
  static tableName = "products";

  constructor(data = {}) {
    super({
      id: data.id,
      name: data.name,
      brand: data.brand,
      description: data.description,
      price: Number(data.price ?? 0),
      category: data.category,
      stockQuantity: data.stockQuantity ?? data.stock_quantity ?? 0,
      releaseDate: data.releaseDate ?? data.release_date ?? null,
      productAvailable: data.productAvailable ?? data.product_available ?? true,
      ownerId: data.ownerId ?? data.owner_id ?? null,
      imageName: data.imageName ?? data.image_name ?? null,
      imageType: data.imageType ?? data.image_type ?? null,
      imageData: data.imageData ?? data.image_data ?? null,
      createdAt: data.createdAt ?? data.created_at ?? null,
      updatedAt: data.updatedAt ?? data.updated_at ?? null,
    });
  }
}
