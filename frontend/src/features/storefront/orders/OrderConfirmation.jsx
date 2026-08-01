import { useEffect, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import api from '../../../shared/api/api';

function OrderConfirmation() {
    const { state } = useLocation();
    const [searchParams] = useSearchParams();
    const [order, setOrder] = useState(state?.order);
    const [loading, setLoading] = useState(!state?.order && searchParams.get('orderId'));

    useEffect(() => {
        const orderId = searchParams.get('orderId');
        if (!order && orderId) {
            // Returning from a redirect-based payment (PayPal, Revolut Pay).
            // The confirm endpoint is idempotent, so it is safe to call here.
            api.post(`/orders/${orderId}/confirm`)
                .then((res) => setOrder(res.data))
                .catch(() => setLoading(false))
                .finally(() => setLoading(false));
        }
    }, [searchParams, order]);

    if (loading) {
        return (
            <div className="empty">
                <h1 className="page-title">Order Confirmation</h1>
                <p>Confirming your order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="empty">
                <h1 className="page-title">Order Confirmation</h1>
                <p>No order information found.</p>
                <Link to="/" className="btn">Continue shopping</Link>
            </div>
        );
    }

    return (
        <div className="order-confirmation">
            <h1 className="page-title">Order Confirmed!</h1>
            <div className="order-confirmation__card">
                <p className="order-confirmation__id">
                    Order #{order.id}
                </p>
                <p className="order-confirmation__status">
                    Status: <strong>{order.status}</strong>
                </p>
                <p className="order-confirmation__total">
                    Total: <strong>€{order.total}</strong>
                </p>
                <h2>Items</h2>
                <ul className="order-confirmation__items">
                    {order.items?.map((item, index) => (
                        <li key={index}>
                            {item.productName} x{item.quantity} — €{item.subtotal}
                        </li>
                    ))}
                </ul>
                <Link to="/" className="btn">Continue shopping</Link>
            </div>
        </div>
    );
}

export default OrderConfirmation;
