import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // FIXED: Changed from localhost to your live Render URL
  const API_URL = "https://resume-screen1.onrender.com"; 

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`${API_URL}/candidates`);
      if (!res.ok) throw new Error("Backend not responding");
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/upload-resume`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchCandidates();
      } else {
        alert("Upload failed on server");
      }
    } catch (err) {
      alert("Cannot connect to backend. Make sure Render is live.");
    } finally {
      setLoading(false);
      e.target.value = null; 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this candidate?")) {
      try {
        const res = await fetch(`${API_URL}/candidates/${id}`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            fetchCandidates();
        } else {
            alert("Delete failed on server");
        }
      } catch (err) {
        alert("Network error while deleting");
      }
    }
  };

  const handleExport = () => {
    window.open(`${API_URL}/export-excel`, "_blank");
  };

  return (
    <div className="app-container">
      <div className="glass-card">
        <header className="main-header">
          <div className="logo-section">
            <h1>Resume Screen</h1>
          </div>
          <button className="btn-export" onClick={handleExport}>
            Export to Excel
          </button>
        </header>

        <section className="upload-zone">
          <label className="custom-upload">
            <input type="file" onChange={handleUpload} accept=".pdf" />
            <div className="upload-content">
              <span className="upload-icon">{loading ? "⌛" : "☁️"}</span>
              <p>{loading ? "Scanning Resume..." : "Drag & Drop Resume (PDF) here or Click to Upload"}</p>
            </div>
          </label>
        </section>

        <section className="table-container">
          <table>
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Rank</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="name-column">
                      <span className="name-text">{c.name}</span>
                      <span className="summary-text">Skills detected: python, communication</span>
                    </div>
                  </td>
                  <td>
                    <span className="stars">
                      {"★".repeat(c.score)}{"☆".repeat(5 - c.score)}
                    </span>
                  </td>
                  <td><span className="badge">Screened</span></td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(c.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {candidates.length === 0 && !loading && <p className="empty-msg">No candidates uploaded.</p>}
        </section>
      </div>
    </div>
  );
}

export default App;