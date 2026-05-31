import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [produce, setProduce] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, notifRes] = await Promise.all([
          axios.get('/api/produce/my'),
          axios.get('/api/notifications')
        ]);
        setProduce(prodRes.data);
        setNotifications(notifRes.data.filter(n => !n.read_at).slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const lowStock = produce.filter(p => parseFloat(p.quantity) < 5);
  const activeListings = produce.filter(p => new Date(p.available_until) >= new Date());

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Welcome, {user?.first_name} 🌾</h1>
          <p>Manage your farm's produce and inventory</p>
        </div>
        <Link to="/farmer/inventory" className="btn btn-primary">+ Add Produce</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🌿</div>
          <div className="stat-value">{produce.length}</div>
          <div className="stat-label">Total Listings</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{activeListings.length}</div>
          <div className="stat-label">Active Listings</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value" style={{ color: lowStock.length > 0 ? 'var(--red)' : 'inherit' }}>
            {lowStock.length}
          </div>
          <div className="stat-label">Low Stock Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-value">{notifications.length}</div>
          <div className="stat-label">Unread Alerts</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3>⚠️ Low Stock Alerts</h3>
            <Link to="/farmer/inventory" className="btn btn-outline btn-sm">Manage</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {lowStock.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">✅</div><p>All items well stocked!</p></div>
            ) : (
              lowStock.map(p => (
                <div key={p.id} style={{ padding: '12px 24px', borderBottom: '1px solid var(--cream-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{p.unit}</div>
                  </div>
                  <span className="badge badge-red">{p.quantity} {p.unit} left</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent Listings</h3>
            <Link to="/farmer/inventory" className="btn btn-outline btn-sm">View all</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {produce.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🌾</div><p>No produce listed yet.</p></div>
            ) : (
              produce.slice(0, 5).map(p => (
                <div key={p.id} style={{ padding: '12px 24px', borderBottom: '1px solid var(--cream-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      Until {new Date(p.available_until).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--green-mid)' }}>€{parseFloat(p.price_per_unit).toFixed(2)}/{p.unit}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{p.quantity} {p.unit}</div>
                  </div>
                </div>
              ))
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
              <div className="empty-state"><div className="empty-icon">🔔</div><p>No new notifications.</p></div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--cream-dark)', display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: '1.2rem' }}>{n.type === 'low_inventory' ? '⚠️' : '📦'}</span>
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