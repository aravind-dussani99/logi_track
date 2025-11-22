import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all advances
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { dateFrom, dateTo, tripId } = req.query;
    let query = `
      SELECT 
        a.*,
        t.date as trip_date,
        t.place as trip_place,
        t.invoice_dc_number as trip_invoice_dc_number,
        t.vehicle_id,
        v.vehicle_number
      FROM advances a
      LEFT JOIN trips t ON a.trip_id = t.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // For supervisors, only show their own advances
    if (req.user.role === 'supervisor') {
      query += ` AND a.user_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    if (dateFrom) {
      query += ` AND a.date >= $${paramCount++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND a.date <= $${paramCount++}`;
      params.push(dateTo);
    }
    if (tripId) {
      query += ` AND a.trip_id = $${paramCount++}`;
      params.push(tripId);
    }

    query += ` ORDER BY a.date DESC, a.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching advances:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single advance
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        a.*,
        t.date as trip_date,
        t.place as trip_place,
        t.invoice_dc_number as trip_invoice_dc_number,
        t.vehicle_id,
        v.vehicle_number
      FROM advances a
      LEFT JOIN trips t ON a.trip_id = t.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Advance not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching advance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create advance
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      trip_id,
      date,
      from_account,
      to_account,
      purpose,
      amount,
      voucher_slip_upload,
      place,
      invoice_dc_number,
      owner_and_transporter_name,
      vehicle_number,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO advances (
        user_id, trip_id, date, from_account, to_account, purpose, amount,
        voucher_slip_upload, place, invoice_dc_number, owner_and_transporter_name, vehicle_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        req.user.id, trip_id || null, date, from_account, to_account, purpose,
        parseFloat(amount), voucher_slip_upload, place, invoice_dc_number,
        owner_and_transporter_name, vehicle_number
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating advance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update advance
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const advanceId = req.params.id;
    const updateFields = req.body;

    // Verify ownership for supervisors
    if (req.user.role === 'supervisor') {
      const checkResult = await pool.query(
        'SELECT user_id FROM advances WHERE id = $1',
        [advanceId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Advance not found' });
      }

      if (checkResult.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateFields).forEach((key) => {
      if (key !== 'id' && key !== 'user_id') {
        setClause.push(`${key} = $${paramCount++}`);
        values.push(updateFields[key]);
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(advanceId);

    const query = `UPDATE advances SET ${setClause.join(', ')} WHERE id = $${paramCount++} RETURNING *`;
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Advance not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating advance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete advance
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verify ownership for supervisors
    if (req.user.role === 'supervisor') {
      const checkResult = await pool.query(
        'SELECT user_id FROM advances WHERE id = $1',
        [req.params.id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Advance not found' });
      }

      if (checkResult.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    const result = await pool.query('DELETE FROM advances WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Advance not found' });
    }

    res.json({ message: 'Advance deleted successfully' });
  } catch (error) {
    console.error('Error deleting advance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

