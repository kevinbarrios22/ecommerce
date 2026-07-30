import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

function ProductDetail() {
    const { id } = useParams();
    const { addItem } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        api.get(`/products/${id}`)
            .then((response) => {
                setProduct(response.data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <p>Loading product...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error">
                <p>Error loading product: {error}</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="error">
                <p>Product not found.</p>
            </div>
        );
    }

    return (
        <div className="product-detail">
            <Link to="/products" className="product-detail__back">← Back to products</Link>
            <div className="product-detail__card">
                <div className="product-detail__info">
                    <h1 className="product-detail__name">{product.name}</h1>
                    {product.categoryName && (
                        <p className="product-detail__category">{product.categoryName}</p>
                    )}
                    <p className="product-detail__price">€{product.priceWithVat}</p>
                    <p className="product-detail__stock">
                        {product.availableStock > 0
                            ? `${product.availableStock} in stock`
                            : 'Out of stock'}
                    </p>
                    <button
                        className={`btn ${added ? 'btn--added' : ''}`}
                        onClick={() => {
                            addItem(product);
                            setAdded(true);
                            setTimeout(() => setAdded(false), 1500);
                        }}
                        disabled={product.availableStock === 0}
                    >
                        {added ? 'Added!' : 'Add to cart'}
                    </button>
                    {product.description && (
                        <div className="product-detail__description">
                            <h3>Description</h3>
                            <p>{product.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;