import { NavLink, Link } from 'react-router-dom';
import { useCart } from '../../shared/contexts/CartContext';
import { useAuth } from '../../shared/contexts/AuthContext';

function CartIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1.5" />
            <circle cx="19" cy="21" r="1.5" />
            <path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H6" />
        </svg>
    );
}

export default function StorefrontHeader() {
    const { totalItems } = useCart();
    const { user, logout } = useAuth();

    const navLinkClass = ({ isActive }) =>
        `sf-header__link ${isActive ? 'sf-header__link--active' : ''}`;

    return (
        <header className="sf-header">
            <div className="sf-header__inner">
                <Link to="/" className="sf-header__logo">
                    <span className="sf-header__logo-mark">M</span>
                    MaltaLand
                </Link>
                <nav className="sf-header__nav">
                    <NavLink to="/" end className={navLinkClass}>
                        Home
                    </NavLink>
                    <NavLink to="/products" className={navLinkClass}>
                        Shop
                    </NavLink>
                    <NavLink to="/cart" className={navLinkClass}>
                        <span className="sf-header__cart">
                            <CartIcon />
                            <span className="sf-header__link-label">&nbsp;Cart</span>
                            {totalItems > 0 && (
                                <span className="sf-header__cart-badge">{totalItems}</span>
                            )}
                        </span>
                    </NavLink>
                    {user?.role === 'ADMIN' && (
                        <NavLink to="/admin" className={navLinkClass}>
                            Admin
                        </NavLink>
                    )}
                    <NavLink to="/track" className={navLinkClass}>
                        Track
                    </NavLink>
                    {user ? (
                        <>
                            <NavLink to="/account/orders" className={navLinkClass}>
                                My orders
                            </NavLink>
                            <span className="sf-header__user">{user.name}</span>
                            <button className="sf-header__logout" onClick={logout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <NavLink to="/login" className={navLinkClass}>
                            Login
                        </NavLink>
                    )}
                </nav>
            </div>
        </header>
    );
}
