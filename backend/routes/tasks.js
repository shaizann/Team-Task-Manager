const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/project/:projectId', auth, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.name as assignee_name FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.project_id = ?
  `).all(req.params.projectId);
  res.json(tasks);
});

router.post('/', auth, isAdmin, (req, res) => {
  const { title, description, project_id, assignee_id, due_date, priority } = req.body;
  if (!title || !project_id)
    return res.status(400).json({ error: 'Title and project required' });
  const result = db.prepare(`
    INSERT INTO tasks (title, description, project_id, assignee_id, due_date, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, description, project_id, assignee_id, due_date, priority || 'medium');
  res.json({ id: result.lastInsertRowid, title });
});

router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status updated' });
});

router.put('/:id', auth, isAdmin, (req, res) => {
  const { title, description, assignee_id, due_date, priority, status } = req.body;
  db.prepare(`
    UPDATE tasks SET title=?, description=?, assignee_id=?, due_date=?, priority=?, status=?
    WHERE id=?
  `).run(title, description, assignee_id, due_date, priority, status, req.params.id);
  res.json({ message: 'Task updated' });
});

router.delete('/:id', auth, isAdmin, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;