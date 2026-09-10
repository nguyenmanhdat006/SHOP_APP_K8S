import React, { useContext, useEffect, useState } from "react";
import axios from "../axios";
import { Link, useNavigate } from "react-router-dom";
import AppContext from "../Context/Context";
// import { json } from "react-router-dom";
// import { BiSunFill, BiMoon } from "react-icons/bi";

const Navbar = ({ onSelectCategory, onSearch }) => {
  const { user, logout, cart } = useContext(AppContext);
  const canManage = ["SHOP_OWNER", "ADMIN"].includes(user?.role);
  const navigate = useNavigate();
  const getInitialTheme = () => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme ? storedTheme : "light-theme";
  };
  const [selectedCategory, setSelectedCategory] = useState("");
  const [theme, setTheme] = useState(getInitialTheme());
  const [input, setInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (value) => {
    try {
      const response = await axios.get("/products");
      setSearchResults(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleChange = async (value) => {
    setInput(value);
    if (value.length >= 1) {
      setShowSearchResults(true);
      try {
        const response = await axios.get(`/products/search?keyword=${value}`);
        setSearchResults(response.data);
        setNoResults(response.data.length === 0);
        console.log(response.data);
      } catch (error) {
        console.error("Error searching:", error);
      }
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
      setNoResults(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    onSelectCategory(category);
  };
  const toggleTheme = () => {
    const newTheme = theme === "dark-theme" ? "light-theme" : "dark-theme";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const categories = ["Mobile", "Tablet", "Laptop", "VR"];
  return (
    <>
      <header>
        <nav className="navbar navbar-expand-lg fixed-top">
          <div className="container-fluid">
            <a className="navbar-brand" href="/">
              Shopee
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link active" aria-current="page" to="/">
                    Products
                  </Link>
                </li>
                {canManage && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/management">
                      Manage store
                    </Link>
                  </li>
                )}
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="/"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Categories
                  </a>

                  <ul className="dropdown-menu">
                    {categories.map((category) => (
                      <li key={category}>
                        <button
                          className="dropdown-item"
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <input
                  className="form-control me-2 search-with"
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  value={input}
                  onChange={(e) => handleChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {showSearchResults && (
                  <ul className="list-group">
                    {searchResults.length > 0
                      ? searchResults.map((result) => (
                        <li key={result.id} className="list-group-item">
                          <a
                            href={`/product/${result.id}`}
                            className="search-result-link"
                          >
                            <span>{result.name}</span>
                          </a>
                        </li>
                      ))
                      : noResults && (
                        <p className="no-results-message">
                          No Prouduct with such Name
                        </p>
                      )}
                  </ul>
                )}
              </ul>
              <div className="nav-actions">
                <button className="theme-btn" onClick={() => toggleTheme()}>
                  {theme === "dark-theme" ? (
                    <i className="bi bi-moon-fill"></i>
                  ) : (
                    <i className="bi bi-sun-fill"></i>
                  )}
                </button>
                <div className="d-flex align-items-center cart">
                  <Link to="/cart" className="nav-link cart-link">
                    <i className="bi bi-bag" aria-hidden="true"></i>
                    <span>Bag</span>
                    <b className="cart-count">{cart.length}</b>
                  </Link>
                </div>
                <div className="d-flex align-items-center auth-links">
                  {user ? (
                    <>
                      <span className="auth-user">{user.email}</span>
                      <button className="auth-logout" type="button" onClick={handleLogout}>
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link className="auth-login" to="/login">
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
