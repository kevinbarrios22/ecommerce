import { useEffect, useMemo, useState } from 'react';
import api from '../../../shared/api/api';
import ProductCard from '../../../components/storefront/ProductCard';

const PAGE_SIZE = 12;

function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

function EmptyBagIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 7h12l1 13H5L6 7Z" />
            <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
    );
}

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [page, setPage] = useState(0);

    useEffect(() => {
        Promise.all([
            api.get('/products', { params: { page: 0, size: 100 } }),
            api.get('/categories'),
        ])
            .then(([productsRes, categoriesRes]) => {
                setProducts(productsRes.data.content);
                setCategories(categoriesRes.data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return products.filter((p) => {
            const matchesCategory = activeCategory == null || p.categoryId === activeCategory;
            const matchesSearch = !term || p.name.toLowerCase().includes(term);
            return matchesCategory && matchesSearch;
        });
    }, [products, search, activeCategory]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const selectCategory = (id) => {
        setActiveCategory((prev) => (prev === id ? null : id));
        setPage(0);
    };

    const resetFilters = () => {
        setSearch('');
        setActiveCategory(null);
        setPage(0);
    };

    if (loading) {
        return (
            <div className="sf-loading">
                <div className="sf-loading__spinner" />
                <p>Loading products...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sf-error">
                <p>We couldn't load the shop right now. Please try again.</p>
            </div>
        );
    }

    return (
        <div>
            <header className="sf-page__header">
                <span className="sf-page__eyebrow">The collection</span>
                <h1 className="sf-page__title">Shop</h1>
                <p className="sf-page__subtitle">
                    Thoughtfully made pieces from the MaltaLand workshop — each one small-batch
                    and finished by hand.
                </p>
            </header>

            <div className="sf-toolbar">
                <div className="sf-search">
                    <span className="sf-search__icon">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        className="sf-search__input"
                        placeholder="Search products..."
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
                {categories.length > 0 && (
                    <div className="sf-chips">
                        <button
                            className={`sf-chips__chip ${activeCategory == null ? 'sf-chips__chip--active' : ''}`}
                            onClick={() => selectCategory(null)}
                        >
                            All
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={`sf-chips__chip ${activeCategory === category.id ? 'sf-chips__chip--active' : ''}`}
                                onClick={() => selectCategory(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {pageItems.length === 0 ? (
                <div className="sf-empty">
                    <div className="sf-empty__icon">
                        <EmptyBagIcon />
                    </div>
                    <h2 className="sf-empty__title">No products found</h2>
                    <p className="sf-empty__text">
                        Try a different search or category.
                    </p>
                    <button
                        className="sf-btn sf-btn--primary"
                        onClick={resetFilters}
                    >
                        Reset filters
                    </button>
                </div>
            ) : (
                <>
                    <div className="sf-grid">
                        {pageItems.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="sf-pagination">
                            <button
                                className="sf-btn sf-btn--ghost sf-btn--sm"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={safePage === 0}
                            >
                                Previous
                            </button>
                            <span className="sf-pagination__info">
                                Page {safePage + 1} of {totalPages}
                            </span>
                            <button
                                className="sf-btn sf-btn--ghost sf-btn--sm"
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={safePage >= totalPages - 1}
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
