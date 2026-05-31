const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, first_name, last_name, email, role, created_at FROM user ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', authenticate, requireRole('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['consumer', 'farmer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  try {
    await db.execute('UPDATE user SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'User role updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }
    await db.execute('DELETE FROM user WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// GET /api/admin/manifests
router.get('/manifests', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [manifests] = await db.execute(`
      SELECT m.*, d.scheduled_date, d.drop_off_location, d.status as delivery_status
      FROM manifest m
      JOIN delivery d ON m.delivery_id = d.id
      ORDER BY m.generated_at DESC
    `);
    for (const manifest of manifests) {
      const [items] = await db.execute(`
        SELECT mi.*, p.name as produce_name, p.unit
        FROM manifest_item mi
        JOIN produce p ON mi.produce_id = p.id
        WHERE mi.manifest_id = ?
      `, [manifest.id]);
      manifest.items = items;
    }
    res.json(manifests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manifests.' });
  }
});

// POST /api/admin/manifests/:id/items
router.post('/manifests/:id/items', authenticate, requireRole('admin'), async (req, res) => {
  const { produce_id, quantity } = req.body;
  if (!produce_id || !quantity) return res.status(400).json({ error: 'produce_id and quantity required.' });
  try {
    await db.execute(
      'INSERT INTO manifest_item (quantity, manifest_id, produce_id) VALUES (?, ?, ?)',
      [quantity, req.params.id, produce_id]
    );
    res.status(201).json({ message: 'Item added to manifest.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add manifest item.' });
  }
});

// PUT /api/admin/manifests/:id/finalize
router.put('/manifests/:id/finalize', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await db.execute('UPDATE manifest SET finalized = true WHERE id = ?', [req.params.id]);
    res.json({ message: 'Manifest finalized.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to finalize manifest.' });
  }
});

// GET /api/admin/stats
router.get('/stats', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [[{ total_users }]] = await db.execute('SELECT COUNT(*) as total_users FROM user');
    const [[{ active_subs }]] = await db.execute('SELECT COUNT(*) as active_subs FROM subscription WHERE status = "active"');
    const [[{ pending_deliveries }]] = await db.execute('SELECT COUNT(*) as pending_deliveries FROM delivery WHERE status = "pending"');
    const [[{ pending_customs }]] = await db.execute('SELECT COUNT(*) as pending_customs FROM box_customization WHERE status = "pending"');
    res.json({ total_users, active_subs, pending_deliveries, pending_customs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;