import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchProjects = () => {
    api.get('/api/projects')
      .then(res => { setProjects(res.data); setLoading(false); })
      .catch(() => { logout(); navigate('/login'); });
  };

  useEffect(() => { fetchProjects(); }, []);

  const createProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/projects', form);
      setForm({ name: '', description: '' });
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📋 TaskFlow</h1>
        <div style={styles.headerRight}>
          <button style={styles.dashBtn} onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </div>

      <div style={styles.topRow}>
        <h2 style={styles.pageTitle}>My Projects</h2>
        {user?.role === 'admin' && (
          <button style={styles.newBtn} onClick={() => setShowModal(true)}>+ New Project</button>
        )}
      </div>

      {projects.length === 0 ? (
        <div style={styles.empty}>
          <p>No projects yet.</p>
          {user?.role === 'admin' && <p>Click "New Project" to get started!</p>}
          {user?.role === 'member' && <p>Ask an admin to add you to a project.</p>}
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map(p => (
            <div key={p.id} style={styles.card} onClick={() => navigate(`/projects/${p.id}`)}>
              <h3 style={styles.cardTitle}>{p.name}</h3>
              <p style={styles.cardDesc}>{p.description || 'No description'}</p>
              <p style={styles.cardDate}>Created: {new Date(p.created_at).toLocaleDateString()}</p>
              <button style={styles.viewBtn}>View Tasks →</button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>New Project</h3>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={createProject}>
              <div style={styles.field}>
                <label style={styles.label}>Project Name</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Enter project name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                  placeholder="Project description (optional)"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div style={styles.modalBtns}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  title: { fontSize: '22px', fontWeight: '700', color: '#4f46e5' },
  headerRight: { display: 'flex', gap: '12px' },
  dashBtn: { padding: '8px 16px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontWeight: '500' },
  logoutBtn: { padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '500' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  pageTitle: { fontSize: '20px', fontWeight: '600' },
  newBtn: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600' },
  empty: { textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '12px', color: '#666' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  card: { background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid #4f46e5' },
  cardTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '8px' },
  cardDesc: { fontSize: '14px', color: '#666', marginBottom: '12px' },
  cardDate: { fontSize: '12px', color: '#999', marginBottom: '12px' },
  viewBtn: { padding: '8px 16px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontWeight: '500', width: '100%' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '440px' },
  modalTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '1.5rem' },
  error: { background: '#fee', color: '#c00', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  modalBtns: { display: 'flex', gap: '12px', marginTop: '1rem' },
  cancelBtn: { flex: 1, padding: '10px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: '8px', fontWeight: '500' },
  submitBtn: { flex: 1, padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600' },
};