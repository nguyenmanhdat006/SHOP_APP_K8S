import axios from "../axios";
import { useState, useEffect, createContext } from "react";

const AppContext = createContext({
  data: [],
  isError: "",
  cart: [],
  user: null,
  token: null,
  addToCart: (product) => { },
  removeFromCart: (productId) => { },
  updateCartItem: (productId, quantity) => Promise.resolve([]),
  refreshData: () => { },
  updateStockQuantity: (productId, newQuantity) => { },
  login: async (email, password) => { },
  register: async (payload) => { },
  logout: async () => { },

});

export const AppProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [isError, setIsError] = useState("");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("auth_user")) || null);
  const [token, setToken] = useState(localStorage.getItem("auth_token") || null);
  const getCartKey = (account) => account?.id ? `cart_user_${account.id}` : "cart_guest";
  const loadCart = (account) => {
    try {
      return JSON.parse(localStorage.getItem(getCartKey(account)) || "[]");
    } catch {
      return [];
    }
  };
  const [cart, setCart] = useState(() => loadCart(user));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    axios
      .get("/auth/me")
      .then(({ data: response }) => {
        setUser(response.user);
        localStorage.setItem("auth_user", JSON.stringify(response.user));
      })
      .catch(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token");
      });
  }, [token]);


  const addToCart = (product) => {
    if (user) {
      axios.post("/cart/items", { productId: product.id, quantity: 1 })
        .then(({ data: serverCart }) => setCart(serverCart.items))
        .catch((error) => console.error("Unable to add cart item:", error));
      return;
    }

    const existingProductIndex = cart.findIndex((item) => item.id === product.id);
    if (existingProductIndex !== -1) {
      const updatedCart = cart.map((item, index) =>
        index === existingProductIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updatedCart);
    } else {
      const updatedCart = [...cart, { ...product, quantity: 1 }];
      setCart(updatedCart);
    }
  };

  const removeFromCart = (productId) => {
    if (user) {
      axios.delete(`/cart/items/${productId}`)
        .then(({ data: serverCart }) => setCart(serverCart.items))
        .catch((error) => console.error("Unable to remove cart item:", error));
      return;
    }

    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
  };

  const refreshData = async () => {
    try {
      const response = await axios.get("/products");
      setData(response.data);
    } catch (error) {
      setIsError(error.message);
    }
  };

  const clearCart = () => {
    setCart([]);
  }

  const updateCartItem = (productId, quantity) => {
    if (user) {
      return axios.patch(`/cart/items/${productId}`, { quantity })
        .then(({ data: serverCart }) => {
          setCart(serverCart.items);
          return serverCart.items;
        });
    }

    const updatedCart = cart.map((item) =>
      item.id === productId ? { ...item, quantity } : item,
    );
    setCart(updatedCart);
    return Promise.resolve(updatedCart);
  };

  const login = async (email, password) => {
    const response = await axios.post("/auth/login", { email, password });
    const { user: loggedInUser, token: authToken } = response.data;
    setCart(loadCart(loggedInUser));
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem("auth_user", JSON.stringify(loggedInUser));
    localStorage.setItem("auth_token", authToken);
    return response.data;
  };

  const register = async (payload) => {
    const response = await axios.post("/auth/register", payload);
    const { user: registeredUser, token: authToken } = response.data;
    setCart(loadCart(registeredUser));
    setUser(registeredUser);
    setToken(authToken);
    localStorage.setItem("auth_user", JSON.stringify(registeredUser));
    localStorage.setItem("auth_token", authToken);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setCart([]);
      setUser(null);
      setToken(null);
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
      delete axios.defaults.headers.common.Authorization;
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!user) return;

    axios.get("/cart")
      .then(({ data: serverCart }) => setCart(serverCart.items))
      .catch((error) => console.error("Unable to load cart:", error));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(getCartKey(user), JSON.stringify(cart));
  }, [cart, user]);

  return (
    <AppContext.Provider value={{ data, isError, cart, user, token, addToCart, removeFromCart, updateCartItem, refreshData, clearCart, login, register, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;