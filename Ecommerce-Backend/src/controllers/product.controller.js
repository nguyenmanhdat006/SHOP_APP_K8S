import {
  createProduct as createProductService,
  deleteProduct as deleteProductService,
  getProductById as getProductByIdService,
  getProductImage as getProductImageService,
  listProducts,
  purchaseProduct as purchaseProductService,
  searchProducts as searchProductsService,
  updateProduct as updateProductService,
} from "../services/product.service.js";
import { auditContext, logAudit } from "../services/audit.service.js";

const auditFailure = async (req, action, error, targetId = null) => {
  await logAudit({
    ...auditContext(req),
    action,
    targetType: targetId ? "product" : null,
    targetId,
    result: "failure",
    detail: { reason: error.auditReason || "operation_failed" },
  });
};

export const getAllProducts = async (req, res, next) => {
  try {
    const products = await listProducts();
    res.json(products);
  } catch (error) {
    await auditFailure(req, "product.create", error);
    next(error);
  }
};

export const searchProducts = async (req, res, next) => {
  try {
    const products = await searchProductsService(req.query.keyword);
    res.json(products);
  } catch (error) {
    await auditFailure(req, "product.update", error, req.params.id);
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await getProductByIdService(Number(req.params.id));
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const getProductImage = async (req, res, next) => {
  try {
    const product = await getProductImageService(Number(req.params.id));

    res.setHeader(
      "Content-Type",
      product.imageType || "application/octet-stream",
    );
    if (product.imageName) {
      res.setHeader(
        "Content-Disposition",
        `inline; filename=\"${product.imageName}\"`,
      );
    }

    res.send(Buffer.from(product.imageData));
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const createdProduct = await createProductService(req);
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const updatedProduct = await updateProductService(
      Number(req.params.id),
      req,
    );
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await deleteProductService(Number(req.params.id), req);

    res.status(204).send();
  } catch (error) {
    await auditFailure(req, "product.delete", error, req.params.id);
    next(error);
  }
};

export const purchaseProduct = async (req, res, next) => {
  try {
    const product = await purchaseProductService(
      Number(req.params.id),
      req.body.quantity,
      req,
    );
    res.json(product);
  } catch (error) {
    await auditFailure(req, "product.direct_purchase", error, req.params.id);
    next(error);
  }
};
