import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ scheduled_date: '', drop_off_location: '', subscription_id: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const res = await axios.get('/api/deliveries/all');
      setDeliveries(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const createDelivery = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/api/deliveries', form);
      setMsg('Delivery scheduled and manifest created.');
      setShowModal(false);
      setForm({ scheduled_date: '', drop_off_location: '', subscription_id: '' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create delivery.');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/deliveries/${id}/status`, { status });
      setMsg(`Delivery marked as ${status.replace('_', ' ')}.`);
      fetchAll();
    } catch (err) {
      setError('Failed to update status.');
    }
  };

  const statusBadge = (status) => {
    const map = { pending: 'badge-yellow', in_transit: 'badge-blue', delivered: 'badge-green' };
    return <span className={`badge ${map[status]}`}>{status?.replace('_', ' ')}</span>;
  };

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Delivery Management</h1>
          <p>Schedule and track all deliveries</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Schedule Delivery</button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header"><h3>All Deliveries</h3></div>
        {deliveries.length === 0 ? (
          <div className="card-body">
            <div className="empty-state"><div className="empty-icon">🚚</div><p>No deliveries scheduled yet.</p></div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Consumer</th>
                  <th>Box</th>
                  <th>Scheduled Date</th>
                  <th>Drop-off Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.first_name} {d.last_name}</strong>
                      <br />
                      <small style={{ color: 'var(--text-light)' }}>{d.email}</small>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{d.box_size}</td>
                    <td>{new Date(d.scheduled_date).toLocaleDateString()}</td>
                    <td>{d.drop_off_location}</td>
                    <td>{statusBadge(d.status)}</td>
                    <td>
                      <select
                        value={d.status}
                        onChange={e => updateStatus(d.id, e.target.value)}
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
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
            <h3>Schedule Delivery</h3>
            <form onSubmit={createDelivery}>
              <div className="form-group">
                <label>Subscription ID</label>
                <input
                  type="number"
                  placeholder="Enter subscription ID"
                  value={form.subscription_id}
                  onChange={e => setForm({ ...form, subscription_id: e.target.value })}
                  required
                />
                <small style={{ color: 'var(--text-light)', fontSize: '0.78rem' }}>
                  Enter the subscription ID to link this delivery to.
                </small>
              </div>
              <div className="form-group">
                <label>Scheduled Date</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Drop-off Location</label>
                <input
                  type="text"
                  placeholder="e.g. Tržaška 25, Ljubljana"
                  value={form.drop_off_location}
                  onChange={e => setForm({ ...form, drop_off_location: e.target.value })}
                  required
                />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}