import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../axios";
import AppContext from "../Context/Context";

const roles = ["CUSTOMER", "SHOP_OWNER", "ADMIN"];

const roleLabel = (role) => role.replace("_", " ");

const Management = () => {
    const { user, data, refreshData } = useContext(AppContext);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");

    const isAdmin = user?.role === "ADMIN";

    useEffect(() => {
        if (!isAdmin) return;

        axios
            .get("/auth/users")
            .then(({ data: userData }) => setUsers(userData))
            .catch((error) => setMessage(error.response?.data?.message || "Unable to load users"));
    }, [isAdmin]);

    const handleRoleChange = async (userId, role) => {
        try {
            const { data: updatedUser } = await axios.patch(`/auth/users/${userId}/role`, { role });
            setUsers((currentUsers) =>
                currentUsers.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
            );
            setMessage("User role updated successfully.");
        } catch (error) {
            setMessage(error.response?.data?.message || "Unable to update user role");
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <main className="management-page">
            <section className="management-header">
                <div>
                    <p className="eyebrow">{isAdmin ? "Admin control center" : "Shop workspace"}</p>
                    <h1>Manage your store.</h1>
                    <p>Keep products, availability, and account access organized from one place.</p>
                </div>
                <Link to="/add_product" className="management-primary-action">
                    <i className="bi bi-plus-lg" aria-hidden="true"></i>
                    Add product
                </Link>
            </section>

            {message && <div className="management-message">{message}</div>}

            <section className="management-stats" aria-label="Store overview">
                <div>
                    <span>Catalog</span>
                    <strong>{data.length}</strong>
                    <small>Total products</small>
                </div>
                <div>
                    <span>Available</span>
                    <strong>{data.filter((product) => product.productAvailable).length}</strong>
                    <small>Visible in store</small>
                </div>
                <div>
                    <span>Role</span>
                    <strong className="management-role">{roleLabel(user?.role || "CUSTOMER")}</strong>
                    <small>Current access level</small>
                </div>
            </section>

            <section className="management-panel">
                <div className="management-panel-heading">
                    <div>
                        <p className="eyebrow">Catalog</p>
                        <h2>Products</h2>
                    </div>
                    <Link to="/" className="management-text-link">View storefront</Link>
                </div>
                <div className="management-product-list">
                    {data.length === 0 ? (
                        <p className="management-empty">No products found.</p>
                    ) : (
                        data.map((product) => (
                            <div className="management-product-row" key={product.id}>
                                <div>
                                    <strong>{product.name}</strong>
                                    <span>{product.brand} · {product.category}</span>
                                </div>
                                <span className={product.productAvailable ? "status-available" : "status-unavailable"}>
                                    {product.productAvailable ? "Available" : "Hidden"}
                                </span>
                                <Link to={`/product/update/${product.id}`} className="management-icon-link" aria-label={`Edit ${product.name}`}>
                                    <i className="bi bi-arrow-up-right" aria-hidden="true"></i>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {isAdmin && (
                <section className="management-panel">
                    <div className="management-panel-heading">
                        <div>
                            <p className="eyebrow">Access control</p>
                            <h2>Team accounts</h2>
                        </div>
                        <span className="management-panel-note">Admin only</span>
                    </div>
                    <div className="management-user-list">
                        {users.map((account) => (
                            <div className="management-user-row" key={account.id}>
                                <div>
                                    <strong>{account.name || "Unnamed customer"}</strong>
                                    <span>{account.email}</span>
                                </div>
                                <select
                                    value={account.role}
                                    onChange={(event) => handleRoleChange(account.id, event.target.value)}
                                    aria-label={`Role for ${account.email}`}
                                >
                                    {roles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
};

export default Management;
