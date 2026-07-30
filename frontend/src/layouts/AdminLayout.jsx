import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/contexts/AuthContext';

export default function AdminLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <h2 className="admin-sidebar__title">Admin Panel</h2>
                <nav className="admin-sidebar__nav">
                    <Link to="/admin">Dashboard</Link>
                    <Link to="/admin/products">Products</Link>
                    <Link to="/admin/categories">Categories</Link>
                    <Link to="/admin/orders">Orders</Link>
                </nav>
                <div className="admin-sidebar__bottom">
                    <Link to="/" className="admin-sidebar__store-link">View Store</Link>
                    <button className="admin-sidebar__logout" onClick={handleLogout}>
                        Logout {user?.name}
                    </button>
                </div>
            </aside>
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}
