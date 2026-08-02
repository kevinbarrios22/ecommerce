import { useEffect, useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import api from '../../../shared/api/api';
import TransferInstructions from './TransferInstructions';

function readStoredTransfer() {
    try {
        const raw = sessionStorage.getItem('maltalandTransfer');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function CheckIcon() {
    return (
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

function EmptyBagIcon() {
    return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 7h12l1 13H5L6 7Z" />
            <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
    );
}

function OrderConfirmation() {
    const { state } = useLocation();
    const [searchParams] = useSearchParams();
    const [order, setOrder] = useState(state?.order);
    const [transfer] = useState(state?.bankTransfer ?? readStoredTransfer());
    const [loading, setLoading] = useState(!state?.order && searchParams.get('orderId'));

    useEffect(() => {
        const orderId = searchParams.get('orderId');
        if (!order && orderId) {
            // Returning from a redirect-based payment (PayPal, Revolut Pay) or a
            // refresh on a bank-transfer confirmation. The confirm endpoint is
            // idempotent for Stripe orders; bank-transfer orders have no intent,
            // so fall back to fetching the order to render its current status.
            api.post(`/orders/${orderId}/confirm`)
                .then((res) => setOrder(res.data))
                .catch(() => api.get(`/orders/${orderId}`).then((res) => setOrder(res.data)))
                .catch(() => {})
                .finally(() => setLoading(false));
        }
    }, [searchParams, order]);

    if (loading) {
        return (
            <div className="sf-loading">
                <div className="sf-loading__spinner" />
                <p>Confirming your order...</p>
            </div>
        );
    }

    if (!order && !transfer) {
        return (
            <div className="sf-cart__empty">
                <div className="sf-cart__empty-icon">
                    <EmptyBagIcon />
                </div>
                <h1 className="sf-cart__empty-title">No order found</h1>
                <p className="sf-cart__empty-text">
                    We couldn't find the order you were looking for.
                </p>
                <Link to="/products" className="sf-btn sf-btn--primary">
                    Continue shopping
                </Link>
            </div>
        );
    }

    if (transfer && order?.status !== 'PAID') {
        return <TransferInstructions data={transfer} order={order} />;
    }

    return (
        <div className="sf-confirmation">
            <div className="sf-confirmation__check">
                <CheckIcon />
            </div>
            <h1 className="sf-confirmation__title">Thank you!</h1>
            <p className="sf-confirmation__sub">Your order is confirmed.</p>
            <p className="sf-confirmation__id">
                Order <strong>#{order.id}</strong> · we've emailed you a receipt
            </p>

            <div className="sf-confirmation__card">
                <h2>Order summary</h2>
                <div className="sf-confirmation__row">
                    <span>Status</span>
                    <strong>{order.status}</strong>
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

            <Link to="/products" className="sf-btn sf-btn--primary">
                Continue shopping
            </Link>
            <p className="sf-confirmation__note sf-confirmation__note--center">
                You can follow your order anytime on the{' '}
                <Link to="/track" className="sf-confirmation__link">tracking page</Link>.
            </p>
        </div>
    );
}

export default OrderConfirmation;
