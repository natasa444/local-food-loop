import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Overview of Local Food Loop operations</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.total_users}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats.active_subs}</div>
          <div className="stat-label">Active Subscriptions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚚</div>
          <div className="stat-value">{stats.pending_deliveries}</div>
          <div className="stat-label">Pending Deliveries</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{stats.pending_customs}</div>
          <div className="stat-label">Pending Swap Requests</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { to: '/admin/users', icon: '👥', title: 'User Management', desc: 'View, edit roles, and manage all registered users.' },
          { to: '/admin/deliveries', icon: '🚚', title: 'Delivery Management', desc: 'Schedule deliveries and update delivery statuses.' },
          { to: '/admin/manifests', icon: '📋', title: 'Box Manifests', desc: 'Generate and finalize packing manifests.' },
          { to: '/admin/customizations', icon: '🔄', title: 'Swap Requests', desc: 'Review and approve consumer item swap requests.' },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-hover)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
            >
              <div className="card-body">
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-light)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}