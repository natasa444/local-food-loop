import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(null);
  const [form, setForm] = useState({ box_size: 'medium', frequency: 'weekly', start_date: new Date().toISOString().slice(0,10) });
  const [pauseForm, setPauseForm] = useState({ pause_start: '', pause_end: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchSubs = async () => {
    try {
      const res = await axios.get('/api/subscriptions');
      setSubscriptions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubs(); }, []);

  const createSub = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/subscriptions', form);
      setMsg('Subscription created successfully!');
      setShowModal(false);
      fetchSubs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create subscription.');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/subscriptions/${id}`, { status });
      setMsg(`Subscription ${status} successfully.`);
      fetchSubs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update subscription.');
    }
  };

  const pauseSub = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/subscriptions/${showPauseModal}`, {
        status: 'paused',
        pause_start: pauseForm.pause_start,
        pause_end: pauseForm.pause_end
      });
      setMsg('Subscription paused successfully.');
      setShowPauseModal(null);
      fetchSubs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to pause subscription.');
    }
  };

  const statusBadge = (status) => {
    const map = { active: 'badge-green', paused: 'badge-yellow', cancelled: 'badge-red' };
    return <span className={`badge ${map[status]}`}>{status}</span>;
  };

  const hasActive = subscriptions.some(s => s.status === 'active');

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>My Subscription</h1>
          <p>Manage your weekly produce box</p>
        </div>
        {!hasActive && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Subscription</button>
        )}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {subscriptions.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>You don't have any subscriptions yet.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                Start your first subscription
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {subscriptions.map(sub => (
            <div key={sub.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>{sub.box_size} Box — {sub.frequency}</h3>
                      {statusBadge(sub.status)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
                      Started {new Date(sub.start_date).toLocaleDateString()}
                    </div>
                  </div>
                  {sub.status === 'active' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setShowPauseModal(sub.id)}>Pause</button>
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        if (window.confirm('Cancel this subscription?')) updateStatus(sub.id, 'cancelled');
                      }}>Cancel</button>
                    </div>
                  )}
                  {sub.status === 'paused' && (
                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(sub.id, 'active')}>Resume</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    ['📦 Box Size', sub.box_size],
                    ['🔄 Frequency', sub.frequency],
                    ['📅 Start Date', new Date(sub.start_date).toLocaleDateString()],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>New Subscription</h3>
            <form onSubmit={createSub}>
              <div className="form-group">
                <label>Box Size</label>
                <select value={form.box_size} onChange={e => setForm({ ...form, box_size: e.target.value })}>
                  <option value="small">Small (~2 persons)</option>
                  <option value="medium">Medium (~4 persons)</option>
                  <option value="large">Large (~6 persons)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Delivery Frequency</label>
                <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={form.start_date} min={new Date().toISOString().slice(0,10)}
                  onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPauseModal && (
        <div className="modal-overlay" onClick={() => setShowPauseModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Pause Subscription</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: 20, fontSize: '0.875rem' }}>
              Your subscription data will be preserved during the pause.
            </p>
            <form onSubmit={pauseSub}>
              <div className="form-group">
                <label>Pause Start</label>
                <input type="date" value={pauseForm.pause_start} min={new Date().toISOString().slice(0,10)}
                  onChange={e => setPauseForm({ ...pauseForm, pause_start: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Pause End</label>
                <input type="date" value={pauseForm.pause_end} min={pauseForm.pause_start}
                  onChange={e => setPauseForm({ ...pauseForm, pause_end: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPauseModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-orange">Pause Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}