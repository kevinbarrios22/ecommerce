import { useCallback, useEffect, useState } from 'react';
import api from '../../../shared/api/api';

const STAFF_ROLES = ['ADMIN', 'STAFF'];
const EMPTY_FORM = { name: '', email: '', password: '', role: 'ADMIN' };

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roleFilter, setRoleFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [resetId, setResetId] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    const fetchUsers = useCallback(() => {
        const params = roleFilter ? { role: roleFilter } : {};
        api.get('/admin/users', { params })
            .then((res) => {
                setUsers(res.data);
                setError(null);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreate = (e) => {
        e.preventDefault();
        api.post('/admin/users', form)
            .then(() => {
                setForm(EMPTY_FORM);
                setShowCreate(false);
                fetchUsers();
            })
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    const handleResetPassword = (id) => {
        if (!newPassword.trim()) return;
        if (!window.confirm('Reset this staff member\'s password?')) return;
        api.post(`/admin/users/${id}/reset-password`, { newPassword })
            .then(() => {
                setResetId(null);
                setNewPassword('');
                alert('Password updated.');
            })
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    const handleRoleChange = (id, role) => {
        if (!window.confirm(`Change role of this staff member to ${role}?`)) return;
        api.patch(`/admin/users/${id}/role`, { role })
            .then(fetchUsers)
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this staff account? This cannot be undone.')) return;
        api.delete(`/admin/users/${id}`)
            .then(fetchUsers)
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    if (loading && users.length === 0) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <p>Loading staff accounts...</p>
            </div>
        );
    }

    if (error && users.length === 0) {
        return (
            <div className="error">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Staff accounts</h1>
                <button className="btn" onClick={() => setShowCreate((v) => !v)}>
                    {showCreate ? 'Cancel' : 'Add staff'}
                </button>
            </div>

            <p className="empty" style={{ textAlign: 'left', padding: '0 0 1rem' }}>
                Only accounts that manage the store (ADMIN / STAFF) are listed here. Customer
                accounts are private and never exposed.
            </p>

            {showCreate && (
                <form className="admin-form" onSubmit={handleCreate}>
                    <h2>New staff account</h2>
                    <div className="admin-form__grid">
                        <input
                            className="search-input"
                            placeholder="Name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                        <input
                            className="search-input"
                            placeholder="Email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                        <input
                            className="search-input"
                            placeholder="Password (min. 8 chars)"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                        <select
                            className="search-input"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            {STAFF_ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-form__actions">
                        <button className="btn" type="submit">Create</button>
                    </div>
                </form>
            )}

            <div className="admin-filters">
                <select
                    className="search-input"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{ width: 'auto' }}
                >
                    <option value="">All staff roles</option>
                    {STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            </div>

            {users.length === 0 ? (
                <p className="empty">No staff accounts found.</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Registered</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>
                                    <select
                                        className="search-input"
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        style={{ width: 'auto', padding: '4px 8px', fontSize: '0.85rem' }}
                                    >
                                        {STAFF_ROLES.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>{u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : '-'}</td>
                                <td>
                                    {resetId === u.id ? (
                                        <span style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                                            <input
                                                className="search-input"
                                                type="password"
                                                placeholder="New password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                style={{ width: '160px', padding: '6px 8px' }}
                                            />
                                            <button className="btn btn--secondary" onClick={() => handleResetPassword(u.id)}>
                                                Save
                                            </button>
                                            <button
                                                className="btn btn--secondary"
                                                onClick={() => {
                                                    setResetId(null);
                                                    setNewPassword('');
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                            <button className="btn btn--secondary" onClick={() => setResetId(u.id)}>
                                                Reset password
                                            </button>
                                            <button
                                                className="btn btn--secondary"
                                                style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.4)' }}
                                                onClick={() => handleDelete(u.id)}
                                            >
                                                Delete
                                            </button>
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Users;
