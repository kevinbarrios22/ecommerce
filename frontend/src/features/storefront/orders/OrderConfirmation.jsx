import { useLocation, Link } from 'react-router-dom';

function OrderConfirmation() {
    const { state } = useLocation();
    const order = state?.order;

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
