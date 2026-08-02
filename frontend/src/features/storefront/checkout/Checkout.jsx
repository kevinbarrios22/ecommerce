import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../../../shared/contexts/CartContext';
import PaymentForm from './PaymentForm';
import api from '../../../shared/api/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const stripeAppearance = {
    theme: 'stripe',
    variables: {
        colorPrimary: '#C8860A',
        colorBackground: '#ffffff',
        colorText: '#2C2416',
        colorDanger: '#B84A2F',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        borderRadius: '8px',
    },
};

function CheckmarkIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

function Stepper({ current }) {
    const steps = ['Details', 'Payment', 'Done'];
    return (
        <div className="sf-stepper">
            {steps.map((label, i) => {
                const n = i + 1;
                const state = n < current ? 'done' : n === current ? 'active' : '';
                return (
                    <Fragment key={label}>
                        {i > 0 && (
                            <span
                                className={`sf-stepper__line ${n <= current ? 'sf-stepper__line--done' : ''}`}
                            />
                        )}
                        <div className={`sf-stepper__item ${state ? `sf-stepper__item--${state}` : ''}`}>
                            <span
                                className={`sf-stepper__dot ${
                                    state === 'done'
                                        ? 'sf-stepper__dot--done'
                                        : state === 'active'
                                          ? 'sf-stepper__dot--active'
                                          : ''
                                }`}
                            >
                                {state === 'done' ? <CheckmarkIcon /> : n}
                            </span>
                            <span className="sf-stepper__label">{label}</span>
                        </div>
                    </Fragment>
                );
            })}
        </div>
    );
}

const PAYMENT_OPTIONS = [
    {
        value: 'stripe',
        title: 'Card, PayPal or Revolut',
        desc: 'Pay instantly online',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
            </svg>
        ),
    },
    {
        value: 'WISE',
        title: 'Bank transfer · Wise',
        desc: 'Pay from your Wise account',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                <path d="M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" />
            </svg>
        ),
    },
    {
        value: 'REVOLUT',
        title: 'Bank transfer · Revolut',
        desc: 'Pay from your Revolut account',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                <path d="M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" />
            </svg>
        ),
    },
];

