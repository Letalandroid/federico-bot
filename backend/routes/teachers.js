const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM teachers ORDER BY full_name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { full_name, dni, email, phone } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO teachers (full_name, dni, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [full_name, dni, email, phone]
    );
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'DNI already exists' });
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { full_name, dni, email, phone } = req.body;
  try {
    const result = await db.query(
      'UPDATE teachers SET full_name = COALESCE($1, full_name), dni = COALESCE($2, dni), email = COALESCE($3, email), phone = COALESCE($4, phone) WHERE id = $5 RETURNING *',
      [full_name, dni, email, phone, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM teachers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Teacher deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
