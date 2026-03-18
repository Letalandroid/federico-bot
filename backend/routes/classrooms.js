const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM classrooms ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { name, description, capacity, location } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO classrooms (name, description, capacity, location) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, capacity, location]
    );
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Classroom name already exists' });
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, description, capacity, location } = req.body;
  try {
    const result = await db.query(
      'UPDATE classrooms SET name = COALESCE($1, name), description = COALESCE($2, description), capacity = COALESCE($3, capacity), location = COALESCE($4, location) WHERE id = $5 RETURNING *',
      [name, description, capacity, location, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM classrooms WHERE id = $1', [req.params.id]);
    res.json({ message: 'Classroom deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
