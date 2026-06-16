'use client';

import { useState, useEffect } from 'react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  return (
    <div className="container animate-fade">
      <nav className="navbar glass-panel">
        <div className="nav-brand">
          🩸 <span>BloodBank</span> Hub
        </div>
        <div className="nav-links">
          {['dashboard', 'donors', 'search', 'register'].map(tab => (
            <button 
              key={tab}
              className={`nav-btn ${currentTab === tab ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'donors' && <Donors />}
        {currentTab === 'search' && <Search />}
        {currentTab === 'register' && <Register onSuccess={() => setCurrentTab('donors')} />}
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then(res => res.json()).then(setStats);
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div className="animate-fade">
      <h2 style={{ marginBottom: '2rem' }}>Overview</h2>
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-value">{stats.totalDonors}</div>
          <div className="stat-label">Total Donors</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-value">{stats.totalDonations}</div>
          <div className="stat-label">Total Donations</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-value">{stats.todayDonations}</div>
          <div className="stat-label">Donations Today</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-value">{stats.eligibleCount}</div>
          <div className="stat-label">Eligible to Donate</div>
        </div>
      </div>
    </div>
  );
}

function Donors() {
  const [donors, setDonors] = useState([]);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = () => {
    fetch('/api/donors').then(res => res.json()).then(setDonors);
  };

  const handleDonate = async (id) => {
    if(!confirm('Record a new donation for this donor?')) return;
    await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donor_id: id })
    });
    fetchDonors();
  };

  return (
    <div className="animate-fade">
      <h2 style={{ marginBottom: '1.5rem' }}>Donor Directory</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Group</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {donors.map(d => (
              <tr key={d.donor_id}>
                <td>{d.name}</td>
                <td><span className="badge blood-group">{d.blood_group}</span></td>
                <td>{d.phone}</td>
                <td>
                  {d.eligible ? 
                    <span className="badge eligible">Eligible</span> : 
                    <span className="badge ineligible">Wait {90 - d.days_since} days</span>
                  }
                </td>
                <td>
                  <button onClick={() => handleDonate(d.donor_id)} className="btn btn-small" disabled={!d.eligible}>
                    Donate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Search() {
  const [group, setGroup] = useState('A+');
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/search?blood_group=${encodeURIComponent(group)}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="animate-fade">
      <h2 style={{ marginBottom: '1.5rem' }}>Search Donors</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <select value={group} onChange={e => setGroup(e.target.value)} className="form-control" style={{ width: '200px' }}>
          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>
        <button type="submit" className="btn">Search</button>
      </form>

      {results.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map(d => (
                <tr key={d.donor_id}>
                  <td>{d.name}</td>
                  <td>{d.address}</td>
                  <td>
                    {d.days_since === null || d.days_since >= 90 ? 
                      <span className="badge eligible">Available</span> : 
                      <span className="badge ineligible">Unavailable</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Register({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', blood_group: 'A+', phone: '', address: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      alert('Donor registered successfully!');
      onSuccess();
    } else {
      const error = await res.json();
      alert(error.error || 'Failed to register');
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Register New Donor</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input required type="text" className="form-control" onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Age</label>
            <input required type="number" min="18" max="65" className="form-control" onChange={e => setFormData({...formData, age: e.target.value})} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Gender</label>
            <select className="form-control" onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Blood Group</label>
            <select className="form-control" onChange={e => setFormData({...formData, blood_group: e.target.value})}>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input required type="tel" className="form-control" onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Address</label>
          <textarea required className="form-control" rows="3" onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
        </div>
        <button type="submit" className="btn" style={{ width: '100%' }}>Register Donor</button>
      </form>
    </div>
  );
}
