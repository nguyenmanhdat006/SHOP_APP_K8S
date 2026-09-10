import React, { useContext, useState, useEffect } from "react";
import AppContext from "../Context/Context";
import axios from "../axios";
import CheckoutPopup from "./CheckoutPopup";
import { Button } from 'react-bootstrap';

const Cart = () => {
  const { cart, removeFromCart, updateCartItem, clearCart } = useContext(AppContext);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchImagesAndUpdateCart = async () => {
      console.log("Cart", cart);
      try {
        const response = await axios.get("/products");
        const backendProductIds = response.data.map((product) => product.id);

        const updatedCartItems = cart.filter((item) => backendProductIds.includes(item.id));
        const cartItemsWithImages = await Promise.all(
          updatedCartItems.map(async (item) => {
            try {
              const response = await axios.get(
                `/product/${item.id}/image`,
                { responseType: "blob" }
              );
              const imageUrl = URL.createObjectURL(response.data);
              return { ...item, imageUrl };
            } catch (error) {
              console.error("Error fetching image:", error);
              return { ...item, imageUrl: "placeholder-image-url" };
            }
          })
        );
        console.log("cart", cart)
        setCartItems(cartItemsWithImages);
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    };

    if (cart.length) {
      fetchImagesAndUpdateCart();
    }
  }, [cart]);

  useEffect(() => {
    const total = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    setTotalPrice(total);
  }, [cartItems]);

  const handleIncreaseQuantity = (itemId) => {
    const newCartItems = cartItems.map((item) => {
      if (item.id === itemId) {
        if (item.quantity < item.stockQuantity) {
          return { ...item, quantity: item.quantity + 1 };
        } else {
          alert("Cannot add more than available stock");
        }
      }
      return item;
    });
    const item = newCartItems.find((currentItem) => currentItem.id === itemId);
    if (item) updateCartItem(itemId, item.quantity).catch((error) => console.error(error));
    setCartItems(newCartItems);
  };


  const handleDecreaseQuantity = (itemId) => {
    const newCartItems = cartItems.map((item) =>
      item.id === itemId
        ? { ...item, quantity: Math.max(item.quantity - 1, 1) }
        : item
    );
    const item = newCartItems.find((currentItem) => currentItem.id === itemId);
    if (item) updateCartItem(itemId, item.quantity).catch((error) => console.error(error));
    setCartItems(newCartItems);
  };

  const handleRemoveFromCart = (itemId) => {
    removeFromCart(itemId);
    const newCartItems = cartItems.filter((item) => item.id !== itemId);
    setCartItems(newCartItems);
  };

  const handleCheckout = async () => {
    try {
      await axios.post("/orders/checkout");
      clearCart();
      setCartItems([]);
      setShowModal(false);
    } catch (error) {
      console.log("error during checkout", error);
    }
  };

  const formatPrice = (value) => `${Number(value ?? 0).toLocaleString("vi-VN")} VNĐ`;

  return (
    <main className="cart-container">
      <div className="shopping-cart">
        <div className="cart-heading">
          <div>
            <p className="eyebrow">Your selection</p>
            <h1>Shopping Bag</h1>
          </div>
          <span>{cartItems.length} item{cartItems.length === 1 ? "" : "s"}</span>
        </div>
        {cartItems.length === 0 ? (
          <div className="empty">
            <i className="bi bi-bag-x" aria-hidden="true"></i>
            <h2>Your bag is empty</h2>
            <p>Items you add will appear here.</p>
          </div>
        ) : (
          <>
            {cartItems.map((item) => (
              <li key={item.id} className="cart-item">
                <div className="item">
                  <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
                  <div className="description">
                    <span className="cart-item-brand">{item.brand}</span>
                    <strong>{item.name}</strong>
                    <small>{formatPrice(item.price)} each</small>
                  </div>

                  <div className="quantity">
                    <button
                      className="plus-btn"
                      type="button"
                      name="button"
                      onClick={() => handleIncreaseQuantity(item.id)}
                    >
                      <i className="bi bi-plus-square-fill"></i>
                    </button>
                    <input
                      type="button"
                      name="name"
                      value={item.quantity}
                      readOnly
                    />
                    <button
                      className="minus-btn"
                      type="button"
                      name="button"
                      onClick={() => handleDecreaseQuantity(item.id)}
                    >
                      <i className="bi bi-dash-square-fill"></i>
                    </button>
                  </div>

                  <div className="total-price">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  <button
                    className="remove-btn"
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => handleRemoveFromCart(item.id)}
                  >
                    <i className="bi bi-trash3-fill"></i>
                  </button>
                </div>
              </li>
            ))}
            <div className="cart-summary">
              <span>Total</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>
            <Button
              className="checkout-action"
              onClick={() => setShowModal(true)}
            >
              Continue to checkout <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </Button>
          </>
        )}
      </div>
      <CheckoutPopup
        show={showModal}
        handleClose={() => setShowModal(false)}
        cartItems={cartItems}
        totalPrice={totalPrice}
        handleCheckout={handleCheckout}
      />
    </main>

  );
};

export default Cart;
