const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, full_name, role, is_active, created_at FROM profiles');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const { email, password, full_name, role } = req.body;
  try {
    const hash = await bcrypt.hash(password || '123456', 10);
    const result = await db.query(
      'INSERT INTO profiles (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, hash, full_name, role || 'tecnico']
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, role, is_active } = req.body;
  try {
    const result = await db.query(
      'UPDATE profiles SET full_name = COALESCE($1, full_name), role = COALESCE($2, role), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING id, email, full_name, role',
      [full_name, role, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM profiles WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
