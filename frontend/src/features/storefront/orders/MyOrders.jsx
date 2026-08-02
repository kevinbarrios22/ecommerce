import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import api from '../../../shared/api/api';

const paymentLabel = (pm) => {
    const labels = {
        CARD: 'Card / PayPal / Revolut',
        WISE_TRANSFER: 'Bank transfer (Wise)',
        REVOLUT_TRANSFER: 'Bank transfer (Revolut)',
    };
    return labels[pm] || pm || '-';
};

function StatusBadge({ status }) {
    const colors = {
        PENDING: '#b45309',
        PAID: '#2563eb',
        SHIPPED: '#7c3aed',
        DELIVERED: '#059669',
        CANCELLED: '#dc2626',
    };
    return (
        <span
            className="sf-track__badge"
            style={{ background: colors[status] || '#6b7280' }}
        >
            {status}
        </span>
    );
}

function OrderCard({ order }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="sf-account__order">
            <button className="sf-account__order-head" onClick={() => setOpen(!open)} type="button">
                <span className="sf-account__order-id">Order #{order.id}</span>
                <StatusBadge status={order.status} />
                <span className="sf-account__order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span className="sf-account__order-total">€{order.total}</span>
                <span className="sf-account__order-chevron">{open ? '▴' : '▾'}</span>
            </button>
            {open && (
                <div className="sf-account__order-body">
                    <div className="sf-confirmation__row">
                        <span>Payment method</span>
                        <strong>{paymentLabel(order.paymentMethod)}</strong>
                    </div>
                    {order.items?.map((item, index) => (
                        <div className="sf-confirmation__item" key={index}>
                            <span>
                                {item.productName} × {item.quantity}
                            </span>
                            <span>€{item.subtotal}</span>
                        </div>
                    ))}
                    <div className="sf-confirmation__total">
                        <span>Total</span>
                        <span>€{order.total}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function MyOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;
        api.get('/orders/my')
            .then((res) => setOrders(res.data))
            .catch(() => setError('Could not load your orders.'));
    }, [user]);

    if (!user) {
        return (
            <div className="sf-cart__empty">
                <div className="sf-cart__empty-icon">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
                    </svg>
                </div>
                <h1 className="sf-cart__empty-title">Sign in to see your orders</h1>
                <p className="sf-cart__empty-text">
                    Log in to the account you used at checkout to see your order history.
                </p>
                <Link to="/login" className="sf-btn sf-btn--primary">
                    Sign in
                </Link>
            </div>
        );
    }

    return (
        <div>
            <header className="sf-page__header">
                <span className="sf-page__eyebrow">Welcome back</span>
                <h1 className="sf-page__title">My orders</h1>
            </header>

            {error && <p className="sf-checkout__error">{error}</p>}

            {!orders ? (
                <div className="sf-loading">
                    <div className="sf-loading__spinner" />
                    <p>Loading your orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="sf-cart__empty">
                    <div className="sf-cart__empty-icon">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M6 7h12l1 13H5L6 7Z" />
                            <path d="M9 7a3 3 0 0 1 6 0" />
                        </svg>
                    </div>
                    <h1 className="sf-cart__empty-title">No orders yet</h1>
                    <p className="sf-cart__empty-text">
                        When you place an order it will show up here.
                    </p>
                    <Link to="/products" className="sf-btn sf-btn--primary">
                        Start shopping
                    </Link>
                </div>
            ) : (
                <div className="sf-account__orders">
                    {orders.map((o) => (
                        <OrderCard key={o.id} order={o} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyOrders;
