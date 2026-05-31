import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ConsumerDashboard() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [subRes, delRes, notifRes] = await Promise.all([
          axios.get('/api/subscriptions'),
          axios.get('/api/deliveries'),
          axios.get('/api/notifications')
        ]);
        setSubscriptions(subRes.data);
        setDeliveries(delRes.data);
        setNotifications(notifRes.data.filter(n => !n.read_at).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const activeSub = subscriptions.find(s => s.status === 'active');
  const nextDelivery = deliveries.find(d => d.status === 'pending' || d.status === 'in_transit');

  const statusBadge = (status) => {
    const map = {
      active: 'badge-green', paused: 'badge-yellow', cancelled: 'badge-red',
      pending: 'badge-yellow', in_transit: 'badge-blue', delivered: 'badge-green'
    };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status?.replace('_', ' ')}</span>;
  };

  if (loading) return <div className="main-content"><p style={{ color: 'var(--text-light)' }}>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Good morning, {user?.first_name} 👋</h1>
          <p>Here's what's happening with your subscription</p>
        </div>
        {!activeSub && (
          <Link to="/subscriptions" className="btn btn-primary">+ Start Subscription</Link>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{subscriptions.filter(s => s.status === 'active').length}</div>
          <div className="stat-label">Active Subscription</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚚</div>
          <div className="stat-value">{deliveries.filter(d => d.status !== 'delivered').length}</div>
          <div className="stat-label">Upcoming Deliveries</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{deliveries.filter(d => d.status === 'delivered').length}</div>
          <div className="stat-label">Boxes Received</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-value">{notifications.length}</div>
          <div className="stat-label">Unread Notifications</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3>My Subscription</h3>
            <Link to="/subscriptions" className="btn btn-outline btn-sm">Manage</Link>
          </div>
          <div className="card-body">
            {activeSub ? (
              <div>
                <div style={{ marginBottom: 12 }}>{statusBadge(activeSub.status)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Box Size', activeSub.box_size],
                    ['Frequency', activeSub.frequency],
                    ['Started', new Date(activeSub.start_date).toLocaleDateString()],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize', marginTop: 2 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <p>No active subscription yet.</p>
                <Link to="/subscriptions" className="btn btn-primary" style={{ marginTop: 12 }}>Get started</Link>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Next Delivery</h3>
            <Link to="/deliveries" className="btn btn-outline btn-sm">All deliveries</Link>
          </div>
          <div className="card-body">
            {nextDelivery ? (
              <div>
                <div style={{ marginBottom: 12 }}>{statusBadge(nextDelivery.status)}</div>
                <div style={{ fontSize: '1.8rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--green-dark)', marginBottom: 8 }}>
                  {new Date(nextDelivery.scheduled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  📍 {nextDelivery.drop_off_location}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🚚</div>
                <p>No upcoming deliveries scheduled.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3>Recent Notifications</h3>
            <Link to="/notifications" className="btn btn-outline btn-sm">View all</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {notifications.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔔</div><p>You're all caught up!</p></div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--cream-dark)', display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {n.type === 'delivery_update' ? '🚚' : n.type === 'low_inventory' ? '⚠️' : '📦'}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.875rem' }}>{n.message}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2 }}>
                      {new Date(n.sent_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}