import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError, handleSuccess } from '../utils';
import { ToastContainer } from 'react-toastify';
import './Dashboard.css';

function Home() {
    const navigate = useNavigate();
    const [loggedInUser, setLoggedInUser] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState({
        aptitudeAttempts: 0,
        codingAttempts: 0,
        avgScore: 0,
        streak: 0
    });

    useEffect(() => {
        setLoggedInUser(localStorage.getItem('loggedInUser') || 'User');
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:8080/api/stats', {
                    headers: { 'Authorization': token }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {}
        };
        fetchStats();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        handleSuccess('Logged out successfully!');
        setTimeout(() => navigate('/login'), 500);
    };

    const getGreeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const statCards = [
        { label: 'Quizzes Taken',    value: stats.aptitudeAttempts, icon: '📝', color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Problems Solved',  value: stats.codingAttempts,   icon: '✅', color: '#10b981', bg: '#ecfdf5' },
        { label: 'Avg Score',        value: `${stats.avgScore}%`,   icon: '🎯', color: '#f59e0b', bg: '#fffbeb' },
        { label: 'Day Streak',       value: stats.streak,           icon: '🔥', color: '#ef4444', bg: '#fef2f2' },
    ];

    const modules = [
        {
            id: 'aptitude',
            icon: '🧠',
            title: 'Aptitude Quiz',
            description: 'Test logical reasoning, quantitative skills and verbal ability with timed MCQ quizzes.',
            badge: 'MCQ · Timed',
            accent: '#3b82f6',
            accentBg: '#eff6ff',
            path: '/aptitude',
            stat: `${stats.aptitudeAttempts} attempts`,
        },
        {
            id: 'coding',
            icon: '💻',
            title: 'Coding Practice',
            description: 'Solve real DSA problems evaluated against test cases. Sharpen your algorithmic thinking.',
            badge: 'DSA · Algorithms',
            accent: '#10b981',
            accentBg: '#ecfdf5',
            path: '/coding',
            stat: `${stats.codingAttempts} solved`,
        },
        {
            id: 'performance',
            icon: '📊',
            title: 'Performance Report',
            description: 'Track your score trends, accuracy graphs and get a detailed breakdown of your progress.',
            badge: 'Analytics',
            accent: '#f59e0b',
            accentBg: '#fffbeb',
            path: '/performance',
            stat: `${stats.avgScore}% avg`,
        },
    ];

    const tips = [
        { icon: '📅', text: 'Practise at least 5 aptitude questions daily to build consistency.' },
        { icon: '⏱️', text: 'Always analyse time complexity before writing your final solution.' },
        { icon: '🔍', text: 'Review wrong answers carefully — they reveal your weak areas.' },
        { icon: '✨', text: 'Write clean, readable code. Interviewers value clarity over cleverness.' },
    ];

    return (
        <div className="db-root">

            {/* ── Sidebar ── */}
            <aside className="db-sidebar">
                <div className="db-brand">
                    <img src="/logo192.png" alt="React App Logo" className="db-brand-logo" />
                    <span className="db-brand-name">React App</span>
                </div>

                <p className="db-nav-label">Main Menu</p>
                <nav className="db-nav">
                    {[
                        { icon: '▣', label: 'Dashboard',   path: '/home',        active: true  },
                        { icon: '🧠', label: 'Aptitude',    path: '/aptitude',    active: false },
                        { icon: '💻', label: 'Coding',      path: '/coding',      active: false },
                        { icon: '📊', label: 'Performance', path: '/performance', active: false },
                    ].map((item) => (
                        <button
                            key={item.label}
                            className={`db-nav-item ${item.active ? 'db-nav-active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="db-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <p className="db-nav-label" style={{ marginTop: '20px' }}>Account</p>
                <nav className="db-nav">
                    <button className="db-nav-item" onClick={() => navigate('/admin')}>
                        <span className="db-nav-icon">⚙</span>
                        <span>Admin Panel</span>
                    </button>
                </nav>

                <div className="db-sidebar-bottom">
                    <div className="db-user-card">
                        <div className="db-avatar">{loggedInUser.charAt(0).toUpperCase()}</div>
                        <div className="db-user-info">
                            <span className="db-user-name">{loggedInUser}</span>
                            <span className="db-user-role">Candidate</span>
                        </div>
                    </div>
                    <button className="db-logout" onClick={handleLogout}>
                        ⎋ &nbsp;Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="db-main">

                {/* Welcome card */}
                <section className="db-welcome">
                    <div className="db-welcome-text">
                        <span className="db-welcome-tag">{getGreeting()} 👋</span>
                        <h2 className="db-welcome-name">{loggedInUser}</h2>
                        <p className="db-welcome-sub">
                            You're on a <strong>{stats.streak}-day</strong> streak. Keep the momentum going — practice makes perfect!
                        </p>
                        <div className="db-welcome-actions">
                            <button className="db-btn-primary" onClick={() => navigate('/aptitude')}>Start Quiz →</button>
                            <button className="db-btn-outline" onClick={() => navigate('/coding')}>Practice Coding</button>
                            <button className="db-btn-outline" onClick={() => navigate('/performance')}>View Report</button>
                        </div>
                    </div>
                    <div className="db-welcome-deco" aria-hidden="true">
                        <div className="deco-ring r1"></div>
                        <div className="deco-ring r2"></div>
                        <div className="deco-ring r3"></div>
                        <div className="deco-code">
                            <span><span className="kw">const</span> result <span className="op">=</span> <span className="fn">practice</span>();</span>
                            <span><span className="kw">if</span> (result <span className="op">===</span> <span className="str">'success'</span>) {'{'}</span>
                            <span className="ind">  <span className="fn">celebrate</span>();</span>
                            <span>{'}'}</span>
                        </div>
                    </div>
                </section>

                {/* Stat cards */}
                <section className="db-stats">
                    {statCards.map((s, i) => (
                        <div className="db-stat-card" key={i} style={{ '--ac': s.color, '--acbg': s.bg }}>
                            <div className="db-stat-icon-wrap">
                                <span className="db-stat-icon">{s.icon}</span>
                            </div>
                            <div>
                                <p className="db-stat-val">{s.value}</p>
                                <p className="db-stat-lbl">{s.label}</p>
                            </div>
                            <div className="db-stat-bar"></div>
                        </div>
                    ))}
                </section>

                {/* Modules */}
                <section className="db-section">
                    <div className="db-section-head">
                        <h3 className="db-section-title">Practice Modules</h3>
                        <span className="db-section-sub">Select a module to begin your session</span>
                    </div>
                    <div className="db-modules">
                        {modules.map((m) => (
                            <div
                                className="db-module-card"
                                key={m.id}
                                onClick={() => navigate(m.path)}
                                style={{ '--mac': m.accent, '--macbg': m.accentBg }}
                            >
                                <div className="db-module-top">
                                    <span className="db-module-icon">{m.icon}</span>
                                    <span className="db-module-badge">{m.badge}</span>
                                </div>
                                <h4 className="db-module-title">{m.title}</h4>
                                <p className="db-module-desc">{m.description}</p>
                                <div className="db-module-foot">
                                    <span className="db-module-stat">{m.stat}</span>
                                    <button className="db-module-btn">Start →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Progress + Tips row */}
                <div className="db-bottom-row">
                    {/* Progress overview */}
                    <section className="db-progress-card">
                        <h3 className="db-section-title" style={{ marginBottom: '20px' }}>Overall Progress</h3>
                        {[
                            { label: 'Aptitude Accuracy', pct: stats.avgScore || 0,  color: '#3b82f6' },
                            { label: 'Coding Solved',     pct: Math.min(stats.codingAttempts * 5, 100), color: '#10b981' },
                            { label: 'Day Streak Goal',   pct: Math.min(stats.streak * 10, 100),         color: '#f59e0b' },
                        ].map((item, i) => (
                            <div className="db-prog-row" key={i}>
                                <div className="db-prog-meta">
                                    <span className="db-prog-label">{item.label}</span>
                                    <span className="db-prog-pct" style={{ color: item.color }}>{item.pct}%</span>
                                </div>
                                <div className="db-prog-track">
                                    <div
                                        className="db-prog-fill"
                                        style={{ width: `${item.pct}%`, background: item.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Tips */}
                    <section className="db-tips-card">
                        <h3 className="db-section-title" style={{ marginBottom: '16px' }}>Interview Tips</h3>
                        <div className="db-tips-list">
                            {tips.map((t, i) => (
                                <div className="db-tip-row" key={i}>
                                    <span className="db-tip-icon">{t.icon}</span>
                                    <p className="db-tip-text">{t.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

            </main>

            <ToastContainer />
        </div>
    );
}

export default Home;