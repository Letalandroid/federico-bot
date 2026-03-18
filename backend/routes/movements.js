const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/movements
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.*, 
             e.name as equipment_name, e.serial_number, 
             t.full_name as teacher_name, 
             c.name as classroom_name,
             p.full_name as created_by_name
      FROM movements m
      LEFT JOIN equipment e ON m.equipment_id = e.id
      LEFT JOIN teachers t ON m.teacher_id = t.id
      LEFT JOIN classrooms c ON m.classroom_id = c.id
      LEFT JOIN profiles p ON m.created_by = p.id
      ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/movements
router.post('/', async (req, res) => {
  const { equipment_id, teacher_id, classroom_id, movement_type, quantity, description, scheduled_return_date, actual_return_date, created_by } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO movements (equipment_id, teacher_id, classroom_id, movement_type, quantity, description, scheduled_return_date, actual_return_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [equipment_id, teacher_id, classroom_id, movement_type, quantity, description, scheduled_return_date, actual_return_date, created_by]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/movements/:id
router.put('/:id', async (req, res) => {
  const { status, actual_return_date } = req.body;
  try {
    const result = await db.query(
      'UPDATE movements SET status = COALESCE($1, status), actual_return_date = COALESCE($2, actual_return_date) WHERE id = $3 RETURNING *',
      [status, actual_return_date, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/movements/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM movements WHERE id = $1', [req.params.id]);
    res.json({ message: 'Movement deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
