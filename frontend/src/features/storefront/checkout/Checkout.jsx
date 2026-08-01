import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../../../shared/contexts/CartContext';
import PaymentForm from './PaymentForm';
import api from '../../../shared/api/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function Checkout() {
    const { items, totalPrice, clearCart } = useCart();
    const [form, setForm] = useState({ customerName: '', customerEmail: '' });
    const [step, setStep] = useState('form');
    const [clientSecret, setClientSecret] = useState(null);
    const [orderId, setOrderId] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (items.length === 0) {
        return (
            <div className="empty">
                <h1 className="page-title">Checkout</h1>
                <p>Your cart is empty.</p>
                <Link to="/products" className="btn">Browse products</Link>
            </div>
        );
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!form.customerName.trim() || !form.customerEmail.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const payload = {
                customerName: form.customerName,
                customerEmail: form.customerEmail,
                items: items.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity,
                })),
            };

            const res = await api.post('/payments/create-payment-intent', payload);
            setClientSecret(res.data.clientSecret);
            setOrderId(res.data.orderId);
            setStep('payment');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout">
            <h1 className="page-title">Checkout</h1>
            <div className="checkout__layout">
                {step === 'form' ? (
                    <form className="checkout__form" onSubmit={handleFormSubmit}>
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
                        <button className="btn" type="submit" disabled={loading}>
                            {loading ? 'Preparing payment...' : `Pay €${totalPrice.toFixed(2)}`}
                        </button>
                    </form>
                ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm
                            items={items}
                            form={form}
                            totalPrice={totalPrice}
                            orderId={orderId}
                            clearCart={clearCart}
                        />
                    </Elements>
                ) : null}
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
