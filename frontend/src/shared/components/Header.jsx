import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
    const location = useLocation();
    const { totalItems } = useCart();
    const { user, logout } = useAuth();

    if (location.pathname.startsWith('/admin')) return null;

    return (
        <header className="header">
            <div className="header__inner">
                <Link to="/" className="header__logo">MaltaLand</Link>
                <nav className="header__nav">
                    <Link to="/products">Products</Link>
                    <Link to="/cart" className="header__cart-link">
                        Cart
                        {totalItems > 0 && (
                            <span className="header__cart-badge">{totalItems}</span>
                        )}
                    </Link>
                    {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
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
