import { Link } from 'react-router-dom';

export default function StorefrontFooter() {
    return (
        <footer className="sf-footer">
            <div className="sf-footer__inner">
                <div className="sf-footer__brand">
                    <span className="sf-footer__brand-logo">MaltaLand</span>
                    <p>
                        Small-batch goods, crafted slowly on the islands. Rooted in Malta,
                        made with soul.
                    </p>
                </div>
                <div className="sf-footer__col">
                    <h4>Shop</h4>
                    <Link to="/products">All products</Link>
                    <Link to="/cart">Cart</Link>
                </div>
                <div className="sf-footer__col">
                    <h4>Account</h4>
                    <Link to="/login">Sign in</Link>
                    <Link to="/register">Create account</Link>
                    <Link to="/account/orders">My orders</Link>
                </div>
                <div className="sf-footer__col">
                    <h4>Help</h4>
                    <Link to="/track">Track an order</Link>
                </div>
                <div className="sf-footer__col">
                    <h4>Contact</h4>
                    <a href="mailto:hello@maltaland.mt">hello@maltaland.mt</a>
                    <a href="https://maltaland.mt">maltaland.mt</a>
                </div>
            </div>
            <div className="sf-footer__bottom">
                &copy; {new Date().getFullYear()} MaltaLand Store. All rights reserved.
            </div>
        </footer>
    );
}
