import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";
import AppContext from "../Context/Context";
import unplugged from "../assets/unplugged.png";

const Home = ({ selectedCategory }) => {
  const { data, isError, addToCart, refreshData } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [isDataFetched, setIsDataFetched] = useState(false);

  // Function to format price with commas and VNĐ
  const formatPrice = (price) => {
    return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} VNĐ`;
  };

  useEffect(() => {
    if (!isDataFetched) {
      refreshData();
      setIsDataFetched(true);
    }
  }, [refreshData, isDataFetched]);

  useEffect(() => {
    if (data && data.length > 0) {
      const fetchImagesAndUpdateProducts = async () => {
        const updatedProducts = await Promise.all(
          data.map(async (product) => {
            try {
              const response = await axios.get(
                `/product/${product.id}/image`,
                { responseType: "blob" }
              );
              const imageUrl = URL.createObjectURL(response.data);
              return { ...product, imageUrl };
            } catch (error) {
              console.error(
                "Error fetching image for product ID:",
                product.id,
                error
              );
              return { ...product, imageUrl: "placeholder-image-url" };
            }
          })
        );
        setProducts(updatedProducts);
      };
      fetchImagesAndUpdateProducts();
    }
  }, [data]);

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;

  if (isError) {
    return (
      <h2 className="text-center" style={{ padding: "18rem" }}>
        <img
          src={unplugged}
          alt="Error"
          style={{ width: "100px", height: "100px" }}
        />
      </h2>
    );
  }

  return (
    <main className="home-page">
      <section className="home-intro">
        <div>
          <p className="eyebrow">Your everyday shopping destination</p>
          <h1>Find something you’ll love.</h1>
          <p className="home-subtitle">
            Shop popular products, discover new arrivals, and enjoy a simpler
            way to find what belongs in your everyday life.
          </p>
        </div>
        <div className="home-stat">
          <strong>{filteredProducts.length.toString().padStart(2, "0")}</strong>
          <span>products in store</span>
        </div>
      </section>

      <section className="product-grid" aria-label="Product catalog">
        {filteredProducts.length === 0 ? (
          <h2 className="empty-state">
            No Products Available
          </h2>
        ) : (
          filteredProducts.map((product) => {
            const { id, brand, name, price, productAvailable, imageUrl } =
              product;
            return (
              <article
                className={`product-card ${!productAvailable ? "is-unavailable" : ""}`}
                key={id}
              >
                <Link
                  to={`/product/${id}`}
                  className="product-card-link"
                >
                  <div className="product-image-wrap">
                    <img src={imageUrl} alt={name} className="product-image" />
                    <span className="product-status">
                      {productAvailable ? "Available" : "Sold out"}
                    </span>
                  </div>
                  <div className="product-card-body">
                    <span className="product-brand">{brand}</span>
                    <h2>{name}</h2>
                    <div className="product-card-footer">
                      <strong>{formatPrice(price)}</strong>
                      <button
                        className="add-to-cart"
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        disabled={!productAvailable}
                      >
                        <i className="bi bi-plus-lg" aria-hidden="true"></i>
                        Add
                      </button>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
};

export default Home;