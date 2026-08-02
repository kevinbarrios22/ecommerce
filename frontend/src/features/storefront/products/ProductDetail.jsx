import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../shared/api/api';
import { useCart } from '../../../shared/contexts/CartContext';
import ProductCard from '../../../components/storefront/ProductCard';
import ProductImage from '../../../components/storefront/ProductImage';

function ProductDetail() {
    const { id } = useParams();
    return <ProductDetailView key={id} id={id} />;
}

function ProductDetailView({ id }) {
    const { addItem } = useCart();
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [added, setAdded] = useState(false);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        api.get(`/products/${id}`)
            .then(async (response) => {
                const data = response.data;
                setProduct(data);
                try {
                    const all = await api.get('/products', { params: { page: 0, size: 100 } });
                    const siblings = all.data.content.filter(
                        (p) => p.categoryId === data.categoryId && p.id !== data.id && p.availableStock > 0
                    );
                    setRelated(siblings.slice(0, 4));
                } catch {
                    setRelated([]);
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="sf-loading">
                <div className="sf-loading__spinner" />
                <p>Loading product...</p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="sf-error">
                <p>We couldn't find that product.</p>
                <Link to="/products" className="sf-btn sf-btn--primary" style={{ marginTop: '16px' }}>
                    Back to the shop
                </Link>
            </div>
        );
    }

    const outOfStock = product.availableStock === 0;
    const maxQty = Math.min(10, product.availableStock);

    const handleAdd = () => {
        addItem(product, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
    };

    return (
        <div>
            <Link to="/products" className="sf-section__link" style={{ marginBottom: '20px', display: 'inline-flex' }}>
                <span aria-hidden="true">&larr;</span> Back to the shop
            </Link>

            <div className="sf-detail">
                <div className="sf-detail__media">
                    <ProductImage product={product} />
                </div>

                <div className="sf-detail__info">
                    {product.categoryName && (
                        <span className="sf-detail__category">{product.categoryName}</span>
                    )}
                    <h1 className="sf-detail__name">{product.name}</h1>
                    <p className="sf-detail__price">€{product.priceWithVat}</p>
                    <p className={`sf-detail__stock ${outOfStock ? 'sf-detail__stock--out' : ''}`}>
                        {outOfStock
                            ? 'Currently out of stock'
                            : `${product.availableStock} available`}
                    </p>

                    {product.description && (
                        <div className="sf-detail__description">
                            <p>{product.description}</p>
                        </div>
                    )}

                    <div className="sf-detail__purchase">
                        {!outOfStock && (
                            <div className="sf-detail__qty">
                                <button
                                    className="sf-detail__qty-btn"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>
                                <span className="sf-detail__qty-value">{quantity}</span>
                                <button
                                    className="sf-detail__qty-btn"
                                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                                    disabled={quantity >= maxQty}
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>
                        )}
                        <button
                            className={`sf-btn sf-btn--primary ${added ? 'sf-btn--added' : ''}`}
                            onClick={handleAdd}
                            disabled={outOfStock}
                        >
                            {added
                                ? 'Added to cart!'
                                : outOfStock
                                  ? 'Out of stock'
                                  : 'Add to cart'}
                        </button>
                    </div>
                </div>

                {related.length > 0 && (
                    <div className="sf-detail__related">
                        <h2 className="sf-detail__related-title">You may also like</h2>
                        <div className="sf-grid">
                            {related.map((item) => (
                                <ProductCard key={item.id} product={item} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductDetail;
