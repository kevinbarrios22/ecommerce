import { Routes, Route } from 'react-router-dom';
import AdminRoute from './guards/AdminRoute';
import AdminLayout from '../layouts/AdminLayout';
import StorefrontLayout from '../layouts/StorefrontLayout';

import Products from '../features/storefront/products/Products';
import ProductDetail from '../features/storefront/products/ProductDetail';
import Home from '../features/storefront/home/Home';
import Cart from '../features/storefront/cart/Cart';
import Checkout from '../features/storefront/checkout/Checkout';
import OrderConfirmation from '../features/storefront/orders/OrderConfirmation';
import OrderTrack from '../features/storefront/orders/OrderTrack';
import MyOrders from '../features/storefront/orders/MyOrders';
import Dashboard from '../features/admin/dashboard/Dashboard';
import AdminProducts from '../features/admin/products/AdminProducts';
import AdminOrders from '../features/admin/orders/AdminOrders';
import Users from '../features/admin/users/Users';
import Categories from '../features/admin/categories/Categories';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/admin" element={<AdminRoute><AdminLayout><Dashboard /></AdminLayout></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminLayout><AdminProducts /></AdminLayout></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminLayout><Categories /></AdminLayout></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminLayout><AdminOrders /></AdminLayout></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminLayout><Users /></AdminLayout></AdminRoute>} />

            <Route path="/" element={<StorefrontLayout><Home /></StorefrontLayout>} />
            <Route path="/products" element={<StorefrontLayout><Products /></StorefrontLayout>} />
            <Route path="/products/:id" element={<StorefrontLayout><ProductDetail /></StorefrontLayout>} />
            <Route path="/cart" element={<StorefrontLayout><Cart /></StorefrontLayout>} />
            <Route path="/checkout" element={<StorefrontLayout><Checkout /></StorefrontLayout>} />
            <Route path="/order-confirmation" element={<StorefrontLayout><OrderConfirmation /></StorefrontLayout>} />
            <Route path="/track" element={<StorefrontLayout><OrderTrack /></StorefrontLayout>} />
            <Route path="/account/orders" element={<StorefrontLayout><MyOrders /></StorefrontLayout>} />
        </Routes>
    );
}
