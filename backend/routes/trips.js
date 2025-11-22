import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all trips
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, dateFrom, dateTo, customerId } = req.query;
    let query = `
      SELECT 
        t.*,
        u.display_name as created_by_name,
        c.name as customer_name,
        q.name as quarry_name,
        q.owner_name as vendor_name,
        ro.owner_name as royalty_owner_name,
        m.name as material_name,
        v.vehicle_number,
        v.driver_name,
        v.driver_mobile_number,
        to.name as transport_owner_name
      FROM trips t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN quarries q ON t.quarry_id = q.id
      LEFT JOIN royalty_owners ro ON t.royalty_owner_id = ro.id
      LEFT JOIN materials m ON t.material_id = m.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN transport_owners to ON v.transport_owner_id = to.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by status
    if (status) {
      query += ` AND t.status = $${paramCount++}`;
      params.push(status);
    }

    // Filter by date range
    if (dateFrom) {
      query += ` AND t.date >= $${paramCount++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND t.date <= $${paramCount++}`;
      params.push(dateTo);
    }

    // Filter by customer
    if (customerId) {
      query += ` AND t.customer_id = $${paramCount++}`;
      params.push(customerId);
    }

    // For supervisors, only show their own trips
    if (req.user.role === 'supervisor') {
      query += ` AND t.user_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single trip
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.*,
        u.display_name as created_by_name,
        c.name as customer_name,
        q.name as quarry_name,
        q.owner_name as vendor_name,
        ro.owner_name as royalty_owner_name,
        m.name as material_name,
        v.vehicle_number,
        v.driver_name,
        v.driver_mobile_number,
        to.name as transport_owner_name
      FROM trips t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN quarries q ON t.quarry_id = q.id
      LEFT JOIN royalty_owners ro ON t.royalty_owner_id = ro.id
      LEFT JOIN materials m ON t.material_id = m.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN transport_owners to ON v.transport_owner_id = to.id
      WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create trip
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      date,
      place,
      customer_id,
      invoice_dc_number,
      quarry_id,
      royalty_owner_id,
      material_id,
      vehicle_id,
      transporter_name,
      transport_owner_mobile_number,
      empty_weight,
      gross_weight,
      net_weight,
      royalty_number,
      royalty_tons,
      royalty_m3,
      deduction_percentage,
      size_change_percentage,
    } = req.body;

    // Calculate financials based on rates
    // This is a simplified version - you may want to fetch actual rates
    const tonnage = net_weight || 0;
    
    // Insert trip
    const result = await pool.query(
      `INSERT INTO trips (
        user_id, date, place, customer_id, invoice_dc_number, quarry_id, royalty_owner_id,
        material_id, vehicle_id, transporter_name, transport_owner_mobile_number,
        empty_weight, gross_weight, net_weight, royalty_number, royalty_tons, royalty_m3,
        deduction_percentage, size_change_percentage, tonnage, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'pending upload')
      RETURNING *`,
      [
        req.user.id, date, place, customer_id, invoice_dc_number, quarry_id, royalty_owner_id,
        material_id, vehicle_id, transporter_name, transport_owner_mobile_number,
        empty_weight, gross_weight, net_weight, royalty_number, royalty_tons, royalty_m3,
        deduction_percentage || 0, size_change_percentage || 0, tonnage
      ]
    );

    // TODO: Calculate revenue, costs, profit based on rates
    // This would require fetching rate entries and calculating

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update trip
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tripId = req.params.id;
    const updateFields = req.body;

    // Build dynamic update query
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

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(tripId);

    const query = `UPDATE trips SET ${setClause.join(', ')} WHERE id = $${paramCount++} RETURNING *`;
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete trip
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM trips WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

