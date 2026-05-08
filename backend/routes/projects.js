const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/', auth, (req, res) => {
  const projects = db.prepare(`
    SELECT p.* FROM projects p
    INNER JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ?
  `).all(req.user.id);
  res.json(projects);
});

router.post('/', auth, isAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  const result = db.prepare(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
  ).run(name, description, req.user.id);
  db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, req.user.id, 'admin');
  res.json({ id: result.lastInsertRowid, name, description });
});

router.get('/:id', auth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.delete('/:id', auth, isAdmin, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM project_members WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

router.post('/:id/members', auth, isAdmin, (req, res) => {
  const { email, role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  try {
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(req.params.id, user.id, role || 'member');
    res.json({ message: 'Member added' });
  } catch {
    res.status(400).json({ error: 'User already a member' });
  }
});

router.get('/:id/members', auth, (req, res) => {
  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role FROM users u
    INNER JOIN project_members pm ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `).all(req.params.id);
  res.json(members);
});

module.exports = router;