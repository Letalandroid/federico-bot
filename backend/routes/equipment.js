const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/equipment
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, c.name as category_name
      FROM equipment e
      LEFT JOIN categories c ON e.category_id = c.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/equipment/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Equipment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/equipment
router.post('/', async (req, res) => {
  const { name, category_id, description, quantity, serial_number, brand, model, created_by } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO equipment (name, category_id, description, quantity, available_quantity, serial_number, brand, model, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, category_id, description, quantity, quantity, serial_number, brand, model, created_by]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/equipment/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category_id, description, quantity, serial_number, brand, model, state } = req.body;
  try {
    const result = await db.query(
      `UPDATE equipment 
       SET name = COALESCE($1, name), 
           category_id = COALESCE($2, category_id), 
           description = COALESCE($3, description), 
           quantity = COALESCE($4, quantity), 
           serial_number = COALESCE($5, serial_number), 
           brand = COALESCE($6, brand), 
           model = COALESCE($7, model),
           state = COALESCE($8, state),
           available_quantity = COALESCE($10, available_quantity)
       WHERE id = $9 RETURNING *`,
      [name, category_id, description, quantity, serial_number, brand, model, state, id, req.body.available_quantity]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/equipment/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM equipment WHERE id = $1', [req.params.id]);
    res.json({ message: 'Equipment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
