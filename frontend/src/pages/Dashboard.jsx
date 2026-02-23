import React, { useState, useEffect } from 'react';
import { Target, Play, BookOpen, Puzzle, Users, Tv, Settings, LogOut, Swords, Flame, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('User');
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
            fetch(`/api/auth/user/${storedUsername}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.message) {
                        setUserData(data);
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

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Target size={32} color="var(--accent-green)" style={{ minWidth: '32px' }} />
                    <span style={{ marginLeft: '0.75rem' }}>Chess Coach</span>
                </div>

                <nav className="sidebar-nav">
                    <a href="#" className="nav-item active">
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
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/settings'); }} className="nav-item">
                        <Settings size={20} style={{ minWidth: '20px' }} />
                        <span style={{ marginLeft: '1rem' }}>Settings</span>
                    </a>
                </nav>

                <div className="sidebar-footer" onClick={handleLogout}>
                    <div className="user-avatar" style={{ minWidth: '40px', overflow: 'hidden' }}>
                        {userData?.profilePicture ? (
                            <img src={userData.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <div className="dashboard-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    {userData?.profilePicture ? (
                        <img src={userData.profilePicture} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '6px', backgroundColor: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{username}</h2>
                        {userData?.country && (
                            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{userData.country}</span>
                        )}
                    </div>
                </div>

                <div className="dashboard-grid">
                    {/* Left Column - Quick Actions */}
                    <div className="dashboard-left">
                        <button onClick={() => navigate("/play/coach")} className="quick-action-btn">
                            <div className="icon-wrapper" style={{ color: 'var(--accent-green)' }}>
                                <Swords size={24} />
                            </div>
                            Play with Coach
                        </button>
                        <button onClick={() => navigate("/play/10min")} className="quick-action-btn">
                            <div className="icon-wrapper" style={{ color: '#f5c643' }}>
                                <Play size={24} />
                            </div>
                            Play 10 min
                        </button>
                        <button onClick={() => navigate("/play/bot")} className="quick-action-btn">
                            <div className="icon-wrapper" style={{ color: '#4389f5' }}>
                                <Tv size={24} />
                            </div>
                            Play Bots
                        </button>
                        <button onClick={() => navigate("/play/friend")} className="quick-action-btn">
                            <div className="icon-wrapper" style={{ color: '#d8aa71' }}>
                                <Users size={24} />
                            </div>
                            Play a Friend
                        </button>
                    </div>

                    {/* Center Column - Match History */}
                    <div className="dashboard-center">
                        <div className="panel" style={{ height: '100%' }}>
                            <div className="panel-header">
                                <History size={24} color="var(--text-secondary)" />
                                Match History
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="action-card" style={{ marginBottom: 0, padding: '1rem' }}>
                                    <div className="action-icon" style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg-primary)' }}>
                                        <Swords size={24} color="var(--accent-green)" />
                                    </div>
                                    <div className="action-info" style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent-green)', display: 'inline-block' }}></span>
                                            vs Computer (Level 5)
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', marginTop: '0.25rem' }}>Win • 32 moves • 10 min ago</p>
                                    </div>
                                    <div className="result-badge" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(129, 182, 76, 0.2)', color: 'var(--accent-green)', fontWeight: 'bold', borderRadius: '4px' }}>
                                        +1
                                    </div>
                                </div>

                                <div className="action-card" style={{ marginBottom: 0, padding: '1rem' }}>
                                    <div className="action-icon" style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg-primary)' }}>
                                        <Swords size={24} color="var(--danger)" />
                                    </div>
                                    <div className="action-info" style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--danger)', display: 'inline-block' }}></span>
                                            vs master_chess
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', marginTop: '0.25rem' }}>Loss • 45 moves • 2 hours ago</p>
                                    </div>
                                    <div className="result-badge" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(250, 70, 33, 0.2)', color: 'var(--danger)', fontWeight: 'bold', borderRadius: '4px' }}>
                                        -1
                                    </div>
                                </div>

                                <div className="action-card" style={{ marginBottom: 0, padding: '1rem' }}>
                                    <div className="action-icon" style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg-primary)' }}>
                                        <Swords size={24} color="var(--accent-green)" />
                                    </div>
                                    <div className="action-info" style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent-green)', display: 'inline-block' }}></span>
                                            vs shadow_knight
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', marginTop: '0.25rem' }}>Win • 28 moves • Yesterday</p>
                                    </div>
                                    <div className="result-badge" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(129, 182, 76, 0.2)', color: 'var(--accent-green)', fontWeight: 'bold', borderRadius: '4px' }}>
                                        +1
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Stats & Daily Puzzle */}
                    <div className="dashboard-right">
                        <div className="panel" style={{ marginBottom: '1.5rem' }}>
                            <div className="panel-header" style={{ marginBottom: '1rem' }}>
                                <Users size={24} color="var(--text-secondary)" />
                                Your Stats
                            </div>
                            <div className="stats-container">
                                <div className="stat-row">
                                    <span className="stat-label">
                                        <Swords size={18} color="var(--text-secondary)" />
                                        Rapid
                                    </span>
                                    <span className="stat-value"> {userData ? userData.rapid : 1200} <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>▴</span></span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">
                                        <Flame size={18} color="var(--text-secondary)" />
                                        Blitz
                                    </span>
                                    <span className="stat-value"> {userData ? userData.blitz : 1200} <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>▴</span></span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">
                                        <Play size={18} color="var(--text-secondary)" />
                                        Bullet
                                    </span>
                                    <span className="stat-value"> {userData ? userData.bullet : 1200} <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>▾</span></span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">
                                        <Puzzle size={18} color="var(--text-secondary)" />
                                        Puzzles
                                    </span>
                                    <span className="stat-value"> {userData ? userData.puzzles || 0 : 0} <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>▴</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-header" style={{ marginBottom: '1rem' }}>
                                <Flame size={24} color="var(--danger)" />
                                Daily Puzzle
                            </div>
                            <div style={{ backgroundColor: '#ccc', borderRadius: '8px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', backgroundImage: 'url(https://images.unsplash.com/photo-1610631070806-384391e63aeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            </div>
                            <button className="btn btn-primary btn-block" style={{ padding: '0.6rem', fontSize: '1rem' }}>Solve Now</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
