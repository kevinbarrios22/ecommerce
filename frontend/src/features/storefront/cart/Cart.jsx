import { Link } from 'react-router-dom';
import { useCart } from '../../../shared/contexts/CartContext';

function Cart() {
    const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart();

    if (items.length === 0) {
        return (
            <div className="empty">
                <h1 className="page-title">Cart</h1>
                <p>Your cart is empty.</p>
                <Link to="/products" className="btn">Browse products</Link>
            </div>
        );
    }

    return (
        <div>
            <h1 className="page-title">Cart ({totalItems} items)</h1>
            <div className="cart__items">
                {items.map((item) => (
                    <div key={item.id} className="cart__item">
                        <div className="cart__item-info">
                            <Link to={`/products/${item.id}`} className="cart__item-name">
                                {item.name}
                            </Link>
                            <p className="cart__item-price">€{item.priceWithVat} each</p>
                        </div>
                        <div className="cart__item-actions">
                            <button
                                className="cart__qty-btn"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                                −
                            </button>
                            <span className="cart__qty">{item.quantity}</span>
                            <button
                                className="cart__qty-btn"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                                +
                            </button>
                            <button
                                className="cart__remove-btn"
                                onClick={() => removeItem(item.id)}
                            >
                                Remove
                            </button>
                        </div>
                        <p className="cart__item-subtotal">
                            €{(item.priceWithVat * item.quantity).toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>
            <div className="cart__footer">
                <div className="cart__total">
                    <strong>Total:</strong> €{totalPrice.toFixed(2)}
                </div>
                <div className="cart__actions">
                    <button className="btn btn--secondary" onClick={clearCart}>
                        Clear cart
                    </button>
                    <Link to="/checkout" className="btn">Checkout</Link>
                </div>
            </div>
        </div>
    );
}

export default Cart;
