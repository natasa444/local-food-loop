const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/subscriptions
router.get('/', authenticate, requireRole('consumer'), async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM subscription WHERE user_id = ? ORDER BY start_date DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions.' });
  }
});

// POST /api/subscriptions
router.post('/', authenticate, requireRole('consumer'), async (req, res) => {
  const { box_size, frequency, start_date } = req.body;
  if (!box_size || !frequency) {
    return res.status(400).json({ error: 'box_size and frequency are required.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO subscription (box_size, frequency, start_date, status, user_id) VALUES (?, ?, ?, "active", ?)',
      [box_size, frequency, start_date || new Date().toISOString().slice(0, 10), req.user.id]
    );
    await db.execute(
      'INSERT INTO notification (type, message, user_id) VALUES ("subscription_change", ?, ?)',
      [`Your ${box_size} box subscription has been created successfully.`, req.user.id]
    );
    res.status(201).json({ id: result.insertId, box_size, frequency, status: 'active' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subscription.' });
  }
});

// PUT /api/subscriptions/:id
router.put('/:id', authenticate, requireRole('consumer'), async (req, res) => {
  const { status, box_size, frequency, pause_start, pause_end } = req.body;
  try {
    const [existing] = await db.execute(
      'SELECT * FROM subscription WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Subscription not found.' });

    await db.execute(
      `UPDATE subscription SET
        status = COALESCE(?, status),
        box_size = COALESCE(?, box_size),
        frequency = COALESCE(?, frequency),
        pause_start = ?,
        pause_end = ?
       WHERE id = ? AND user_id = ?`,
      [status || null, box_size || null, frequency || null, pause_start || null, pause_end || null, req.params.id, req.user.id]
    );

    const actionMsg = status === 'cancelled' ? 'cancelled' : status === 'paused' ? 'paused' : 'updated';
    await db.execute(
      'INSERT INTO notification (type, message, user_id) VALUES ("subscription_change", ?, ?)',
      [`Your subscription has been ${actionMsg}.`, req.user.id]
    );
    res.json({ message: 'Subscription updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update subscription.' });
  }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', authenticate, requireRole('consumer'), async (req, res) => {
  try {
    const [existing] = await db.execute(
      'SELECT * FROM subscription WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Subscription not found.' });

    await db.execute(
      'UPDATE subscription SET status = "cancelled" WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Subscription cancelled.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel subscription.' });
  }
});

module.exports = router;