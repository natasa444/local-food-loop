const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/deliveries
router.get('/', authenticate, requireRole('consumer'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, s.box_size, s.frequency
      FROM delivery d
      JOIN subscription s ON d.subscription_id = s.id
      WHERE s.user_id = ?
      ORDER BY d.scheduled_date DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deliveries.' });
  }
});

// GET /api/deliveries/all
router.get('/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, s.box_size, u.first_name, u.last_name, u.email
      FROM delivery d
      JOIN subscription s ON d.subscription_id = s.id
      JOIN user u ON s.user_id = u.id
      ORDER BY d.scheduled_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deliveries.' });
  }
});

// POST /api/deliveries
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  const { scheduled_date, drop_off_location, subscription_id } = req.body;
  if (!scheduled_date || !drop_off_location || !subscription_id) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO delivery (scheduled_date, status, drop_off_location, subscription_id) VALUES (?, "pending", ?, ?)',
      [scheduled_date, drop_off_location, subscription_id]
    );
    await db.execute(
      'INSERT INTO manifest (finalized, delivery_id) VALUES (false, ?)',
      [result.insertId]
    );
    const [subRows] = await db.execute('SELECT user_id FROM subscription WHERE id = ?', [subscription_id]);
    if (subRows.length > 0) {
      await db.execute(
        'INSERT INTO notification (type, message, user_id) VALUES ("delivery_update", ?, ?)',
        [`A delivery has been scheduled for ${scheduled_date} at ${drop_off_location}.`, subRows[0].user_id]
      );
    }
    res.status(201).json({ id: result.insertId, scheduled_date, status: 'pending', drop_off_location });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create delivery.' });
  }
});

// PUT /api/deliveries/:id/status
router.put('/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'in_transit', 'delivered'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    await db.execute('UPDATE delivery SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await db.execute(`
      SELECT s.user_id FROM delivery d
      JOIN subscription s ON d.subscription_id = s.id
      WHERE d.id = ?
    `, [req.params.id]);
    if (rows.length > 0) {
      const msgs = {
        in_transit: 'Your box is out for delivery!',
        delivered: 'Your box has been delivered. Enjoy!',
        pending: 'Your delivery status has been updated to pending.'
      };
      await db.execute(
        'INSERT INTO notification (type, message, user_id) VALUES ("delivery_update", ?, ?)',
        [msgs[status], rows[0].user_id]
      );
    }
    res.json({ message: `Delivery status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update delivery status.' });
  }
});

module.exports = router;