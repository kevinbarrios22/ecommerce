import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../shared/api/api';

const isTransfer = (pm) => pm === 'WISE_TRANSFER' || pm === 'REVOLUT_TRANSFER';

const paymentLabel = (pm) => {
    const labels = {
        CARD: 'Card / PayPal / Revolut',
        WISE_TRANSFER: 'Bank transfer (Wise)',
        REVOLUT_TRANSFER: 'Bank transfer (Revolut)',
    };
    return labels[pm] || pm || '-';
};

function formatDate(value) {
    return value ? new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
}

function TrackTimeline({ order }) {
    const transfer = isTransfer(order.paymentMethod);
    const awaitingTransfer = transfer && order.status === 'PENDING';
    const reservedUntil = transfer && order.createdAt
        ? formatDate(new Date(new Date(order.createdAt).getTime() + 48 * 3600 * 1000))
        : null;

    const milestones = [
        { label: 'Order placed', sub: formatDate(order.createdAt), done: true },
        {
            label: transfer ? 'Payment received' : 'Payment confirmed',
            sub: order.paidAt ? formatDate(order.paidAt) : awaitingTransfer ? `Awaiting your transfer · reserved until ${reservedUntil}` : 'Pending',
            done: !!order.paidAt,
        },
        { label: 'Shipped', sub: formatDate(order.shippedAt) || 'Pending', done: !!order.shippedAt },
        { label: 'Delivered', sub: formatDate(order.deliveredAt) || 'Pending', done: !!order.deliveredAt },
    ];

    return (
        <div className="sf-track__card">
            <div className="sf-track__head">
                <span className={`sf-track__badge sf-track__badge--${order.status.toLowerCase()}`}>{order.status}</span>
                <span className="sf-track__id">
                    Order <strong>#{order.id}</strong>
                </span>
            </div>
            {transfer && (
                <p className="sf-track__reference">
                    Use reference <code>MALTALAND-{order.id}</code> in your transfer
                </p>
            )}
            <ul className="sf-track__steps">
                {milestones.map((m) => (
                    <li key={m.label} className={`sf-track__step ${m.done ? 'sf-track__step--done' : ''}`}>
                        <span className="sf-track__dot" />
                        <span className="sf-track__step-text">
                            <strong>{m.label}</strong>
                            <span>{m.sub || 'Pending'}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function OrderTrack() {
    const [email, setEmail] = useState('');
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !orderId.trim()) return;
        setLoading(true);
        setError(null);
        setOrder(null);
        try {
            const res = await api.get('/orders/track', { params: { orderId: orderId.trim(), email: email.trim() } });
            setOrder(res.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "We couldn't find that order. Check the order number and email and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="sf-page__header">
                <span className="sf-page__eyebrow">Keep track of your purchase</span>
                <h1 className="sf-page__title">Track your order</h1>
            </header>

            <form className="sf-track__form" onSubmit={handleSubmit}>
                <div className="sf-checkout__field">
                    <label className="sf-input__label" htmlFor="track-order">
                        Order number
                    </label>
                    <input
                        id="track-order"
                        className="sf-input"
                        type="text"
                        placeholder="e.g. 42"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        required
                    />
                </div>
                <div className="sf-checkout__field">
                    <label className="sf-input__label" htmlFor="track-email">
                        Email used at checkout
                    </label>
                    <input
                        id="track-email"
                        className="sf-input"
                        type="email"
                        placeholder="jane@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button className="sf-btn sf-btn--primary" type="submit" disabled={loading}>
                    {loading ? 'Looking up...' : 'Track order'}
                </button>
                {error && <p className="sf-checkout__error">{error}</p>}
            </form>

            {order && (
                <div className="sf-track__result">
                    <TrackTimeline order={order} />
                    <div className="sf-confirmation__card">
                        <h2>Order summary</h2>
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
                    {order.shippingAddress && (
                        <div className="sf-confirmation__card">
                            <h2>Delivering to</h2>
                            <p className="sf-track__address">
                                {order.shippingName}
                                <br />
                                {order.shippingAddress}
                                <br />
                                {order.shippingCity} {order.shippingZip}
                                <br />
                                {order.shippingCountry}
                            </p>
                        </div>
                    )}
                    <div className="sf-track__actions">
                        <Link to="/products" className="sf-btn sf-btn--ghost">
                            Continue shopping
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderTrack;
