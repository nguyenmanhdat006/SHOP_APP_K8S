import prisma from "../config/prisma.js";
import { ProductEntity } from "../entities/index.js";
import { auditContext, logAudit } from "./audit.service.js";

const parseProductPayload = (payloadSource) => {
  const productFile = payloadSource?.files?.product?.[0];
  const rawProduct =
    payloadSource?.body?.product ??
    productFile?.buffer?.toString("utf8") ??
    productFile?.toString?.();

  if (!rawProduct) {
    throw Object.assign(new Error("Product payload is required"), {
      statusCode: 400,
    });
  }

  if (typeof rawProduct === "object") {
    return rawProduct;
  }

  try {
    return JSON.parse(rawProduct);
  } catch {
    throw Object.assign(new Error("Invalid product payload"), {
      statusCode: 400,
    });
  }
};

const toProductResponse = (p) => {
  if (!p) return p;
  return new ProductEntity(p).toJSON();
};

const buildImageData = (file) => {
  if (!file) {
    return {};
  }

  return {
    image_name: file.originalname,
    image_type: file.mimetype,
    image_data: file.buffer,
  };
};

export const listProducts = async () => {
  const products = await prisma.products.findMany({
    orderBy: { created_at: "desc" },
  });

  return products.map(toProductResponse);
};

export const searchProducts = async (keyword) => {
  const normalizedKeyword = String(keyword || "").trim();

  if (!normalizedKeyword) {
    return [];
  }

  const products = await prisma.products.findMany({
    where: {
      OR: [
        { name: { contains: normalizedKeyword, mode: "insensitive" } },
        { brand: { contains: normalizedKeyword, mode: "insensitive" } },
        { description: { contains: normalizedKeyword, mode: "insensitive" } },
        { category: { contains: normalizedKeyword, mode: "insensitive" } },
      ],
    },
    orderBy: { created_at: "desc" },
  });

  return products.map(toProductResponse);
};

export const getProductById = async (id) => {
  const product = await prisma.products.findUnique({ where: { id } });

  if (!product) {
    throw Object.assign(new Error("Product not found"), { statusCode: 404 });
  }

  return toProductResponse(product);
};

export const getProductImage = async (id) => {
  const product = await prisma.products.findUnique({
    where: { id },
    select: { image_data: true, image_type: true, image_name: true },
  });

  if (!product || !product.image_data) {
    throw Object.assign(new Error("Image not found"), { statusCode: 404 });
  }

  return {
    imageData: product.image_data,
    imageType: product.image_type,
    imageName: product.image_name,
  };
};

export const createProduct = async (payloadSource) => {
  const payload = parseProductPayload(payloadSource);
  const imageFile = payloadSource?.files?.imageFile?.[0] || payloadSource?.file;

  const createdProduct = await prisma.products.create({
    data: {
      name: payload.name,
      brand: payload.brand,
      description: payload.description,
      price: payload.price,
      category: payload.category,
      stock_quantity: Number(payload.stockQuantity ?? 0),
      release_date: payload.releaseDate ? new Date(payload.releaseDate) : null,
      product_available:
        payload.productAvailable === true ||
        payload.productAvailable === "true",
      ...buildImageData(imageFile),
    },
  });

  await logAudit({
    ...auditContext(payloadSource),
    action: "product.create",
    targetType: "product",
    targetId: createdProduct.id,
    detail: { name: createdProduct.name },
  });

  return toProductResponse(createdProduct);
};

export const updateProduct = async (id, payloadSource) => {
  const payload = parseProductPayload(payloadSource);
  const imageFile = payloadSource?.files?.imageFile?.[0] || payloadSource?.file;

  const existingProduct = await prisma.products.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw Object.assign(new Error("Product not found"), { statusCode: 404 });
  }

  const updatedProduct = await prisma.products.update({
    where: { id },
    data: {
      name: payload.name ?? existingProduct.name,
      brand: payload.brand ?? existingProduct.brand,
      description: payload.description ?? existingProduct.description,
      price: payload.price ?? existingProduct.price,
      category: payload.category ?? existingProduct.category,
      stock_quantity:
        payload.stockQuantity !== undefined
          ? Number(payload.stockQuantity)
          : existingProduct.stock_quantity,
      release_date: payload.releaseDate
        ? new Date(payload.releaseDate)
        : existingProduct.release_date,
      product_available:
        payload.productAvailable !== undefined
          ? payload.productAvailable === true ||
            payload.productAvailable === "true"
          : existingProduct.product_available,
      ...(imageFile ? buildImageData(imageFile) : {}),
    },
  });

  const oldPrice = Number(existingProduct.price);
  const newPrice = Number(updatedProduct.price);
  const oldStock = existingProduct.stock_quantity;
  const newStock = updatedProduct.stock_quantity;
  const oldAvailability = existingProduct.product_available;
  const newAvailability = updatedProduct.product_available;

  if (oldPrice !== newPrice) {
    await logAudit({
      ...auditContext(payloadSource),
      action: "product.price_change",
      targetType: "product",
      targetId: id,
      detail: { oldPrice, newPrice },
    });
  }

  if (oldStock !== newStock) {
    await logAudit({
      ...auditContext(payloadSource),
      action: "product.inventory_change",
      targetType: "product",
      targetId: id,
      detail: { oldStock, newStock },
    });
  }

  if (oldAvailability !== newAvailability) {
    await logAudit({
      ...auditContext(payloadSource),
      action: "product.availability_change",
      targetType: "product",
      targetId: id,
      detail: { oldAvailability, newAvailability },
    });
  }

  if (imageFile) {
    await logAudit({
      ...auditContext(payloadSource),
      action: "product.image_change",
      targetType: "product",
      targetId: id,
      detail: { imageName: imageFile.originalname, imageType: imageFile.mimetype },
    });
  }

  const changedFields = ["name", "brand", "description", "category"]
    .filter((field) => existingProduct[field] !== updatedProduct[field]);
  if (existingProduct.release_date?.getTime() !== updatedProduct.release_date?.getTime()) {
    changedFields.push("release_date");
  }
  if (changedFields.length > 0) {
    await logAudit({
      ...auditContext(payloadSource),
      action: "product.update",
      targetType: "product",
      targetId: id,
      detail: { changedFields },
    });
  }

  return toProductResponse(updatedProduct);
};

export const deleteProduct = async (id, req) => {
  await prisma.products.delete({ where: { id } });

  await logAudit({
    ...auditContext(req),
    action: "product.delete",
    targetType: "product",
    targetId: id,
  });
};

export const purchaseProduct = async (id, quantity, req) => {
  const requestedQuantity = Number(quantity);
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    throw Object.assign(new Error("Quantity must be a positive integer"), {
      statusCode: 400,
    });
  }

  const updated = await prisma.products.updateMany({
    where: {
      id,
      stock_quantity: { gte: requestedQuantity },
      product_available: true,
    },
    data: {
      stock_quantity: { decrement: requestedQuantity },
    },
  });

  if (updated.count === 0) {
    throw Object.assign(new Error("Product is unavailable or out of stock"), {
      statusCode: 409,
    });
  }

  const product = await prisma.products.findUnique({ where: { id } });

  await logAudit({
    ...auditContext(req),
    action: "product.direct_purchase",
    targetType: "product",
    targetId: id,
    detail: { quantity: requestedQuantity },
  });

  return toProductResponse(product);
};
