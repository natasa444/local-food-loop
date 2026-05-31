import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchNotifs = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      fetchNotifs();
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all/all');
      setMsg('All notifications marked as read.');
      fetchNotifs();
    } catch (err) {}
  };

  const typeIcon = (type) => {
    if (type === 'delivery_update') return '🚚';
    if (type === 'low_inventory') return '⚠️';
    return '📦';
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        {notifications.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <p>No notifications yet.</p>
            </div>
          </div>
        ) : (
          <div>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--cream-dark)',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  background: n.read_at ? 'white' : 'var(--cream)',
                  cursor: n.read_at ? 'default' : 'pointer'
                }}
                onClick={() => !n.read_at && markRead(n.id)}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{typeIcon(n.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: n.read_at ? 400 : 600 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4 }}>
                    {new Date(n.sent_at).toLocaleString()}
                    {n.read_at && ` · Read ${new Date(n.read_at).toLocaleString()}`}
                  </div>
                </div>
                {!n.read_at && (
                  <div style={{ width: 8, height: 8, background: 'var(--orange)', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}