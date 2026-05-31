import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function BrowseProduce() {
  const [produce, setProduce] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/produce')
      .then(res => setProduce(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = produce.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="main-content"><p>Loading...</p></div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1>Browse Produce</h1>
          <p>Seasonal items available from local farmers</p>
        </div>
        <input
          type="text"
          placeholder="Search produce or farmer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">🥦</div>
              <p>No produce available right now.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ background: 'var(--green-dark)', padding: '24px', textAlign: 'center', fontSize: '3rem' }}>
                🌿
              </div>
              <div className="card-body">
                <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{p.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 12 }}>
                  by {p.first_name} {p.last_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green-mid)', fontFamily: 'Playfair Display, serif' }}>
                    €{parseFloat(p.price_per_unit).toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>per {p.unit}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', borderTop: '1px solid var(--cream-dark)', paddingTop: 10 }}>
                  📦 {p.quantity} {p.unit} available<br />
                  📅 Until {new Date(p.available_until).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}