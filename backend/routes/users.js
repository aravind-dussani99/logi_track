import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, display_name, role, avatar, is_active, created_at FROM users ORDER BY display_name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Users can view their own profile, admins can view any
    if (req.user.id !== req.params.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      'SELECT id, username, email, display_name, role, avatar, is_active, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only)
router.post('/', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { username, email, password, display_name, role, avatar } = req.body;

    if (!username || !password || !display_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if username already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, role, avatar)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, display_name, role, avatar, is_active, created_at`,
      [username, email, password_hash, display_name, role, avatar]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const { display_name, avatar, password, role, is_active } = req.body;

    // Users can update their own profile (name, avatar), admins can update anything
    if (req.user.id !== userId && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Only admins can change role and is_active
    if ((role !== undefined || is_active !== undefined) && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to change role or status' });
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (display_name !== undefined) {
      updateFields.push(`display_name = $${paramCount++}`);
      values.push(display_name);
    }
    if (avatar !== undefined) {
      updateFields.push(`avatar = $${paramCount++}`);
      values.push(avatar);
    }
    if (role !== undefined && ['admin', 'superadmin'].includes(req.user.role)) {
      updateFields.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (is_active !== undefined && ['admin', 'superadmin'].includes(req.user.role)) {
      updateFields.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (password !== undefined) {
      // Only admins or the user themselves can change password
      if (req.user.id === userId || ['admin', 'superadmin'].includes(req.user.role)) {
        const password_hash = await bcrypt.hash(password, 10);
        updateFields.push(`password_hash = $${paramCount++}`);
        values.push(password_hash);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount++} RETURNING id, username, email, display_name, role, avatar, is_active, created_at`;
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

