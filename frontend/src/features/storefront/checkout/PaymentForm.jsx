import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/api/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function PaymentForm({ items, form, totalPrice, orderId, clearCart }) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const confirmOrder = async (id) => {
        try {
            const res = await api.post(`/orders/${id}/confirm`);
            return res.data;
        } catch (err) {
            // Retryable states: not yet payable, still pending, etc.
            const status = err.response?.status;
            if (status === 400 || status === 404 || status === 409 || status === 500) return null;
            throw err;
        }
    };

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
            // The webhook is the authoritative source; this is a synchronous
            // backstop for instant feedback. If Stripe has not propagated yet,
            // poll briefly (the confirm endpoint is idempotent).
            let order = await confirmOrder(orderId);
            for (let attempt = 0; !order && attempt < 5; attempt++) {
                await sleep(1500);
                order = await confirmOrder(orderId);
            }

            if (!order) {
                throw new Error(
                    'We have received your payment and will confirm your order automatically. ' +
                    `Reference: ${paymentIntent.id}`,
                );
            }

            clearCart();
            navigate('/order-confirmation', { state: { order } });
        } catch (err) {
            setError(err.message || 'Unable to confirm your order right now. Please try again.');
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
