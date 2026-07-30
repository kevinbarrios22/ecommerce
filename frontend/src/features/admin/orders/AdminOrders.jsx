import { useEffect, useState } from 'react';
import api from '../../../shared/api/api';

const STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [filters, setFilters] = useState({ status: '', email: '', start: '', end: '' });

    const buildQuery = () => {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.email) params.set('email', filters.email);
        if (filters.start) params.set('start', filters.start);
        if (filters.end) params.set('end', filters.end);
        const qs = params.toString();
        return qs ? `/orders?${qs}` : '/orders';
    };

    const fetchOrders = () => {
        setLoading(true);
        setSelected(null);
        api.get(buildQuery())
            .then((res) => { setOrders(res.data); setLoading(false); })
            .catch((err) => { setError(err.message); setLoading(false); });
    };

    useEffect(fetchOrders, [filters.status]);

    const handleStatusChange = (id, newStatus) => {
        api.put(`/orders/${id}/status`, { status: newStatus })
            .then(() => fetchOrders())
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    const nextStatus = (current) => {
        const flow = { PENDING: 'PAID', PAID: 'SHIPPED', SHIPPED: 'DELIVERED' };
        return flow[current];
    };

    const statusBadge = (s) => {
        const colors = { PENDING: '#f59e0b', PAID: '#3b82f6', SHIPPED: '#8b5cf6', DELIVERED: '#10b981', CANCELLED: '#ef4444' };
        return <span style={{ background: colors[s] || '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{s}</span>;
    };

    if (loading && orders.length === 0) {
        return <div className="loading"><div className="loading__spinner" /><p>Loading orders...</p></div>;
    }

    if (error && orders.length === 0) {
        return <div className="error"><p>Error: {error}</p></div>;
    }

    if (selected) {
        const o = selected;
        return (
            <div>
                <button className="btn btn--secondary" onClick={() => setSelected(null)} style={{ marginBottom: '1rem' }}>&larr; Back to orders</button>
                <h1 className="page-title">Order #{o.id}</h1>
                <div className="admin-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                    <p><strong>Status:</strong> {statusBadge(o.status)}</p>
                    <p><strong>Customer:</strong> {o.customerName} ({o.customerEmail})</p>
                    <p><strong>Total:</strong> &euro;{o.total}</p>
                    <p><strong>Created:</strong> {o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</p>
                    <p><strong>Payment Intent:</strong> {o.stripePaymentIntentId || '-'}</p>
                    <p><strong>Paid At:</strong> {o.paidAt ? new Date(o.paidAt).toLocaleString() : '-'}</p>
                </div>

                {nextStatus(o.status) && (
                    <button className="btn" onClick={() => handleStatusChange(o.id, nextStatus(o.status))} style={{ marginBottom: '1rem' }}>
                        Mark as {nextStatus(o.status)}
                    </button>
                )}
                {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
                    <button className="btn btn--secondary" onClick={() => handleStatusChange(o.id, 'CANCELLED')} style={{ marginBottom: '1rem', marginLeft: '0.5rem' }}>
                        Cancel order
                    </button>
                )}

                <h2>Items</h2>
                <table className="admin-table">
                    <thead>
                        <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                        {o.items?.map((item, i) => (
                            <tr key={i}>
                                <td>{item.productName}</td>
                                <td>{item.quantity}</td>
                                <td>&euro;{item.unitPrice}</td>
                                <td>&euro;{item.subtotal}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div>
            <h1 className="page-title">Orders</h1>

            <div className="admin-filters" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="search-input" style={{ width: 'auto' }}>
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="search-input" placeholder="Search by email..." value={filters.email}
                       onChange={(e) => setFilters({ ...filters, email: e.target.value })} style={{ width: '200px' }} />
                <input className="search-input" type="date" value={filters.start}
                       onChange={(e) => setFilters({ ...filters, start: e.target.value })} style={{ width: 'auto' }} />
                <input className="search-input" type="date" value={filters.end}
                       onChange={(e) => setFilters({ ...filters, end: e.target.value })} style={{ width: 'auto' }} />
                <button className="btn" onClick={fetchOrders}>Search</button>
                <button className="btn btn--secondary" onClick={() => setFilters({ status: '', email: '', start: '', end: '' })}>Clear</button>
            </div>

            {orders.length === 0 ? (
                <p className="empty">No orders found.</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id}>
                                <td>#{o.id}</td>
                                <td>{o.customerName}</td>
                                <td>{o.customerEmail}</td>
                                <td>&euro;{o.total}</td>
                                <td>{statusBadge(o.status)}</td>
                                <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}</td>
                                <td>{o.items?.length || 0}</td>
                                <td>
                                    <button className="btn btn--secondary" onClick={() => setSelected(o)}>View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminOrders;
