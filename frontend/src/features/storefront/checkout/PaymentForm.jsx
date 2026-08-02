import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/api/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function PaymentForm({ totalPrice, orderId, clearCart }) {
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
            confirmParams: {
                return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
            },
        });

        if (confirmError) {
            setError(confirmError.message);
            setProcessing(false);
            return;
        }

        // Redirect-based methods (PayPal, Revolut Pay): follow the redirect.
        // Stripe.js does not navigate automatically with redirect: 'if_required',
        // so we send the customer to the external payment page. On return the
        // order-confirmation page confirms the order by orderId.
        if (paymentIntent?.status === 'requires_action' && paymentIntent?.next_action?.type === 'redirect_to_url') {
            window.location.href = paymentIntent.next_action.redirect_to_url.url;
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
        <form className="sf-checkout__form" onSubmit={handleSubmit}>
            <h2 className="sf-checkout__panel-title">Payment</h2>
            <PaymentElement />
            {error && <p className="sf-checkout__error">{error}</p>}
            <button className="sf-btn sf-btn--primary" type="submit" disabled={!stripe || !elements || processing}>
                {processing ? 'Processing...' : `Pay €${totalPrice.toFixed(2)}`}
            </button>
        </form>
    );
}

export default PaymentForm;
