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
        <div className="storefront">
            <div className="sf-auth">
                <Link to="/" className="sf-auth__logo">
                    <span className="sf-auth__logo-mark">M</span>
                    MaltaLand
                </Link>
                <div className="sf-auth__card">
                    <span className="sf-auth__eyebrow">Welcome back</span>
                    <h1 className="sf-auth__title">Sign in</h1>
                    <p className="sf-auth__sub">Good to see you again.</p>
                    <form className="sf-auth__form" onSubmit={handleSubmit}>
                        <div>
                            <label className="sf-input__label" htmlFor="login-email">
                                Email
                            </label>
                            <input
                                id="login-email"
                                className="sf-input"
                                type="email"
                                placeholder="jane@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="sf-input__label" htmlFor="login-password">
                                Password
                            </label>
                            <input
                                id="login-password"
                                className="sf-input"
                                type="password"
                                placeholder="Your password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>
                        {error && <p className="sf-checkout__error">{error}</p>}
                        <button className="sf-btn sf-btn--primary" type="submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                    <p className="sf-auth__link">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
