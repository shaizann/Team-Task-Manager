const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await db.all(`
      SELECT t.*, u.name as assignee_name FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = $1
    `, [req.params.projectId]);
    res.json(tasks);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
  const { title, description, project_id, assignee_id, due_date, priority } = req.body;
  if (!title || !project_id)
    return res.status(400).json({ error: 'Title and project required' });
  try {
    const task = await db.get(`
      INSERT INTO tasks (title, description, project_id, assignee_id, due_date, priority)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [title, description, project_id, assignee_id, due_date, priority || 'medium']);
    res.json({ id: task.id, title });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  try {
    await db.run('UPDATE tasks SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
  const { title, description, assignee_id, due_date, priority, status } = req.body;
  try {
    await db.run(`
      UPDATE tasks SET title=$1, description=$2, assignee_id=$3, due_date=$4, priority=$5, status=$6
      WHERE id=$7
    `, [title, description, assignee_id, due_date, priority, status, req.params.id]);
    res.json({ message: 'Task updated' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;