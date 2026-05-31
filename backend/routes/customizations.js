const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/customizations
router.get('/', authenticate, requireRole('consumer'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT bc.*, p.name as produce_name, p.unit
      FROM box_customization bc
      JOIN produce p ON bc.produce_id = p.id
      JOIN subscription s ON bc.subscription_id = s.id
      WHERE s.user_id = ?
      ORDER BY bc.requested_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customizations.' });
  }
});

// POST /api/customizations
router.post('/', authenticate, requireRole('consumer'), async (req, res) => {
  const { subscription_id, produce_id } = req.body;
  if (!subscription_id || !produce_id) {
    return res.status(400).json({ error: 'subscription_id and produce_id are required.' });
  }
  try {
    const [sub] = await db.execute(
      'SELECT * FROM subscription WHERE id = ? AND user_id = ? AND status = "active"',
      [subscription_id, req.user.id]
    );
    if (sub.length === 0) return res.status(404).json({ error: 'Active subscription not found.' });

    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const [result] = await db.execute(
      'INSERT INTO box_customization (deadline, status, subscription_id, produce_id) VALUES (?, "pending", ?, ?)',
      [deadline.toISOString().slice(0, 19).replace('T', ' '), subscription_id, produce_id]
    );
    res.status(201).json({ id: result.insertId, status: 'pending', deadline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create customization request.' });
  }
});

// GET /api/customizations/pending
router.get('/pending', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT bc.*, p.name as produce_name, u.first_name, u.last_name
      FROM box_customization bc
      JOIN produce p ON bc.produce_id = p.id
      JOIN subscription s ON bc.subscription_id = s.id
      JOIN user u ON s.user_id = u.id
      WHERE bc.status = "pending"
      ORDER BY bc.requested_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending customizations.' });
  }
});

// PUT /api/customizations/:id
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }
  try {
    await db.execute('UPDATE box_customization SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `Customization request ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customization.' });
  }
});

module.exports = router;