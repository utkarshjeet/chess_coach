import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, Lock, Mail } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login successful
                localStorage.setItem('username', data.user?.username || username);
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Unable to connect to the server');
            console.error(err);
        }
    };

    return (
        <div className="auth-layout">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>
                        <Target size={32} color="var(--accent-green)" />
                        Chess Coach
                    </h1>
                    <p>Log in to your account</p>
                </div>

                {error && <div style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: '1rem', fontWeight: '600' }}>{error}</div>}

                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">Username</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                type="text"
                                id="username"
                                placeholder="magnuscarlsen"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }}
                                required
                            />
                            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                type="password"
                                id="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }}
                                required
                            />
                            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                        Log In
                    </button>
                </form>

                <div className="auth-footer">
                    New to Chess Coach? <Link to="/register" className="auth-link">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
