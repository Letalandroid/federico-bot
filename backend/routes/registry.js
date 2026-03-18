const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/registry (equipment incident registry)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, e.name as equipment_name, p.full_name as reported_by_name
      FROM equipment_registry r
      JOIN equipment e ON r.equipment_id = e.id
      JOIN profiles p ON r.reported_by = p.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/registry
router.post('/', async (req, res) => {
  const { equipment_id, reason, description, date_occurred, reported_by, status } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO equipment_registry (equipment_id, reason, description, date_occurred, reported_by, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [equipment_id, reason, description, date_occurred, reported_by, status || 'pendiente']
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/registry/:id
router.put('/:id', async (req, res) => {
  const { status, description } = req.body;
  try {
    const result = await db.query(
      'UPDATE equipment_registry SET status = COALESCE($1, status), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
      [status, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/registry/history
router.get('/history', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT h.*, p.full_name as changed_by_name, e.name as equipment_name
      FROM equipment_history h
      LEFT JOIN profiles p ON h.changed_by = p.id
      LEFT JOIN equipment e ON h.equipment_id = e.id
      ORDER BY h.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/registry/history
router.post('/history', async (req, res) => {
  const { equipment_id, action, old_values, new_values, changed_by, change_details } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO equipment_history (equipment_id, action, old_values, new_values, changed_by, change_details)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [equipment_id, action, old_values ? JSON.stringify(old_values) : null, new_values ? JSON.stringify(new_values) : null, changed_by, change_details ? JSON.stringify(change_details) : null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
