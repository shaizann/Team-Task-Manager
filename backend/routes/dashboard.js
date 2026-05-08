const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM tasks t
    INNER JOIN project_members pm ON t.project_id = pm.project_id
    WHERE pm.user_id = ?
  `).get(req.user.id);

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks t
    INNER JOIN project_members pm ON t.project_id = pm.project_id
    WHERE pm.user_id = ?
    GROUP BY status
  `).all(req.user.id);

  const overdue = db.prepare(`
    SELECT COUNT(*) as count FROM tasks t
    INNER JOIN project_members pm ON t.project_id = pm.project_id
    WHERE pm.user_id = ? AND t.due_date < date('now') AND t.status != 'done'
  `).get(req.user.id);

  const myTasks = db.prepare(`
    SELECT t.*, u.name as assignee_name FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.assignee_id = ?
    ORDER BY t.due_date ASC
  `).all(req.user.id);

  res.json({ total: total.count, byStatus, overdue: overdue.count, myTasks });
});

module.exports = router;