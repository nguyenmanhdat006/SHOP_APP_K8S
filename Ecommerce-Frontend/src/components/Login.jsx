import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../Context/Context";

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useContext(AppContext);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-showcase">
        <span className="auth-showcase-mark">Shopee</span>
        <p className="auth-showcase-kicker">A better way to shop</p>
        <h2>Everything you want, in one place.</h2>
        <p className="auth-showcase-copy">
          Discover everyday essentials, thoughtful tech, and new favourites from
          a store built around you.
        </p>
        <div className="auth-benefits">
          <span><i className="bi bi-check2" aria-hidden="true"></i> Curated products</span>
          <span><i className="bi bi-check2" aria-hidden="true"></i> Simple checkout</span>
          <span><i className="bi bi-check2" aria-hidden="true"></i> Shopping made personal</span>
        </div>
      </div>
      <div className="auth-card">
        <div className="auth-copy">
          <p className="auth-kicker">Welcome to Shopee</p>
          <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
          <p>
            {mode === "login"
              ? "Sign in to continue your shopping journey."
              : "Join Shopee and make every shopping trip feel effortless."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              <span>Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "Need an account? Switch to register"
            : "Already have an account? Switch to login"}
        </button>
      </div>
    </div>
  );
};

export default Login;