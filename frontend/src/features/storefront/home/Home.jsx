import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../shared/api/api';
import ProductCard from '../../../components/storefront/ProductCard';

function PillarIcon({ type }) {
    const common = {
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };

    if (type === 'local') {
        return (
            <svg {...common}>
                <path d="M12 21s-7-4.5-7-10a7 7 0 1 1 14 0c0 5.5-7 10-7 10Z" />
                <circle cx="12" cy="11" r="2.5" />
            </svg>
        );
    }
    if (type === 'batch') {
        return (
            <svg {...common}>
                <path d="M12 2 2.5 7 12 12l9.5-5L12 2Z" />
                <path d="M2.5 17 12 22l9.5-5" />
                <path d="M2.5 12 12 17l9.5-5" />
            </svg>
        );
    }
    return (
        <svg {...common}>
            <path d="M12 3a9 9 0 1 0 9 9c0-1-.15-1.9-.44-2.7a5 5 0 0 1-6.86-6.86A9 9 0 0 0 12 3Z" />
            <path d="M17 3.5a2.5 2.5 0 0 1 3.5 3.5" />
        </svg>
    );
}

function WheatDecor() {
    return (
        <svg width="360" height="360" viewBox="0 0 100 100" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M50 90 C50 70 48 45 52 18" />
                <path d="M52 24 C62 22 70 16 74 8 M52 32 C64 30 72 24 76 16 M52 40 C64 38 72 32 76 24" />
                <path d="M50 24 C40 22 32 16 28 8 M50 32 C38 30 30 24 26 16 M50 40 C38 38 30 32 26 24" />
                <path d="M52 14 C58 8 62 6 68 4 M50 14 C44 8 40 6 34 4" />
            </g>
        </svg>
    );
}

function Home() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        api.get('/products', { params: { page: 0, size: 100 } })
            .then((response) => setProducts(response.data.content))
            .catch(() => setProducts([]));
    }, []);

    const featured = products.filter((p) => p.availableStock > 0).slice(0, 4);
    const showFeatured = featured.length >= 2;

    return (
        <div>
            <section className="sf-hero">
                <div className="sf-hero__content">
                    <span className="sf-hero__eyebrow">Crafted in Malta</span>
                    <h1 className="sf-hero__title">
                        Good things, made <em>slowly.</em>
                    </h1>
                    <p className="sf-hero__subtitle">
                        From sun-warmed stone and island grain, we craft small-batch goods with
                        patience, care and a little Maltese soul.
                    </p>
                    <div className="sf-hero__actions">
                        <Link to="/products" className="sf-btn sf-btn--primary">
                            Explore the shop
                        </Link>
                        <a href="#story" className="sf-btn sf-btn--ghost">
                            Our story
                        </a>
                    </div>
                </div>
                <div className="sf-hero__decor">
                    <WheatDecor />
                </div>
            </section>

            <section className="sf-pillars">
                <div className="sf-pillars__grid">
                    <div className="sf-pillar">
                        <div className="sf-pillar__icon">
                            <PillarIcon type="local" />
                        </div>
                        <h2 className="sf-pillar__title">Locally sourced</h2>
                        <p className="sf-pillar__text">
                            Ingredients and materials gathered from Maltese growers and makers.
                        </p>
                    </div>
                    <div className="sf-pillar">
                        <div className="sf-pillar__icon">
                            <PillarIcon type="batch" />
                        </div>
                        <h2 className="sf-pillar__title">Small-batch</h2>
                        <p className="sf-pillar__text">
                            Never mass-produced. Every run is limited, considered and finished by hand.
                        </p>
                    </div>
                    <div className="sf-pillar">
                        <div className="sf-pillar__icon">
                            <PillarIcon type="hand" />
                        </div>
                        <h2 className="sf-pillar__title">Crafted by hand</h2>
                        <p className="sf-pillar__text">
                            Slow processes, careful detail, and a signature on every piece.
                        </p>
                    </div>
                </div>
            </section>

            {showFeatured && (
                <section className="sf-section">
                    <div className="sf-section__header">
                        <div>
                            <span className="sf-section__eyebrow">From the shelf</span>
                            <h2 className="sf-section__title">Featured pieces</h2>
                        </div>
                        <Link to="/products" className="sf-section__link">
                            View all
                            <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                    <div className="sf-grid">
                        {featured.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            <section id="story" className="sf-story">
                <p className="sf-story__quote">
                    “We believe the best things can’t be rushed — that a loaf, a cloth, or a candle
                    carries the patience <span>of the hands</span> that made it.”
                </p>
                <p className="sf-story__attrib">— The MaltaLand workshop</p>
            </section>

            <section className="sf-cta">
                <div>
                    <h2 className="sf-cta__title">Bring a little Malta home.</h2>
                    <p className="sf-cta__text">Browse the full collection and find your next favourite.</p>
                </div>
                <div className="sf-cta__actions">
                    <Link to="/products" className="sf-btn sf-btn--dark">
                        Shop the collection
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Home;
