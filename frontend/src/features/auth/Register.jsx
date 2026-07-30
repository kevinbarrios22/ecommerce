import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';

function Register() {
    const { register } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await register(form.name, form.email, form.password);
            localStorage.setItem('user', JSON.stringify(data));
            window.location.href = data.role === 'ADMIN' ? '/admin' : '/';
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <h1 className="page-title">Register</h1>
            <form className="auth-form" onSubmit={handleSubmit}>
                <input
                    className="search-input"
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
                <input
                    className="search-input"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                />
                <input
                    className="search-input"
                    type="password"
                    placeholder="Password (6+ characters)"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                />
                {error && <p className="auth-error">{error}</p>}
                <button className="btn" type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Register'}
                </button>
                <p className="auth-link">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;
