import { Link } from 'react-router-dom';
import { useCart } from '../../../shared/contexts/CartContext';
import ProductImage from '../../../components/storefront/ProductImage';

function EmptyBagIcon() {
    return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 7h12l1 13H5L6 7Z" />
            <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
    );
}

function Cart() {
    const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart();

    if (items.length === 0) {
        return (
            <div className="sf-cart__empty">
                <div className="sf-cart__empty-icon">
                    <EmptyBagIcon />
                </div>
                <h1 className="sf-cart__empty-title">Your cart is empty</h1>
                <p className="sf-cart__empty-text">
                    Discover small-batch pieces from the MaltaLand workshop.
                </p>
                <Link to="/products" className="sf-btn sf-btn--primary">
                    Browse the shop
                </Link>
            </div>
        );
    }

    return (
        <div>
            <header className="sf-page__header">
                <span className="sf-page__eyebrow">Your selection</span>
                <h1 className="sf-page__title">
                    Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </h1>
            </header>

            <div className="sf-cart">
                <div className="sf-cart__items">
                    {items.map((item) => (
                        <div key={item.id} className="sf-cart__item">
                            <div className="sf-cart__thumb">
                                <ProductImage product={item} className="sf-media--thumb" />
                            </div>
                            <div className="sf-cart__body">
                                <Link to={`/products/${item.id}`} className="sf-cart__name">
                                    {item.name}
                                </Link>
                                <p className="sf-cart__meta">
                                    €{item.priceWithVat} each
                                    {item.categoryName ? ` · ${item.categoryName}` : ''}
                                </p>
                                <div className="sf-cart__stepper">
                                    <button
                                        className="sf-cart__qty-btn"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>
                                    <span className="sf-cart__qty-value">{item.quantity}</span>
                                    <button
                                        className="sf-cart__qty-btn"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>
                                <button className="sf-cart__remove" onClick={() => removeItem(item.id)}>
                                    Remove
                                </button>
                            </div>
                            <div className="sf-cart__right">
                                <p className="sf-cart__subtotal">
                                    €{(item.priceWithVat * item.quantity).toFixed(2)}
                                </p>
                                <p className="sf-cart__unit">
                                    €{item.priceWithVat} / unit
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <aside className="sf-cart__summary">
                    <h2 className="sf-cart__summary-title">Order summary</h2>
                    <div className="sf-cart__row">
                        <span>Subtotal ({totalItems} items)</span>
                        <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="sf-cart__row">
                        <span>Shipping</span>
                        <span>Calculated at checkout</span>
                    </div>
                    <div className="sf-cart__row sf-cart__row--total">
                        <span>Total</span>
                        <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                    <Link to="/checkout" className="sf-btn sf-btn--primary">
                        Proceed to checkout
                    </Link>
                    <Link to="/products" className="sf-btn sf-btn--ghost">
                        Continue shopping
                    </Link>
                    <button className="sf-btn sf-btn--ghost" onClick={clearCart}>
                        Clear cart
                    </button>
                </aside>
            </div>
        </div>
    );
}

export default Cart;
