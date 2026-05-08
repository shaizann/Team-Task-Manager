const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/', auth, async (req, res) => {
  try {
    const projects = await db.all(`
      SELECT p.* FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1
    `, [req.user.id]);
    res.json(projects);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  try {
    const project = await db.get(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING id',
      [name, description, req.user.id]
    );
    await db.run(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, req.user.id, 'admin']
    );
    res.json({ id: project.id, name, description });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const project = await db.get('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM tasks WHERE project_id = $1', [req.params.id]);
    await db.run('DELETE FROM project_members WHERE project_id = $1', [req.params.id]);
    await db.run('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/:id/members', auth, isAdmin, async (req, res) => {
  const { email, role } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await db.run(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [req.params.id, user.id, role || 'member']
    );
    res.json({ message: 'Member added' });
  } catch { res.status(400).json({ error: 'User already a member' }); }
});

router.get('/:id/members', auth, async (req, res) => {
  try {
    const members = await db.all(`
      SELECT u.id, u.name, u.email, pm.role FROM users u
      INNER JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = $1
    `, [req.params.id]);
    res.json(members);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;