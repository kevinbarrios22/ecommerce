import { Link } from 'react-router-dom';

function BankIcon() {
    return (
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" />
        </svg>
    );
}

function TransferInstructions({ data, order }) {
    const providerName = data.provider === 'WISE' ? 'Wise' : 'Revolut';
    const reservedUntil = data.expiresAt
        ? new Date(data.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
        : null;

    return (
        <div className="sf-confirmation sf-confirmation--transfer">
            <div className="sf-confirmation__check sf-confirmation__check--bank">
                <BankIcon />
            </div>
            <h1 className="sf-confirmation__title">Almost there!</h1>
            <p className="sf-confirmation__sub">
                {order
                    ? `Order #${order.id} is reserved while your transfer arrives.`
                    : `Order #${data.orderId} is reserved while your transfer arrives.`}
            </p>
            <p className="sf-confirmation__id">
                Use the reference below when you make the transfer
            </p>

            <div className="sf-confirmation__card sf-transfer-card">
                <h2>Send your transfer to {providerName}</h2>
                <div className="sf-transfer-row">
                    <span>Account holder</span>
                    <strong>{data.accountHolder}</strong>
                </div>
                <div className="sf-transfer-row">
                    <span>IBAN</span>
                    <strong className="sf-transfer-mono">{data.iban}</strong>
                </div>
                <div className="sf-transfer-row">
                    <span>BIC / SWIFT</span>
                    <strong className="sf-transfer-mono">{data.bic}</strong>
                </div>
                <div className="sf-transfer-row">
                    <span>Amount</span>
                    <strong>€{Number(data.amount).toFixed(2)}</strong>
                </div>
                <div className="sf-transfer-row">
                    <span>Your reference</span>
                    <strong className="sf-transfer-reference">{data.reference}</strong>
                </div>
                {reservedUntil && (
                    <div className="sf-transfer-row">
                        <span>Reserved until</span>
                        <strong>{reservedUntil}</strong>
                    </div>
                )}
            </div>

            <p className="sf-confirmation__note">
                We've also emailed the transfer details to you, in case you need them again.
                Transfers usually arrive in 1–2 business days. As soon as we see yours, we'll confirm
                your order by email — no further action needed. If the transfer hasn't arrived by the
                reserved date, the reservation is released automatically.
            </p>

            <Link to="/products" className="sf-btn sf-btn--primary">
                Continue shopping
            </Link>
        </div>
    );
}

export default TransferInstructions;
