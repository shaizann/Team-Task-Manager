import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/dashboard')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { logout(); navigate('/login'); });
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  const getStatus = (status) => data.byStatus.find(s => s.status === status)?.count || 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📋 TaskFlow</h1>
        <div style={styles.headerRight}>
          <span style={styles.username}>👤 {user?.name} ({user?.role})</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>Logout</button>
          <button style={styles.projectsBtn} onClick={() => navigate('/projects')}>My Projects</button>
        </div>
      </div>

      <h2 style={styles.welcome}>Welcome back, {user?.name}! 👋</h2>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderTop: '4px solid #4f46e5' }}>
          <p style={styles.statLabel}>Total Tasks</p>
          <p style={styles.statNum}>{data.total}</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #10b981' }}>
          <p style={styles.statLabel}>Completed</p>
          <p style={styles.statNum}>{getStatus('done')}</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #f59e0b' }}>
          <p style={styles.statLabel}>In Progress</p>
          <p style={styles.statNum}>{getStatus('in_progress')}</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: '4px solid #ef4444' }}>
          <p style={styles.statLabel}>Overdue</p>
          <p style={styles.statNum}>{data.overdue}</p>
        </div>
      </div>

      <h3 style={styles.sectionTitle}>My Tasks</h3>
      {data.myTasks.length === 0 ? (
        <p style={styles.empty}>No tasks assigned to you yet.</p>
      ) : (
        <div style={styles.taskList}>
          {data.myTasks.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            return (
              <div key={task.id} style={{ ...styles.taskCard, borderLeft: `4px solid ${isOverdue ? '#ef4444' : '#4f46e5'}` }}>
                <div style={styles.taskTop}>
                  <span style={styles.taskTitle}>{task.title}</span>
                  <span style={{ ...styles.badge, background: statusColor(task.status) }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                {task.due_date && (
                  <p style={{ ...styles.taskDate, color: isOverdue ? '#ef4444' : '#666' }}>
                    {isOverdue ? '⚠️ Overdue: ' : '📅 Due: '}{task.due_date}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const statusColor = (s) => s === 'done' ? '#10b981' : s === 'in_progress' ? '#f59e0b' : '#6b7280';

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  title: { fontSize: '22px', fontWeight: '700', color: '#4f46e5' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  username: { fontSize: '14px', color: '#666' },
  logoutBtn: { padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '500' },
  projectsBtn: { padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500' },
  welcome: { fontSize: '20px', fontWeight: '600', marginBottom: '1.5rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statLabel: { fontSize: '14px', color: '#666', marginBottom: '8px' },
  statNum: { fontSize: '32px', fontWeight: '700', color: '#111' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '1rem' },
  empty: { color: '#666', fontSize: '14px' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  taskCard: { background: '#fff', padding: '1rem 1.25rem', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  taskTitle: { fontWeight: '500', fontSize: '15px' },
  badge: { fontSize: '12px', padding: '3px 10px', borderRadius: '20px', color: '#fff', fontWeight: '500' },
  taskDate: { fontSize: '13px' }
};