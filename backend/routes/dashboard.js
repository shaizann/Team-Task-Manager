const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const total = await db.get(`
      SELECT COUNT(*) as count FROM tasks t
      INNER JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = $1
    `, [userId]);

    const byStatus = await db.all(`
      SELECT status, COUNT(*) as count FROM tasks t
      INNER JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = $1
      GROUP BY status
    `, [userId]);

    const overdue = await db.get(`
      SELECT COUNT(*) as count FROM tasks t
      INNER JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = $1 AND t.due_date < CURRENT_DATE AND t.status != 'done'
    `, [userId]);

    const myTasks = await db.all(`
      SELECT t.*, u.name as assignee_name FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.assignee_id = $1
      ORDER BY t.due_date ASC
    `, [userId]);

    res.json({
      total: parseInt(total?.count) || 0,
      byStatus: byStatus || [],
      overdue: parseInt(overdue?.count) || 0,
      myTasks: myTasks || []
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;