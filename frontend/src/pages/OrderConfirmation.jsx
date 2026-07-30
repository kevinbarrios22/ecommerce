import { Link, useLocation, Navigate } from 'react-router-dom';

function OrderConfirmation() {
    const location = useLocation();
    const order = location.state?.order;

    if (!order) return <Navigate to="/" replace />;

    return (
        <div className="order-confirmation">
            <div className="order-confirmation__icon">✓</div>
            <h1>Order confirmed!</h1>
            <p className="order-confirmation__id">Order #{order.id}</p>
            <p className="order-confirmation__status">Status: {order.status}</p>
            <p className="order-confirmation__total">
                Total: €{order.total}
            </p>
            <p className="order-confirmation__date">
                {new Date(order.createdAt).toLocaleString()}
            </p>
            <div className="order-confirmation__items">
                <h3>Items</h3>
                {order.items.map((item, i) => (
                    <div key={i} className="order-confirmation__item">
                        <span>{item.productName} x{item.quantity}</span>
                        <span>€{item.subtotal}</span>
                    </div>
                ))}
            </div>
            <Link to="/products" className="btn">Continue shopping</Link>
        </div>
    );
}

export default OrderConfirmation;
