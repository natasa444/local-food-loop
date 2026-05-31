import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/deliveries')
      .then(res => setDeliveries(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusConfig = {
    pending: { badge: 'badge-yellow', label: 'Pending', icon: '⏳' },
    in_transit: { badge: 'badge-blue', label: 'Out for Delivery', icon: '🚚' },
    delivered: { badge: 'badge-green', label: 'Delivered', icon: '✅' }
  };

  const getProgress = (status) => {
    if (status === 'pending') return 33;
    if (status === 'in_transit') return 66;
    return 100;
  };

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Deliveries</h1>
          <p>Track your box deliveries in real time</p>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">🚚</div>
              <p>No deliveries yet. They'll appear here once scheduled.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {deliveries.map(del => {
            const cfg = statusConfig[del.status] || statusConfig.pending;
            return (
              <div key={del.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: '1.3rem' }}>{cfg.icon}</span>
                        <h3 style={{ fontSize: '1.1rem' }}>
                          {new Date(del.scheduled_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        📍 {del.drop_off_location} · 📦 {del.box_size} box
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      <span style={{ color: getProgress(del.status) >= 33 ? 'var(--green-mid)' : 'inherit', fontWeight: getProgress(del.status) >= 33 ? 600 : 400 }}>Scheduled</span>
                      <span style={{ color: getProgress(del.status) >= 66 ? 'var(--green-mid)' : 'inherit', fontWeight: getProgress(del.status) >= 66 ? 600 : 400 }}>In Transit</span>
                      <span style={{ color: getProgress(del.status) >= 100 ? 'var(--green-mid)' : 'inherit', fontWeight: getProgress(del.status) >= 100 ? 600 : 400 }}>Delivered</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--cream-dark)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${getProgress(del.status)}%`,
                        background: 'var(--green-mid)',
                        borderRadius: 4,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}