import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee_id: '', due_date: '', priority: 'medium' });
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [p, t, m] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/tasks/project/${id}`),
        api.get(`/api/projects/${id}/members`)
      ]);
      setProject(p.data);
      setTasks(t.data);
      setMembers(m.data);
      setLoading(false);
    } catch {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const createTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/tasks', { ...taskForm, project_id: id });
      setTaskForm({ title: '', description: '', assignee_id: '', due_date: '', priority: 'medium' });
      setShowTaskModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/api/tasks/${taskId}/status`, { status });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/api/projects/${id}/members`, { email: memberEmail, role: 'member' });
      setMemberEmail('');
      setShowMemberModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📋 TaskFlow</h1>
        <div style={styles.headerRight}>
          <button style={styles.backBtn} onClick={() => navigate('/projects')}>← Projects</button>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </div>

      <div style={styles.projectHeader}>
        <div>
          <h2 style={styles.projectTitle}>{project?.name}</h2>
          <p style={styles.projectDesc}>{project?.description || 'No description'}</p>
        </div>
        {user?.role === 'admin' && (
          <div style={styles.adminBtns}>
            <button style={styles.memberBtn} onClick={() => setShowMemberModal(true)}>+ Add Member</button>
            <button style={styles.deleteBtn} onClick={deleteProject}>Delete Project</button>
          </div>
        )}
      </div>

      <div style={styles.membersRow}>
        <span style={styles.membersLabel}>👥 Members:</span>
        {members.map(m => (
          <span key={m.id} style={styles.memberBadge}>{m.name} ({m.role})</span>
        ))}
      </div>

      <div style={styles.taskHeader}>
        <h3 style={styles.sectionTitle}>Tasks ({tasks.length})</h3>
        {user?.role === 'admin' && (
          <button style={styles.newTaskBtn} onClick={() => setShowTaskModal(true)}>+ New Task</button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div style={styles.empty}>No tasks yet. {user?.role === 'admin' && 'Click "+ New Task" to add one.'}</div>
      ) : (
        <div style={styles.taskList}>
          {tasks.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            return (
              <div key={task.id} style={{ ...styles.taskCard, borderLeft: `4px solid ${isOverdue ? '#ef4444' : priorityColor(task.priority)}` }}>
                <div style={styles.taskTop}>
                  <div>
                    <span style={styles.taskTitle}>{task.title}</span>
                    <span style={{ ...styles.priorityBadge, background: priorityColor(task.priority) }}>{task.priority}</span>
                    {isOverdue && <span style={styles.overdueBadge}>⚠️ Overdue</span>}
                  </div>
                  {user?.role === 'admin' && (
                    <button style={styles.deleteTaskBtn} onClick={() => deleteTask(task.id)}>✕</button>
                  )}
                </div>
                {task.description && <p style={styles.taskDesc}>{task.description}</p>}
                <div style={styles.taskBottom}>
                  <div style={styles.taskMeta}>
                    {task.assignee_name && <span style={styles.assignee}>👤 {task.assignee_name}</span>}
                    {task.due_date && <span style={{ color: isOverdue ? '#ef4444' : '#666', fontSize: '13px' }}>📅 {task.due_date}</span>}
                  </div>
                  <select
                    style={{ ...styles.statusSelect, background: statusBg(task.status) }}
                    value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value)}
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showTaskModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>New Task</h3>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={createTask}>
              <div style={styles.field}>
                <label style={styles.label}>Title</label>
                <input style={styles.input} type="text" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea style={{ ...styles.input, height: '70px' }} placeholder="Description (optional)"
                  value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Assign To</label>
                <select style={styles.input} value={taskForm.assignee_id}
                  onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={styles.row}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>Due Date</label>
                  <input style={styles.input} type="date" value={taskForm.due_date}
                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>Priority</label>
                  <select style={styles.input} value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div style={styles.modalBtns}>
                <button type="button" style={styles.cancelBtn} onClick={() => { setShowTaskModal(false); setError(''); }}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Add Member</h3>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={addMember}>
              <div style={styles.field}>
                <label style={styles.label}>Member Email</label>
                <input style={styles.input} type="email" placeholder="member@example.com"
                  value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required />
              </div>
              <p style={styles.hint}>The user must already have an account.</p>
              <div style={styles.modalBtns}>
                <button type="button" style={styles.cancelBtn} onClick={() => { setShowMemberModal(false); setError(''); }}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const priorityColor = (p) => p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#10b981';
const statusBg = (s) => s === 'done' ? '#d1fae5' : s === 'in_progress' ? '#fef3c7' : '#f3f4f6';

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  title: { fontSize: '22px', fontWeight: '700', color: '#4f46e5' },
  headerRight: { display: 'flex', gap: '12px' },
  backBtn: { padding: '8px 16px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontWeight: '500' },
  logoutBtn: { padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '500' },
  projectHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#fff', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  projectTitle: { fontSize: '20px', fontWeight: '700', marginBottom: '6px' },
  projectDesc: { color: '#666', fontSize: '14px' },
  adminBtns: { display: 'flex', gap: '10px' },
  memberBtn: { padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500' },
  deleteBtn: { padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '500' },
  membersRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem', background: '#fff', padding: '0.75rem 1rem', borderRadius: '10px' },
  membersLabel: { fontSize: '14px', fontWeight: '500', color: '#666' },
  memberBadge: { fontSize: '12px', background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px' },
  taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionTitle: { fontSize: '18px', fontWeight: '600' },
  newTaskBtn: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600' },
  empty: { textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '12px', color: '#666' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  taskCard: { background: '#fff', padding: '1rem 1.25rem', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  taskTitle: { fontWeight: '500', fontSize: '15px', marginRight: '8px' },
  priorityBadge: { fontSize: '11px', padding: '2px 8px', borderRadius: '20px', color: '#fff', fontWeight: '500', marginRight: '6px' },
  overdueBadge: { fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#fee2e2', color: '#dc2626', fontWeight: '500' },
  deleteTaskBtn: { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' },
  taskDesc: { fontSize: '13px', color: '#666', marginBottom: '8px' },
  taskBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  taskMeta: { display: 'flex', gap: '12px', alignItems: 'center' },
  assignee: { fontSize: '13px', color: '#666' },
  statusSelect: { padding: '6px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '1.5rem' },
  error: { background: '#fee', color: '#c00', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px' },
  field: { marginBottom: '1rem' },
  row: { display: 'flex', gap: '12px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  hint: { fontSize: '12px', color: '#999', marginBottom: '1rem' },
  modalBtns: { display: 'flex', gap: '12px', marginTop: '1rem' },
  cancelBtn: { flex: 1, padding: '10px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: '8px', fontWeight: '500' },
  submitBtn: { flex: 1, padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600' },
};