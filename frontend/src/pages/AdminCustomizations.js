import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminCustomizations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/customizations/pending');
      setRequests(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id, status) => {
    try {
      await axios.put(`/api/customizations/${id}`, { status });
      setMsg(`Request ${status}.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update request.');
    }
  };

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Swap Requests</h1>
          <p>Review and approve consumer box customization requests</p>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3>Pending Requests</h3>
          <span className="badge badge-yellow">{requests.length} pending</span>
        </div>
        {requests.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">🔄</div>
              <p>No pending swap requests. You're all caught up!</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Consumer</th>
                  <th>Item to Remove</th>
                  <th>Requested At</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.first_name} {r.last_name}</strong></td>
                    <td>{r.produce_name}</td>
                    <td>{new Date(r.requested_at).toLocaleString()}</td>
                    <td style={{ color: new Date(r.deadline) < new Date() ? 'var(--red)' : 'var(--text-mid)' }}>
                      {new Date(r.deadline).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleAction(r.id, 'approved')}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(r.id, 'rejected')}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}