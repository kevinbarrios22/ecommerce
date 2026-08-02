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
        <div className="storefront">
            <div className="sf-auth">
                <Link to="/" className="sf-auth__logo">
                    <span className="sf-auth__logo-mark">M</span>
                    MaltaLand
                </Link>
                <div className="sf-auth__card">
                    <span className="sf-auth__eyebrow">Join the workshop</span>
                    <h1 className="sf-auth__title">Create your account</h1>
                    <p className="sf-auth__sub">Save your favourites and check out faster.</p>
                    <form className="sf-auth__form" onSubmit={handleSubmit}>
                        <div>
                            <label className="sf-input__label" htmlFor="register-name">
                                Full name
                            </label>
                            <input
                                id="register-name"
                                className="sf-input"
                                type="text"
                                placeholder="Jane Doe"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="sf-input__label" htmlFor="register-email">
                                Email
                            </label>
                            <input
                                id="register-email"
                                className="sf-input"
                                type="email"
                                placeholder="jane@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="sf-input__label" htmlFor="register-password">
                                Password
                            </label>
                            <input
                                id="register-password"
                                className="sf-input"
                                type="password"
                                placeholder="6+ characters"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        {error && <p className="sf-checkout__error">{error}</p>}
                        <button className="sf-btn sf-btn--primary" type="submit" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>
                    <p className="sf-auth__link">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
