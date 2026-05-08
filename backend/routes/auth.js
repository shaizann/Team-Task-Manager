const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(name, email, hash, role === 'admin' ? 'admin' : 'member');
    const token = jwt.sign(
      { id: result.lastInsertRowid, role: role === 'admin' ? 'admin' : 'member' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: result.lastInsertRowid, name, email } });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;