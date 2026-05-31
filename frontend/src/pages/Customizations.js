import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Customizations() {
  const [customizations, setCustomizations] = useState([]);
  const [produce, setProduce] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subscription_id: '', produce_id: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [custRes, prodRes, subRes] = await Promise.all([
        axios.get('/api/customizations'),
        axios.get('/api/produce'),
        axios.get('/api/subscriptions')
      ]);
      setCustomizations(custRes.data);
      setProduce(prodRes.data);
      setSubscriptions(subRes.data.filter(s => s.status === 'active'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const submitSwap = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/customizations', form);
      setMsg('Swap request submitted! Deadline: 48 hours from now.');
      setShowModal(false);
      setForm({ subscription_id: '', produce_id: '' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request.');
    }
  };

  const statusBadge = (status) => {
    const map = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };
    return <span className={`badge ${map[status]}`}>{status}</span>;
  };

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Box Customization</h1>
          <p>Request swaps for items in your upcoming box</p>
        </div>
        {subscriptions.length > 0 && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Request Swap</button>
        )}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {subscriptions.length === 0 && (
        <div className="alert alert-info">You need an active subscription to request swaps.</div>
      )}

      <div className="card">
        <div className="card-header"><h3>My Swap Requests</h3></div>
        {customizations.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">🔄</div>
              <p>No swap requests yet. You can request item swaps up to 48 hours before delivery.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item to Remove</th>
                  <th>Requested At</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customizations.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.produce_name}</strong> ({c.unit})</td>
                    <td>{new Date(c.requested_at).toLocaleString()}</td>
                    <td style={{ color: new Date(c.deadline) < new Date() ? 'var(--red)' : 'inherit' }}>
                      {new Date(c.deadline).toLocaleString()}
                    </td>
                    <td>{statusBadge(c.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Request Item Swap</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: 20, fontSize: '0.875rem' }}>
              Select which item you'd like to swap out of your upcoming box.
            </p>
            <form onSubmit={submitSwap}>
              <div className="form-group">
                <label>Subscription</label>
                <select value={form.subscription_id}
                  onChange={e => setForm({ ...form, subscription_id: e.target.value })} required>
                  <option value="">Select subscription</option>
                  {subscriptions.map(s => (
                    <option key={s.id} value={s.id}>{s.box_size} box — {s.frequency}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Item to remove from box</label>
                <select value={form.produce_id}
                  onChange={e => setForm({ ...form, produce_id: e.target.value })} required>
                  <option value="">Select produce item</option>
                  {produce.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit}) — {p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}