import { CartProvider } from '../shared/contexts/CartContext';
import StorefrontHeader from '../components/storefront/StorefrontHeader';
import StorefrontFooter from '../components/storefront/StorefrontFooter';

export default function StorefrontLayout({ children }) {
    return (
        <CartProvider>
            <div className="storefront">
                <StorefrontHeader />
                <main className="main">{children}</main>
                <StorefrontFooter />
            </div>
        </CartProvider>
    );
}
