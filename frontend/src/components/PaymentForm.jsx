import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function PaymentForm({ items, form, totalPrice, clearCart }) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (confirmError) {
            setError(confirmError.message);
            setProcessing(false);
            return;
        }

        if (paymentIntent?.status !== 'succeeded') {
            setError('Payment failed. Please try again.');
            setProcessing(false);
            return;
        }

        try {
            const payload = {
                customerName: form.customerName,
                customerEmail: form.customerEmail,
                items: items.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity,
                })),
                stripePaymentIntentId: paymentIntent.id,
            };

            const res = await api.post('/orders', payload);
            clearCart();
            navigate('/order-confirmation', { state: { order: res.data } });
        } catch (err) {
            setError('Order created but failed to save. Please contact support with your payment ID: ' + paymentIntent.id);
            setProcessing(false);
        }
    };

    return (
        <form className="checkout__form" onSubmit={handleSubmit}>
            <h2>Card details</h2>
            <PaymentElement />
            {error && <p className="error">{error}</p>}
            <button className="btn" type="submit" disabled={!stripe || !elements || processing}>
                {processing ? 'Processing...' : `Pay €${totalPrice.toFixed(2)}`}
            </button>
        </form>
    );
}

export default PaymentForm;
