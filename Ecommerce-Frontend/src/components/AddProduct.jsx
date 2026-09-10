import React, { useEffect, useState } from "react";
import axios from "../axios";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
    category: "",
    stockQuantity: "",
    releaseDate: "",
    productAvailable: false,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const resetForm = () => {
    setProduct({
      name: "",
      brand: "",
      description: "",
      price: "",
      category: "",
      stockQuantity: "",
      releaseDate: "",
      productAvailable: false,
    });
    setImage(null);
    setImagePreview("");
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    const formData = new FormData();
    formData.append("imageFile", image);
    formData.append(
      "product",
      new Blob([JSON.stringify(product)], { type: "application/json" })
    );

    axios
      .post("/product", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setSubmitMessage("Product added successfully.");
        resetForm();
        navigate("/");
      })
      .catch((error) => {
        console.error("Error adding product:", error);
        setSubmitMessage("Failed to add product. Please try again.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="add-product-page">
      <div className="add-product-shell">
        <section className="add-product-hero">
          <p className="add-product-kicker">Catalog Manager</p>
          <h1>Create a new product</h1>
          <p className="add-product-copy">
            Add a product with image, stock, category and availability in one clean step.
          </p>

          <div className="add-product-points">
            <div>
              <strong>Fast upload</strong>
              <span>Send image and metadata together</span>
            </div>
            <div>
              <strong>Store-ready</strong>
              <span>Matches the current ecommerce data model</span>
            </div>
            <div>
              <strong>Clear status</strong>
              <span>Instant feedback after submit</span>
            </div>
          </div>

          <div className="add-product-preview-card">
            <div className="add-product-preview-image">
              {imagePreview ? (
                <img src={imagePreview} alt="Product preview" />
              ) : (
                <div>
                  <span>Preview</span>
                  <p>Upload an image to see it here</p>
                </div>
              )}
            </div>
            <div className="add-product-preview-meta">
              <span>{product.category || "Uncategorized"}</span>
              <strong>{product.name || "Product name"}</strong>
              <small>{product.brand || "Brand"}</small>
            </div>
          </div>
        </section>

        <section className="add-product-form-card">
          <div className="add-product-form-header">
            <div>
              <h2>Product details</h2>
              <p>Fill in the fields below and publish to the catalog.</p>
            </div>
            <button type="button" className="add-product-secondary" onClick={() => navigate("/")}>
              Back to products
            </button>
          </div>

          {submitMessage && <div className="add-product-alert">{submitMessage}</div>}

          <form className="add-product-form" onSubmit={submitHandler}>
            <div className="form-grid two-col">
              <label className="field-card">
                <span>Name</span>
                <input
                  type="text"
                  placeholder="Product name"
                  onChange={handleInputChange}
                  value={product.name}
                  name="name"
                  required
                />
              </label>

              <label className="field-card">
                <span>Brand</span>
                <input
                  type="text"
                  name="brand"
                  placeholder="Brand name"
                  value={product.brand}
                  onChange={handleInputChange}
                  required
                />
              </label>
            </div>

            <label className="field-card">
              <span>Description</span>
              <textarea
                rows="4"
                placeholder="Short product description"
                value={product.description}
                name="description"
                onChange={handleInputChange}
                required
              />
            </label>

            <div className="form-grid three-col">
              <label className="field-card">
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  onChange={handleInputChange}
                  value={product.price}
                  name="price"
                  required
                />
              </label>

              <label className="field-card">
                <span>Category</span>
                <select
                  value={product.category}
                  onChange={handleInputChange}
                  name="category"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Laptop">Laptop</option>
                  <option value="VR">VR</option>
                </select>
              </label>

              <label className="field-card">
                <span>Stock Quantity</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Available stock"
                  onChange={handleInputChange}
                  value={product.stockQuantity}
                  name="stockQuantity"
                  required
                />
              </label>
            </div>

            <div className="form-grid two-col">
              <label className="field-card">
                <span>Release Date</span>
                <input
                  type="date"
                  value={product.releaseDate}
                  name="releaseDate"
                  onChange={handleInputChange}
                />
              </label>

              <label className="field-card file-field">
                <span>Image</span>
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>

            <label className="availability-card">
              <input
                type="checkbox"
                name="productAvailable"
                checked={product.productAvailable}
                onChange={(e) =>
                  setProduct({ ...product, productAvailable: e.target.checked })
                }
              />
              <div>
                <strong>Product available</strong>
                <p>Show this product on the storefront immediately.</p>
              </div>
            </label>

            <div className="action-row">
              <button type="button" className="add-product-secondary" onClick={resetForm}>
                Clear form
              </button>
              <button type="submit" className="add-product-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Create product"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AddProduct;
