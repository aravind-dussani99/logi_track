import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ========== CUSTOMERS ==========
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/customers', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, contact_number, address, email, opening_balance, account_id } = req.body;
    const result = await pool.query(
      `INSERT INTO customers (name, contact_number, address, email, opening_balance, account_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, contact_number, address, email, opening_balance || 0, account_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== VEHICLES ==========
router.get('/vehicles', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, to.owner_name as transport_owner_name
      FROM vehicles v
      LEFT JOIN transport_owners to ON v.transport_owner_id = to.id
      ORDER BY v.vehicle_number
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicles', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { vehicle_number, vehicle_type, vehicle_capacity, driver_name, driver_mobile_number, transport_owner_id, rc_book_number } = req.body;
    const result = await pool.query(
      `INSERT INTO vehicles (vehicle_number, vehicle_type, vehicle_capacity, driver_name, driver_mobile_number, transport_owner_id, rc_book_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [vehicle_number, vehicle_type, vehicle_capacity, driver_name, driver_mobile_number, transport_owner_id, rc_book_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== QUARRIES ==========
router.get('/quarries', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quarries ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quarries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/quarries', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, location, owner_name, contact_number, address, quarry_area, opening_balance, account_id } = req.body;
    const result = await pool.query(
      `INSERT INTO quarries (name, location, owner_name, contact_number, address, quarry_area, opening_balance, account_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, location, owner_name, contact_number, address, quarry_area, opening_balance || 0, account_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating quarry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== ROYALTY OWNERS ==========
router.get('/royalty-owners', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM royalty_owners ORDER BY owner_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching royalty owners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/royalty-owners', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { owner_name, contact_number, address, quarry_area, opening_balance, account_id } = req.body;
    const result = await pool.query(
      `INSERT INTO royalty_owners (owner_name, contact_number, address, quarry_area, opening_balance, account_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [owner_name, contact_number, address, quarry_area, opening_balance || 0, account_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating royalty owner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== TRANSPORT OWNERS ==========
router.get('/transport-owners', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transport_owners ORDER BY owner_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transport owners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/transport-owners', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { owner_name, contact_number, address, opening_balance, account_id } = req.body;
    const result = await pool.query(
      `INSERT INTO transport_owners (owner_name, contact_number, address, opening_balance, account_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [owner_name, contact_number, address, opening_balance || 0, account_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transport owner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== MATERIALS ==========
router.get('/materials', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM materials ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/materials', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, unit, cost_per_ton, cost_per_cubic_meter } = req.body;
    const result = await pool.query(
      `INSERT INTO materials (name, unit, cost_per_ton, cost_per_cubic_meter)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, unit || 'ton', cost_per_ton, cost_per_cubic_meter]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== PLACES ==========
router.get('/places', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM places ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/places', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      `INSERT INTO places (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating place:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== ACCOUNTS ==========
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, ac.name as category_name
      FROM accounts a
      LEFT JOIN account_categories ac ON a.category_id = ac.id
      ORDER BY a.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/accounts', authenticateToken, requireRole('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { name, category_id } = req.body;
    const result = await pool.query(
      `INSERT INTO accounts (name, category_id) VALUES ($1, $2) RETURNING *`,
      [name, category_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== ACCOUNT CATEGORIES ==========
router.get('/account-categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM account_categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching account categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/account-categories', authenticateToken, requireRole('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      `INSERT INTO account_categories (name) VALUES ($1) RETURNING *`,
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating account category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== RATE ENTRIES ==========
router.get('/rates/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const result = await pool.query(
      `SELECT * FROM rate_entries 
       WHERE entity_type = $1 AND entity_id = $2 
       ORDER BY effective_from DESC`,
      [entityType, entityId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/rates', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const {
      entity_type, entity_id, from_site, material_type,
      rate_per_ton, rate_per_km, rate_per_m3,
      gst, gst_percentage, gst_amount, total_rate,
      effective_from, effective_to, active, remarks
    } = req.body;

    // If setting as active, deactivate other rates for this entity
    if (active === 'active') {
      await pool.query(
        `UPDATE rate_entries SET active = 'not active' 
         WHERE entity_type = $1 AND entity_id = $2`,
        [entity_type, entity_id]
      );
    }

    const result = await pool.query(
      `INSERT INTO rate_entries (
        entity_type, entity_id, from_site, material_type,
        rate_per_ton, rate_per_km, rate_per_m3,
        gst, gst_percentage, gst_amount, total_rate,
        effective_from, effective_to, active, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        entity_type, entity_id, from_site, material_type,
        rate_per_ton, rate_per_km, rate_per_m3,
        gst, gst_percentage, gst_amount, total_rate,
        effective_from, effective_to, active || 'not active', remarks
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating rate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

