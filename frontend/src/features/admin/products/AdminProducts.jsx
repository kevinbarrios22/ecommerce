import { useEffect, useState } from 'react';
import api from '../../../shared/api/api';

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', imageUrl: '', categoryId: '', vatPercentage: '' });
    const [categories, setCategories] = useState([]);

    const fetchProducts = () => {
        api.get('/products?size=100')
            .then((res) => {
                setProducts(res.data.content);
                setLoading(false);
            })
            .catch((err) => { setError(err.message); setLoading(false); });
    };

    const fetchCategories = () => {
        api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
    };

    useEffect(() => { fetchProducts(); fetchCategories(); }, []);

    const resetForm = () => {
        setForm({ name: '', description: '', price: '', stock: '', imageUrl: '', categoryId: '', vatPercentage: '' });
        setEditing(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            name: form.name,
            description: form.description || null,
            price: parseFloat(form.price),
            stock: parseInt(form.stock),
            imageUrl: form.imageUrl || null,
            categoryId: parseInt(form.categoryId),
            vatPercentage: form.vatPercentage ? parseInt(form.vatPercentage) : null,
        };

        const request = editing
            ? api.put(`/products/${editing}`, payload)
            : api.post('/products', payload);

        request
            .then(() => { resetForm(); fetchProducts(); })
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    const handleEdit = (p) => {
        setEditing(p.id);
        setForm({
            name: p.name,
            description: p.description || '',
            price: String(p.price),
            stock: String(p.stock),
            imageUrl: p.imageUrl || '',
            categoryId: String(p.categoryId || ''),
            vatPercentage: String(p.vatPercentage || ''),
        });
    };

    const handleDelete = (id) => {
        if (!window.confirm('Deactivate this product?')) return;
        api.delete(`/products/${id}`)
            .then(fetchProducts)
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    const handleToggleActive = (id) => {
        api.patch(`/products/${id}/toggle-active`)
            .then(fetchProducts)
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    if (loading && products.length === 0) {
        return <div className="loading"><div className="loading__spinner" /><p>Loading products...</p></div>;
    }

    if (error && products.length === 0) {
        return <div className="error"><p>Error: {error}</p></div>;
    }

    return (
        <div>
            <h1 className="page-title">Products</h1>

            <form className="admin-form" onSubmit={handleSubmit}>
                <h2>{editing ? 'Edit Product' : 'New Product'}</h2>
                <div className="admin-form__grid">
                    <input className="search-input" placeholder="Name" value={form.name}
                           onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <textarea className="search-input" placeholder="Description" value={form.description}
                              onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <input className="search-input" type="number" step="0.01" placeholder="Price" value={form.price}
                           onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                    <input className="search-input" type="number" placeholder="Stock" value={form.stock}
                           onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                    <input className="search-input" type="number" placeholder="VAT %" value={form.vatPercentage}
                           onChange={(e) => setForm({ ...form, vatPercentage: e.target.value })} />
                    <input className="search-input" placeholder="Image URL" value={form.imageUrl}
                           onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                    <select className="search-input" value={form.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                        <option value="">Select category</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="admin-form__actions">
                    <button className="btn" type="submit">{editing ? 'Update' : 'Create'}</button>
                    {editing && <button className="btn btn--secondary" type="button" onClick={resetForm}>Cancel</button>}
                </div>
            </form>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Reserved</th>
                        <th>Available</th>
                        <th>Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length === 0 ? (
                        <tr><td colSpan={8} className="empty">No products yet.</td></tr>
                    ) : products.map((p) => (
                        <tr key={p.id} style={{ opacity: p.active ? 1 : 0.5 }}>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>&euro;{p.price}</td>
                            <td>{p.stock}</td>
                            <td>{p.reservedStock || 0}</td>
                            <td>{p.availableStock}</td>
                            <td>
                                <button className={`btn btn--small ${p.active ? 'btn--success' : 'btn--secondary'}`}
                                        onClick={() => handleToggleActive(p.id)}
                                        title={p.active ? 'Deactivate' : 'Activate'}>
                                    {p.active ? 'Active' : 'Inactive'}
                                </button>
                            </td>
                            <td>
                                <button className="btn btn--secondary" onClick={() => handleEdit(p)}>Edit</button>
                                <button className="btn btn--secondary" onClick={() => handleDelete(p.id)} style={{ marginLeft: '0.25rem' }}>Deactivate</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminProducts;
