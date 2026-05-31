const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/produce
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, u.first_name, u.last_name
      FROM produce p
      JOIN user u ON p.user_id = u.id
      WHERE p.available_until >= CURDATE()
      ORDER BY p.available_from ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch produce.' });
  }
});

// GET /api/produce/my
router.get('/my', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM produce WHERE user_id = ? ORDER BY available_from DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your produce.' });
  }
});

// POST /api/produce
router.post('/', authenticate, requireRole('farmer'), async (req, res) => {
  const { name, quantity, unit, price_per_unit, available_from, available_until } = req.body;
  if (!name || !quantity || !unit || !price_per_unit || !available_from || !available_until) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO produce (name, quantity, unit, price_per_unit, available_from, available_until, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, quantity, unit, price_per_unit, available_from, available_until, req.user.id]
    );
    res.status(201).json({ id: result.insertId, name, quantity, unit, price_per_unit, available_from, available_until });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add produce.' });
  }
});

// PUT /api/produce/:id
router.put('/:id', authenticate, requireRole('farmer'), async (req, res) => {
  const { name, quantity, unit, price_per_unit, available_from, available_until } = req.body;
  try {
    const [existing] = await db.execute(
      'SELECT * FROM produce WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Produce not found.' });

    await db.execute(
      `UPDATE produce SET
        name = COALESCE(?, name),
        quantity = COALESCE(?, quantity),
        unit = COALESCE(?, unit),
        price_per_unit = COALESCE(?, price_per_unit),
        available_from = COALESCE(?, available_from),
        available_until = COALESCE(?, available_until)
       WHERE id = ? AND user_id = ?`,
      [name, quantity, unit, price_per_unit, available_from, available_until, req.params.id, req.user.id]
    );

    const newQty = quantity || existing[0].quantity;
    if (parseFloat(newQty) < 5) {
      await db.execute(
        'INSERT INTO notification (type, message, user_id) VALUES ("low_inventory", ?, ?)',
        [`Low inventory alert: ${name || existing[0].name} is below 5 ${unit || existing[0].unit}.`, req.user.id]
      );
    }
    res.json({ message: 'Produce updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update produce.' });
  }
});

// DELETE /api/produce/:id
router.delete('/:id', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    const [existing] = await db.execute(
      'SELECT * FROM produce WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Produce not found.' });

    await db.execute('DELETE FROM produce WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Produce deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete produce.' });
  }
});

module.exports = router;