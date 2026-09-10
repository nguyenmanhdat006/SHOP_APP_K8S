import "./App.css";
import React, { useContext, useState } from "react";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import Cart from "./components/Cart";
import AddProduct from "./components/AddProduct";
import Product from "./components/Product";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./Context/Context";
import AppContext from "./Context/Context";
import UpdateProduct from "./components/UpdateProduct";
import Login from "./components/Login";
import Footer from "./components/Footer";
import Management from "./components/Management";
import { Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    console.log("Selected category:", category);
  };
  const addToCart = (product) => {
    const existingProduct = cart.find((item) => item.id === product.id);
    if (existingProduct) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar onSelectCategory={handleCategorySelect}
        />
        <Routes>
          <Route
            path="/"
            element={
              <Home addToCart={addToCart} selectedCategory={selectedCategory}
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/product" element={<Product />} />
          <Route path="product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/management"
            element={
              <RoleRoute roles={["SHOP_OWNER", "ADMIN"]}>
                <Management />
              </RoleRoute>
            }
          />
          <Route
            path="/add_product"
            element={
              <RoleRoute roles={["SHOP_OWNER", "ADMIN"]}>
                <AddProduct />
              </RoleRoute>
            }
          />
          <Route
            path="/product/update/:id"
            element={
              <RoleRoute roles={["SHOP_OWNER", "ADMIN"]}>
                <UpdateProduct />
              </RoleRoute>
            }
          />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AppProvider>
  );
}

function RoleRoute({ roles, children }) {
  const { user } = useContext(AppContext);
  const role = user?.role === "USER" ? "CUSTOMER" : user?.role;

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to="/" replace />;

  return children;
}

export default App;
