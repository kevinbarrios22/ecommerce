import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';

function Login() {
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await login(form.email, form.password);
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
            <h1 className="page-title">Login</h1>
            <form className="auth-form" onSubmit={handleSubmit}>
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
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
                {error && <p className="auth-error">{error}</p>}
                <button className="btn" type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                <p className="auth-link">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
