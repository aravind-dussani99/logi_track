import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all ledger entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { dateFrom, dateTo, type, fromAccountId, toAccountId } = req.query;
    let query = `
      SELECT 
        l.*,
        fa.name as from_account_name,
        ta.name as to_account_name
      FROM ledger_entries l
      LEFT JOIN accounts fa ON l.from_account_id = fa.id
      LEFT JOIN accounts ta ON l.to_account_id = ta.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (dateFrom) {
      query += ` AND l.date >= $${paramCount++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND l.date <= $${paramCount++}`;
      params.push(dateTo);
    }
    if (type) {
      query += ` AND l.type = $${paramCount++}`;
      params.push(type);
    }
    if (fromAccountId) {
      query += ` AND l.from_account_id = $${paramCount++}`;
      params.push(fromAccountId);
    }
    if (toAccountId) {
      query += ` AND l.to_account_id = $${paramCount++}`;
      params.push(toAccountId);
    }

    query += ` ORDER BY l.date DESC, l.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single ledger entry
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        l.*,
        fa.name as from_account_name,
        ta.name as to_account_name
      FROM ledger_entries l
      LEFT JOIN accounts fa ON l.from_account_id = fa.id
      LEFT JOIN accounts ta ON l.to_account_id = ta.id
      WHERE l.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ledger entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create ledger entry
router.post('/', authenticateToken, requireRole('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const {
      date,
      from_account_id,
      via,
      to_account_id,
      actual_to,
      amount,
      to_bank,
      split,
      payment_sub_type,
      payment_type,
      remarks,
      type,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO ledger_entries (
        date, from_account_id, via, to_account_id, actual_to, amount,
        to_bank, split, payment_sub_type, payment_type, remarks, type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        date, from_account_id, via, to_account_id, actual_to, parseFloat(amount),
        to_bank, split, payment_sub_type, payment_type, remarks, type
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update ledger entry
router.put('/:id', authenticateToken, requireRole('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const entryId = req.params.id;
    const updateFields = req.body;

    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateFields).forEach((key) => {
      if (key !== 'id') {
        setClause.push(`${key} = $${paramCount++}`);
        values.push(updateFields[key]);
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(entryId);

    const query = `UPDATE ledger_entries SET ${setClause.join(', ')} WHERE id = $${paramCount++} RETURNING *`;
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete ledger entry
router.delete('/:id', authenticateToken, requireRole('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ledger_entries WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    res.json({ message: 'Ledger entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

