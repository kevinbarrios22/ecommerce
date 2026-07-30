import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
    const { totalItems } = useCart();
    const { user, logout } = useAuth();

    return (
        <header className="header">
            <div className="header__inner">
                <Link to="/" className="header__logo">MaltaLand</Link>
                <nav className="header__nav">
                    <Link to="/products">Products</Link>
                    <Link to="/categories">Categories</Link>
                    <Link to="/cart" className="header__cart-link">
                        Cart
                        {totalItems > 0 && (
                            <span className="header__cart-badge">{totalItems}</span>
                        )}
                    </Link>
                    {user ? (
                        <>
                            <span className="header__user">{user.name}</span>
                            <button className="header__logout" onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <Link to="/login">Login</Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
