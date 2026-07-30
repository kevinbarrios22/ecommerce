import { useEffect, useState } from 'react';
import api from '../../../shared/api/api';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard')
            .then((res) => { setStats(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="loading"><div className="loading__spinner" /><p>Loading dashboard...</p></div>;
    }

    return (
        <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="admin-dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="admin-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '2rem', margin: '0' }}>{stats?.ordersToday ?? '-'}</h3>
                    <p style={{ margin: '0.5rem 0 0', color: '#666' }}>Orders Today</p>
                </div>
                <div className="admin-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '2rem', margin: '0' }}>{stats?.ordersThisWeek ?? '-'}</h3>
                    <p style={{ margin: '0.5rem 0 0', color: '#666' }}>Orders This Week</p>
                </div>
                <div className="admin-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '2rem', margin: '0' }}>&euro;{stats?.revenue ?? '0.00'}</h3>
                    <p style={{ margin: '0.5rem 0 0', color: '#666' }}>Total Revenue</p>
                </div>
                <div className="admin-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '2rem', margin: '0', color: (stats?.lowStockProducts ?? 0) > 0 ? '#ef4444' : '#10b981' }}>{stats?.lowStockProducts ?? '-'}</h3>
                    <p style={{ margin: '0.5rem 0 0', color: '#666' }}>Low Stock Products</p>
                </div>
                <div className="admin-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '2rem', margin: '0', color: (stats?.pendingOrders ?? 0) > 0 ? '#f59e0b' : '#10b981' }}>{stats?.pendingOrders ?? '-'}</h3>
                    <p style={{ margin: '0.5rem 0 0', color: '#666' }}>Pending Orders</p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
