import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../shared/contexts/CartContext';
import ProductImage from './ProductImage';

export default function ProductCard({ product }) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    const outOfStock = product.availableStock === 0;

    const handleAdd = () => {
        addItem(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <article className="sf-product-card">
            <Link to={`/products/${product.id}`} className="sf-product-card__link">
                <div className="sf-product-card__media">
                    <ProductImage product={product} />
                    {product.categoryName && (
                        <span className="sf-product-card__category">{product.categoryName}</span>
                    )}
                </div>
            </Link>
            <div className="sf-product-card__body">
                <Link to={`/products/${product.id}`} className="sf-product-card__name">
                    {product.name}
                </Link>
                <p className="sf-product-card__price">€{product.priceWithVat}</p>
                <p className={`sf-product-card__stock ${outOfStock ? 'sf-product-card__stock--out' : ''}`}>
                    {outOfStock ? 'Out of stock' : `${product.availableStock} in stock`}
                </p>
            </div>
            <div className="sf-product-card__footer">
                <button
                    className={`sf-btn sf-btn--primary sf-product-card__btn ${added ? 'sf-btn--added' : ''}`}
                    onClick={handleAdd}
                    disabled={outOfStock}
                >
                    {added ? 'Added!' : 'Add to cart'}
                </button>
            </div>
        </article>
    );
}
