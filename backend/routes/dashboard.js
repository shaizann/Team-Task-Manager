const router = require('express').Router();
const db = require('../db/database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const userId = req.user.id;
  db.get(`
    SELECT COUNT(*) as count FROM tasks t
    INNER JOIN project_members pm ON t.project_id = pm.project_id
    WHERE pm.user_id = ?
  `, [userId], (err, total) => {
    db.all(`
      SELECT status, COUNT(*) as count FROM tasks t
      INNER JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = ?
      GROUP BY status
    `, [userId], (err, byStatus) => {
      db.get(`
        SELECT COUNT(*) as count FROM tasks t
        INNER JOIN project_members pm ON t.project_id = pm.project_id
        WHERE pm.user_id = ? AND t.due_date < date('now') AND t.status != 'done'
      `, [userId], (err, overdue) => {
        db.all(`
          SELECT t.*, u.name as assignee_name FROM tasks t
          LEFT JOIN users u ON t.assignee_id = u.id
          WHERE t.assignee_id = ?
          ORDER BY t.due_date ASC
        `, [userId], (err, myTasks) => {
          res.json({
            total: total?.count || 0,
            byStatus: byStatus || [],
            overdue: overdue?.count || 0,
            myTasks: myTasks || []
          });
        });
      });
    });
  });
});

module.exports = router;