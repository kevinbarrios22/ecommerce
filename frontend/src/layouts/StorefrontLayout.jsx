import { CartProvider } from '../shared/contexts/CartContext';
import Header from '../shared/components/Header';
import Footer from '../shared/components/Footer';

export default function StorefrontLayout({ children }) {
    return (
        <CartProvider>
            <Header />
            <main className="main">
                {children}
            </main>
            <Footer />
        </CartProvider>
    );
}
