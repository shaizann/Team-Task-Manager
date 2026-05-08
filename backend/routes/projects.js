const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/', auth, (req, res) => {
  db.all(`
    SELECT p.* FROM projects p
    INNER JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ?
  `, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

router.post('/', auth, isAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  db.run(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
    [name, description, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      db.run(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [this.lastID, req.user.id, 'admin']
      );
      res.json({ id: this.lastID, name, description });
    }
  );
});

router.get('/:id', auth, (req, res) => {
  db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Project not found' });
    res.json(row);
  });
});

router.delete('/:id', auth, isAdmin, (req, res) => {
  db.run('DELETE FROM tasks WHERE project_id = ?', [req.params.id]);
  db.run('DELETE FROM project_members WHERE project_id = ?', [req.params.id]);
  db.run('DELETE FROM projects WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Project deleted' });
  });
});

router.post('/:id/members', auth, isAdmin, (req, res) => {
  const { email, role } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    db.run(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.id, user.id, role || 'member'],
      (err) => {
        if (err) return res.status(400).json({ error: 'User already a member' });
        res.json({ message: 'Member added' });
      }
    );
  });
});

router.get('/:id/members', auth, (req, res) => {
  db.all(`
    SELECT u.id, u.name, u.email, pm.role FROM users u
    INNER JOIN project_members pm ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

module.exports = router;