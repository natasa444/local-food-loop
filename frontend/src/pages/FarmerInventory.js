import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function FarmerInventory() {
  const [produce, setProduce] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: '', quantity: '', unit: 'kg', price_per_unit: '',
    available_from: new Date().toISOString().slice(0, 10),
    available_until: ''
  });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProduce = async () => {
    try {
      const res = await axios.get('/api/produce/my');
      setProduce(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProduce(); }, []);

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, quantity: item.quantity, unit: item.unit,
      price_per_unit: item.price_per_unit,
      available_from: item.available_from?.slice(0, 10),
      available_until: item.available_until?.slice(0, 10)
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditItem(null);
    setForm({ name: '', quantity: '', unit: 'kg', price_per_unit: '', available_from: new Date().toISOString().slice(0, 10), available_until: '' });
    setShowModal(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editItem) {
        await axios.put(`/api/produce/${editItem.id}`, form);
        setMsg('Produce updated successfully.');
      } else {
        await axios.post('/api/produce', form);
        setMsg('Produce added to inventory!');
      }
      setShowModal(false);
      fetchProduce();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save produce.');
    }
  };

  const deleteProduce = async (id) => {
    if (!window.confirm('Remove this produce listing?')) return;
    try {
      await axios.delete(`/api/produce/${id}`);
      setMsg('Produce removed.');
      fetchProduce();
    } catch (err) {
      setError('Failed to delete produce.');
    }
  };

  const isLowStock = (qty) => parseFloat(qty) < 5;

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>My Inventory</h1>
          <p>Manage your seasonal produce listings</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Produce</button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {produce.some(p => isLowStock(p.quantity)) && (
        <div className="alert alert-error">⚠️ Some items are running low on stock (below 5 units).</div>
      )}

      {produce.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">🌾</div>
              <p>No produce listed yet. Add your first item to get started.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNew}>Add Produce</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produce</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Price/Unit</th>
                  <th>Available From</th>
                  <th>Available Until</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {produce.map(p => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      {isLowStock(p.quantity) && <span className="badge badge-red" style={{ marginLeft: 8 }}>Low stock</span>}
                    </td>
                    <td style={{ color: isLowStock(p.quantity) ? 'var(--red)' : 'inherit', fontWeight: isLowStock(p.quantity) ? 600 : 400 }}>
                      {p.quantity}
                    </td>
                    <td>{p.unit}</td>
                    <td>€{parseFloat(p.price_per_unit).toFixed(2)}</td>
                    <td>{new Date(p.available_from).toLocaleDateString()}</td>
                    <td>{new Date(p.available_until).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteProduce(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editItem ? 'Edit Produce' : 'Add New Produce'}</h3>
            <form onSubmit={submitForm}>
              <div className="form-group">
                <label>Produce Name</label>
                <input type="text" placeholder="e.g. Tomatoes" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" placeholder="0" min="0" step="0.01" value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="piece">piece</option>
                    <option value="bunch">bunch</option>
                    <option value="liter">liter</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Price per Unit (€)</label>
                <input type="number" placeholder="0.00" min="0" step="0.01" value={form.price_per_unit}
                  onChange={e => setForm({ ...form, price_per_unit: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Available From</label>
                  <input type="date" value={form.available_from}
                    onChange={e => setForm({ ...form, available_from: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Available Until</label>
                  <input type="date" value={form.available_until} min={form.available_from}
                    onChange={e => setForm({ ...form, available_until: e.target.value })} required />
                </div>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Add Produce'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}