function Checkout() {
    const { items, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const [form, setForm] = useState({ customerName: '', customerEmail: '' });
    const [shipping, setShipping] = useState({
        name: '',
        address: '',
        city: '',
        zip: '',
        country: '',
        phone: '',
    });
    const [paymentMethod, setPaymentMethod] = useState('stripe');
    const [step, setStep] = useState('form');
    const [clientSecret, setClientSecret] = useState(null);
    const [orderId, setOrderId] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (items.length === 0) {
        return (
            <div className="sf-cart__empty">
                <div className="sf-cart__empty-icon">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 7h12l1 13H5L6 7Z" />
                        <path d="M9 7a3 3 0 0 1 6 0" />
                    </svg>
                </div>
                <h1 className="sf-cart__empty-title">Your cart is empty</h1>
                <p className="sf-cart__empty-text">
                    Add something from the workshop before checking out.
                </p>
                <Link to="/products" className="sf-btn sf-btn--primary">
                    Browse the shop
                </Link>
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
                shippingAddress: {
                    name: shipping.name,
                    address: shipping.address,
                    city: shipping.city,
                    zip: shipping.zip,
                    country: shipping.country,
                    phone: shipping.phone,
                },
            };

            if (paymentMethod === 'stripe') {
                const res = await api.post('/payments/create-payment-intent', payload);
                setClientSecret(res.data.clientSecret);
                setOrderId(res.data.orderId);
                setStep('payment');
            } else {
                const res = await api.post('/payments/bank-transfer', {
                    ...payload,
                    provider: paymentMethod,
                });
                sessionStorage.setItem('maltalandTransfer', JSON.stringify(res.data));
                clearCart();
                navigate('/order-confirmation', { state: { bankTransfer: res.data } });
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="sf-page__header">
                <span className="sf-page__eyebrow">Secure checkout</span>
                <h1 className="sf-page__title">Checkout</h1>
            </header>

            <Stepper current={step === 'form' ? 1 : 2} />

            <div className="sf-checkout__layout">
                <div className="sf-checkout__panel">
                    {step === 'form' ? (
                        <form onSubmit={handleFormSubmit}>
                            <h2 className="sf-checkout__panel-title">Your details</h2>
                            <div className="sf-checkout__field">
                                <label className="sf-input__label" htmlFor="checkout-name">
                                    Full name
                                </label>
                                <input
                                    id="checkout-name"
                                    className="sf-input"
                                    type="text"
                                    placeholder="Jane Doe"
                                    value={form.customerName}
                                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="sf-checkout__field">
                                <label className="sf-input__label" htmlFor="checkout-email">
                                    Email address
                                </label>
                                <input
                                    id="checkout-email"
                                    className="sf-input"
                                    type="email"
                                    placeholder="jane@example.com"
                                    value={form.customerEmail}
                                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="sf-checkout__field">
                                <span className="sf-input__label">Shipping address</span>
                                <div className="sf-checkout__grid">
                                    <div className="sf-checkout__cell">
                                        <input
                                            className="sf-input"
                                            type="text"
                                            placeholder="Full name"
                                            value={shipping.name}
                                            onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="sf-checkout__cell sf-checkout__cell--full">
                                        <input
                                            className="sf-input"
                                            type="text"
                                            placeholder="Street address"
                                            value={shipping.address}
                                            onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="sf-checkout__cell">
                                        <input
                                            className="sf-input"
                                            type="text"
                                            placeholder="City"
                                            value={shipping.city}
                                            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="sf-checkout__cell">
                                        <input
                                            className="sf-input"
                                            type="text"
                                            placeholder="ZIP / Postal code"
                                            value={shipping.zip}
                                            onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                                        />
                                    </div>
                                    <div className="sf-checkout__cell">
                                        <input
                                            className="sf-input"
                                            type="text"
                                            placeholder="Country"
                                            value={shipping.country}
                                            onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                                        />
                                    </div>
                                    <div className="sf-checkout__cell">
                                        <input
                                            className="sf-input"
                                            type="tel"
                                            placeholder="Phone (optional)"
                                            value={shipping.phone}
                                            onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="sf-checkout__field">
                                <span className="sf-input__label">Payment method</span>
                                <div className="sf-pay-options">
                                    {PAYMENT_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={`sf-pay-option ${
                                                paymentMethod === opt.value ? 'sf-pay-option--selected' : ''
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment-method"
                                                value={opt.value}
                                                checked={paymentMethod === opt.value}
                                                onChange={() => setPaymentMethod(opt.value)}
                                            />
                                            <span className="sf-pay-option__icon">{opt.icon}</span>
                                            <span className="sf-pay-option__text">
                                                <span className="sf-pay-option__title">{opt.title}</span>
                                                <span className="sf-pay-option__desc">{opt.desc}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {paymentMethod !== 'stripe' && (
                                    <p className="sf-pay-note">
                                        You'll see our {paymentMethod === 'WISE' ? 'Wise' : 'Revolut'} account
                                        details to complete the transfer. Your order stays reserved while it arrives.
                                    </p>
                                )}
                            </div>
                            {error && <p className="sf-checkout__error">{error}</p>}
                            <button className="sf-btn sf-btn--primary" type="submit" disabled={loading}>
                                {loading
                                    ? 'Preparing...'
                                    : paymentMethod === 'stripe'
                                      ? `Continue to payment · €${totalPrice.toFixed(2)}`
                                      : `Reserve by bank transfer · €${totalPrice.toFixed(2)}`}
                            </button>
                        </form>
                    ) : clientSecret ? (
                        <Elements
                            stripe={stripePromise}
                            options={{ clientSecret, appearance: stripeAppearance }}
                        >
                            <PaymentForm
                                totalPrice={totalPrice}
                                orderId={orderId}
                                clearCart={clearCart}
                            />
                        </Elements>
                    ) : null}
                </div>

                <aside className="sf-cart__summary sf-checkout__summary">
                    <h2 className="sf-cart__summary-title">Order summary</h2>
                    {items.map((item) => (
                        <div className="sf-cart__row" key={item.id}>
                            <span>
                                {item.name} × {item.quantity}
                            </span>
                            <span>€{(item.priceWithVat * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="sf-cart__row sf-cart__row--total">
                        <span>Total</span>
                        <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default Checkout;
