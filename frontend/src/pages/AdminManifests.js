import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminManifests() {
  const [manifests, setManifests] = useState([]);
  const [produce, setProduce] = useState([]);
  const [showAddItem, setShowAddItem] = useState(null);
  const [itemForm, setItemForm] = useState({ produce_id: '', quantity: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [manRes, prodRes] = await Promise.all([
        axios.get('/api/admin/manifests'),
        axios.get('/api/produce')
      ]);
      setManifests(manRes.data);
      setProduce(prodRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const addItem = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/admin/manifests/${showAddItem}/items`, itemForm);
      setMsg('Item added to manifest.');
      setShowAddItem(null);
      setItemForm({ produce_id: '', quantity: '' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item.');
    }
  };

  const finalize = async (id) => {
    if (!window.confirm('Finalize this manifest? This cannot be undone.')) return;
    try {
      await axios.put(`/api/admin/manifests/${id}/finalize`);
      setMsg('Manifest finalized.');
      fetchAll();
    } catch (err) {
      setError('Failed to finalize manifest.');
    }
  };

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Box Manifests</h1>
          <p>Review and finalize packing manifests for deliveries</p>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {manifests.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No manifests yet. Manifests are auto-created when deliveries are scheduled.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {manifests.map(m => (
            <div key={m.id} className="card">
              <div className="card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3>Manifest #{m.id}</h3>
                    <span className={`badge ${m.finalized ? 'badge-green' : 'badge-yellow'}`}>
                      {m.finalized ? 'Finalized' : 'Draft'}
                    </span>
                    <span className={`badge ${m.delivery_status === 'delivered' ? 'badge-green' : m.delivery_status === 'in_transit' ? 'badge-blue' : 'badge-gray'}`}>
                      Delivery: {m.delivery_status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: 4 }}>
                    📅 {new Date(m.scheduled_date).toLocaleDateString()} · 📍 {m.drop_off_location}
                  </div>
                </div>
                {!m.finalized && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowAddItem(m.id)}>+ Add Item</button>
                    <button className="btn btn-primary btn-sm" onClick={() => finalize(m.id)}>Finalize</button>
                  </div>
                )}
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {m.items?.length === 0 ? (
                  <div style={{ padding: '20px 24px', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    No items yet. Add produce items to pack.
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Produce Item</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.items?.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.produce_name}</strong></td>
                          <td>{item.quantity}</td>
                          <td>{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Item to Manifest #{showAddItem}</h3>
            <form onSubmit={addItem}>
              <div className="form-group">
                <label>Produce Item</label>
                <select value={itemForm.produce_id}
                  onChange={e => setItemForm({ ...itemForm, produce_id: e.target.value })} required>
                  <option value="">Select produce</option>
                  {produce.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit} available)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" placeholder="0" min="0.01" step="0.01" value={itemForm.quantity}
                  onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}