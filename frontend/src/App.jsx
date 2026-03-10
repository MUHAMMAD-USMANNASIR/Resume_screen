import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://resume-screen1.onrender.com";

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`${API_URL}/candidates`);
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload-resume`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        fetchCandidates();
      }
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    uploadFile(file);
    e.target.value = null;
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    uploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this candidate?")) {
      try {
        const res = await fetch(`${API_URL}/candidates/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          fetchCandidates();
        }
      } catch {
        alert("Delete failed");
      }
    }
  };

  const handleExport = () => {
    window.open(`${API_URL}/export-excel`, "_blank");
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="logo-section">
          <h1>Resume Screen</h1>
        </div>
        <button className="btn-export" onClick={handleExport}>
          Export to Excel
        </button>
      </header>

      <section
        className="upload-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <label className="custom-upload">
          <input type="file" accept=".pdf" onChange={handleUpload} />
          <div className="upload-content">
            <span className="upload-icon">{loading ? "⌛" : "☁️"}</span>
            <p>
              {loading
                ? "Scanning Resume..."
                : "Drag & Drop Resume (PDF) here or Click to Upload"}
            </p>
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
                  <span className="name-text">{c.name}</span>
                  <span className="summary-text">{c.summary}</span>
                </td>

                <td>
                  <span className="stars">
                    {"★".repeat(c.score)}
                    {"☆".repeat(5 - c.score)}
                  </span>
                </td>

                <td>
                  <span className="badge">Screened</span>
                </td>

                <td>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(c.id)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <p className="empty-msg">No candidates uploaded.</p>
        )}
      </section>
    </div>
  );
}

export default App;