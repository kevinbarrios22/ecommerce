import { useState } from 'react';

function initials(name = '') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('') || 'ML';
}

export default function ProductImage({ product, className = '' }) {
    const [error, setError] = useState(false);
    const hasImage = product.imageUrl && !error;

    return (
        <div className={`sf-media ${className}`}>
            {hasImage ? (
                <img
                    className="sf-media__img"
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    onError={() => setError(true)}
                />
            ) : (
                <div className="sf-media__placeholder">
                    <span className="sf-media__monogram">{initials(product.name)}</span>
                </div>
            )}
        </div>
    );
}
