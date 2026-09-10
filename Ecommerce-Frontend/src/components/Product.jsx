import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import AppContext from "../Context/Context";
import axios from "../axios";

const Product = () => {
  const { id } = useParams();
  const { addToCart, removeFromCart, refreshData } = useContext(AppContext);
  const [product, setProduct] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const navigate = useNavigate();

  const formatPrice = (value) => {
    const n = Number(value ?? 0);
    return `${n.toLocaleString("vi-VN")} VNĐ`;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/product/${id}`);
        setProduct(data);
        if (data.imageName) {
          fetchImage();
        }
      } catch (e) {
        console.error("Error fetching product:", e);
      }
    };

    const fetchImage = async () => {
      try {
        const res = await axios.get(`/product/${id}/image`, {
          responseType: "blob",
        });
        setImageUrl(URL.createObjectURL(res.data));
      } catch (e) {
        console.error("Error fetching image:", e);
      }
    };

    fetchProduct();
  }, [id]);

  const deleteProduct = async () => {
    try {
      await axios.delete(`/product/${id}`);
      removeFromCart(id);
      alert("Product deleted successfully");
      refreshData();
      navigate("/");
    } catch (e) {
      console.error("Error deleting product:", e);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      alert("Product added to cart");
    }
  };

  if (!product) {
    return <h2 className="text-center" style={{ padding: "10rem" }}>Loading...</h2>;
  }

  return (
    <div className="containers" style={{ display: "flex" }}>
      <img
        className="left-column-img"
        src={imageUrl}
        alt={product.imageName || product.name}
        style={{ width: "50%", height: "auto" }}
      />

      <div className="right-column" style={{ width: "50%" }}>
        <div className="product-description">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "lighter" }}>
              {product.category}
            </span>
            <h6 className="release-date" style={{ marginBottom: "2rem" }}>
              Listed : <i>{product.releaseDate ? new Date(product.releaseDate).toLocaleDateString() : "-"}</i>
            </h6>
          </div>

          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", textTransform: "capitalize", letterSpacing: "1px" }}>
            {product.name}
          </h1>
          <i style={{ marginBottom: "3rem" }}>{product.brand}</i>
          <p style={{ fontWeight: "bold", fontSize: "1rem", margin: "10px 0 0" }}>PRODUCT DESCRIPTION :</p>
          <p style={{ marginBottom: "1rem" }}>{product.description}</p>
        </div>

        <div className="product-price">
          <span style={{ fontSize: "2rem", fontWeight: "bold" }}>
            {formatPrice(product?.price)}
          </span>

          <button
            className={`cart-btn ${!product.productAvailable ? "disabled-btn" : ""}`}
            onClick={handleAddToCart}
            disabled={!product.productAvailable}
            style={{
              padding: "1rem 2rem",
              fontSize: "1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginBottom: "1rem",
            }}
          >
            {product.productAvailable ? "Add to cart" : "Out of Stock"}
          </button>

          <h6 style={{ marginBottom: "1rem" }}>
            Stock Available :{" "}
            <i style={{ color: "green", fontWeight: "bold" }}>
              {product.stockQuantity}
            </i>
          </h6>
        </div>

        {/* Update/Delete buttons… */}
      </div>
    </div>
  );
};

export default Product;