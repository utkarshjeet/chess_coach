import React, { useState, useEffect } from 'react';
import { Target, Play, BookOpen, Puzzle, Users, Tv, Settings as SettingsIcon, LogOut, Swords, Flame, History, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('User');
    const [profilePicture, setProfilePicture] = useState('');
    const [country, setCountry] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
            fetch(`/api/auth/user/${storedUsername}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.message) {
                        setProfilePicture(data.profilePicture || '');
                        setCountry(data.country || '');
                    }
                })
                .catch(err => console.error("Error fetching user data:", err));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('username');
        navigate('/login');
    };

    const handleSave = () => {
        fetch(`/api/auth/user/${username}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profilePicture, country }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    setMessage(`Error: ${data.message}`);
                } else {
                    setMessage('Settings saved successfully!');
                    setTimeout(() => setMessage(''), 3000);
                }
            })
            .catch(err => {
                console.error(err);
                setMessage('Failed to save settings.');
            });
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Target size={32} color="var(--accent-green)" style={{ minWidth: '32px' }} />
                    <span style={{ marginLeft: '0.75rem' }}>Chess Coach</span>
                </div>

                <nav className="sidebar-nav">
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="nav-item">
                        <Play size={20} style={{ minWidth: '20px' }} />
                        <span style={{ marginLeft: '1rem' }}>Play</span>
                    </a>
                    <a href="#" className="nav-item">
                        <Puzzle size={20} style={{ minWidth: '20px' }} />
                        <span style={{ marginLeft: '1rem' }}>Puzzles</span>
                    </a>
                    <a href="#" className="nav-item">
                        <BookOpen size={20} style={{ minWidth: '20px' }} />
                        <span style={{ marginLeft: '1rem' }}>Learn</span>
                    </a>
                    <a href="#" className="nav-item active">
                        <SettingsIcon size={20} style={{ minWidth: '20px' }} />
                        <span style={{ marginLeft: '1rem' }}>Settings</span>
                    </a>
                </nav>

                <div className="sidebar-footer" onClick={handleLogout}>
                    <div className="user-avatar" style={{ minWidth: '40px', overflow: 'hidden' }}>
                        {profilePicture ? (
                            <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            username.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', marginLeft: '1rem' }}>
                        <div style={{ fontWeight: '700', fontSize: '1rem' }}>{username}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Log out</div>
                    </div>
                    <LogOut size={18} color="var(--text-muted)" style={{ minWidth: '18px' }} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={24} />
                        <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Back to Dashboard</span>
                    </button>
                </div>

                <div className="panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div className="panel-header" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                        <SettingsIcon size={28} color="var(--accent-green)" />
                        Profile Settings
                    </div>

                    {message && (
                        <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px', backgroundColor: message.includes('Error') || message.includes('Failed') ? 'rgba(250, 70, 33, 0.2)' : 'rgba(129, 182, 76, 0.2)', color: message.includes('Error') || message.includes('Failed') ? 'var(--danger)' : 'var(--accent-green)', fontWeight: 'bold' }}>
                            {message}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Profile Picture URL</label>
                            <input
                                type="text"
                                value={profilePicture}
                                onChange={(e) => setProfilePicture(e.target.value)}
                                placeholder="https://example.com/avatar.png"
                                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                            {profilePicture && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Preview:</p>
                                    <img src={profilePicture} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '6px', objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Country (Name or Emoji)</label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="e.g., India or 🇮🇳"
                                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', marginTop: '1rem', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', backgroundColor: 'var(--accent-green)', color: '#fff' }}>
                            <Save size={20} />
                            Save Settings
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
