import { useEffect, useState } from 'react';
import api from '../../../shared/api/api';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', slug: '' });

    const fetchCategories = () => {
        api.get('/categories')
            .then((res) => {
                setCategories(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(fetchCategories, []);

    const resetForm = () => {
        setForm({ name: '', slug: '' });
        setEditing(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.slug.trim()) return;

        const request = editing
            ? api.put(`/categories/${editing}`, form)
            : api.post('/categories', form);

        request
            .then(() => {
                resetForm();
                fetchCategories();
            })
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    const handleEdit = (cat) => {
        setEditing(cat.id);
        setForm({ name: cat.name, slug: cat.slug });
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this category?')) return;
        api.delete(`/categories/${id}`)
            .then(fetchCategories)
            .catch((err) => alert(err.response?.data?.message || err.message));
    };

    if (loading && categories.length === 0) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <p>Loading categories...</p>
            </div>
        );
    }

    if (error && categories.length === 0) {
        return (
            <div className="error">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="page-title">Categories</h1>

            <form className="category-form" onSubmit={handleSubmit}>
                <input
                    className="search-input"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
                <input
                    className="search-input"
                    placeholder="Slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required
                />
                <div className="category-form__actions">
                    <button className="btn" type="submit">
                        {editing ? 'Update' : 'Create'}
                    </button>
                    {editing && (
                        <button className="btn btn--secondary" type="button" onClick={resetForm}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="category-list">
                {categories.length === 0 ? (
                    <p className="empty">No categories yet.</p>
                ) : (
                    categories.map((cat) => (
                        <div key={cat.id} className="category-item">
                            <div className="category-item__info">
                                <span className="category-item__name">{cat.name}</span>
                                <span className="category-item__slug">/{cat.slug}</span>
                            </div>
                            <div className="category-item__actions">
                                <button className="btn btn--secondary" onClick={() => handleEdit(cat)}>
                                    Edit
                                </button>
                                <button className="btn btn--secondary" onClick={() => handleDelete(cat.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Categories;
