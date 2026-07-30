import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../shared/api/api';
import { useCart } from '../../../shared/contexts/CartContext';

function Products() {
    const { addItem } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [addedId, setAddedId] = useState(null);

    useEffect(() => {
        setLoading(true);
        const params = { page, size: 12 };
        if (search) params.name = search;
        api.get('/products', { params })
            .then((response) => {
                setProducts(response.data.content);
                setTotalPages(response.data.totalPages);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [page, search]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <p>Loading products...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error">
                <p>Error loading products: {error}</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="page-title">Products</h1>
            <div className="products-toolbar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search products..."
                    value={search}
                    onChange={handleSearch}
                />
            </div>
            {products.length === 0 ? (
                <div className="empty">
                    <p>No products found.</p>
                </div>
            ) : (
                <>
                    <div className="product-grid">
                        {products.map((product) => (
                            <div key={product.id} className="product-card">
                                <Link to={`/products/${product.id}`} className="product-card__link">
                                    <div className="product-card__body">
                                        <h2 className="product-card__name">{product.name}</h2>
                                        <p className="product-card__price">€{product.priceWithVat}</p>
                                        <p className="product-card__stock">
                                            {product.availableStock > 0
                                                ? `${product.availableStock} in stock`
                                                : 'Out of stock'}
                                        </p>
                                    </div>
                                </Link>
                                <div className="product-card__footer">
                                    <button
                                        className={`btn ${addedId === product.id ? 'btn--added' : ''}`}
                                        onClick={() => {
                                            addItem(product);
                                            setAddedId(product.id);
                                            setTimeout(() => setAddedId(null), 1500);
                                        }}
                                        disabled={product.availableStock === 0}
                                    >
                                        {addedId === product.id ? 'Added!' : 'Add to cart'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn--secondary"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                Previous
                            </button>
                            <span className="pagination__info">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                className="btn btn--secondary"
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Products;
