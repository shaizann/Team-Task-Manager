const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/project/:projectId', auth, (req, res) => {
  db.all(`
    SELECT t.*, u.name as assignee_name FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.project_id = ?
  `, [req.params.projectId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

router.post('/', auth, isAdmin, (req, res) => {
  const { title, description, project_id, assignee_id, due_date, priority } = req.body;
  if (!title || !project_id)
    return res.status(400).json({ error: 'Title and project required' });
  db.run(`
    INSERT INTO tasks (title, description, project_id, assignee_id, due_date, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [title, description, project_id, assignee_id, due_date, priority || 'medium'],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID, title });
    }
  );
});

router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  db.run('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Status updated' });
  });
});

router.put('/:id', auth, isAdmin, (req, res) => {
  const { title, description, assignee_id, due_date, priority, status } = req.body;
  db.run(`
    UPDATE tasks SET title=?, description=?, assignee_id=?, due_date=?, priority=?, status=?
    WHERE id=?
  `, [title, description, assignee_id, due_date, priority, status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Task updated' });
  });
});

router.delete('/:id', auth, isAdmin, (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Task deleted' });
  });
});

module.exports = router;