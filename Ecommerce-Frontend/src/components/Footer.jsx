import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                <div className="footer-brand-block">
                    <Link to="/" className="footer-brand">
                        Shopee
                    </Link>
                    <p>
                        Discover products you love, with a shopping experience made
                        simple and personal.
                    </p>
                </div>

                <div className="footer-column">
                    <h2>Explore</h2>
                    <Link to="/">Products</Link>
                    <Link to="/cart">Shopping bag</Link>
                    <Link to="/add_product">Add product</Link>
                </div>

                <div className="footer-column">
                    <h2>Categories</h2>
                    <span>Mobile</span>
                    <span>Tablet</span>
                    <span>Laptop</span>
                    <span>VR</span>
                </div>

                <div className="footer-column footer-contact">
                    <h2>Stay in touch</h2>
                    <p>Questions, ideas, or looking for something specific?</p>
                    <a href="mailto:hello@shopee.example">hello@shopee.example</a>
                </div>
            </div>
            <div className="site-footer-bottom">
                <span>© {new Date().getFullYear()} Shopee</span>
                <span>Shop easy. Shop happy.</span>
            </div>
        </footer>
    );
};

export default Footer;
