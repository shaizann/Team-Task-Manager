import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/signup', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Join TaskFlow today</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select
              style={styles.input}
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button style={styles.button} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' },
  title: { fontSize: '24px', fontWeight: '600', marginBottom: '4px' },
  subtitle: { color: '#666', marginBottom: '1.5rem' },
  error: { background: '#fee', color: '#c00', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  button: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', marginTop: '0.5rem' },
  link: { textAlign: 'center', marginTop: '1rem', fontSize: '14px', color: '#666' }
};