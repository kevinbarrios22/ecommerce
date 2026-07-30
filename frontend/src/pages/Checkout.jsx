import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';

function Checkout() {
    const navigate = useNavigate();
    const { items, totalPrice, clearCart } = useCart();
    const [form, setForm] = useState({ customerName: '', customerEmail: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (items.length === 0) {
        return (
            <div className="empty">
                <h1 className="page-title">Checkout</h1>
                <p>Your cart is empty.</p>
                <Link to="/products" className="btn">Browse products</Link>
            </div>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.customerName.trim() || !form.customerEmail.trim()) return;

        setSubmitting(true);
        setError(null);

        const payload = {
            customerName: form.customerName,
            customerEmail: form.customerEmail,
            items: items.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
            })),
        };

        api.post('/orders', payload)
            .then((res) => {
                clearCart();
                navigate('/order-confirmation', { state: { order: res.data } });
            })
            .catch((err) => {
                setError(err.response?.data?.message || err.message);
                setSubmitting(false);
            });
    };

    return (
        <div className="checkout">
            <h1 className="page-title">Checkout</h1>
            <div className="checkout__layout">
                <form className="checkout__form" onSubmit={handleSubmit}>
                    <h2>Customer details</h2>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Full name"
                        value={form.customerName}
                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        required
                    />
                    <input
                        className="search-input"
                        type="email"
                        placeholder="Email address"
                        value={form.customerEmail}
                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                        required
                    />
                    {error && <p className="error">{error}</p>}
                    <button className="btn" type="submit" disabled={submitting}>
                        {submitting ? 'Processing...' : `Pay €${totalPrice.toFixed(2)}`}
                    </button>
                </form>
                <div className="checkout__summary">
                    <h2>Order summary</h2>
                    {items.map((item) => (
                        <div key={item.id} className="checkout__item">
                            <span className="checkout__item-name">
                                {item.name} x{item.quantity}
                            </span>
                            <span>€{(item.priceWithVat * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="checkout__total">
                        <strong>Total</strong>
                        <strong>€{totalPrice.toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Checkout;
