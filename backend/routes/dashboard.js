import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    if (dateFrom) {
      dateFilter += ` AND date >= $${paramCount++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      dateFilter += ` AND date <= $${paramCount++}`;
      params.push(dateTo);
    }

    // For supervisors, only show their trips
    if (req.user.role === 'supervisor') {
      dateFilter += ` AND user_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_trips,
        COALESCE(SUM(revenue), 0) as total_revenue,
        COALESCE(SUM(material_cost + transport_cost + royalty_cost), 0) as total_cost,
        COALESCE(SUM(profit), 0) as total_profit,
        COALESCE(SUM(tonnage), 0) as total_tonnage
      FROM trips
      WHERE 1=1 ${dateFilter}
    `;

    const summaryResult = await pool.query(summaryQuery, params);
    const summary = summaryResult.rows[0];

    // Get trips by status
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM trips
      WHERE 1=1 ${dateFilter}
      GROUP BY status
    `;
    const statusResult = await pool.query(statusQuery, params);

    // Get delayed trips (in transit for more than 48 hours)
    const delayedQuery = `
      SELECT COUNT(*) as delayed_count
      FROM trips
      WHERE status = 'in transit'
      AND created_at < NOW() - INTERVAL '48 hours'
      ${req.user.role === 'supervisor' ? `AND user_id = $${paramCount}` : ''}
    `;
    const delayedParams = req.user.role === 'supervisor' ? [req.user.id] : [];
    const delayedResult = await pool.query(delayedQuery, delayedParams);

    res.json({
      ...summary,
      statusBreakdown: statusResult.rows,
      delayedTrips: parseInt(delayedResult.rows[0]?.delayed_count || 0),
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get profit by day chart data
router.get('/profit-by-day', authenticateToken, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    if (dateFrom) {
      dateFilter += ` AND date >= $${paramCount++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      dateFilter += ` AND date <= $${paramCount++}`;
      params.push(dateTo);
    }

    if (req.user.role === 'supervisor') {
      dateFilter += ` AND user_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    const query = `
      SELECT 
        date as name,
        COALESCE(SUM(profit), 0) as value
      FROM trips
      WHERE 1=1 ${dateFilter}
      GROUP BY date
      ORDER BY date
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching profit by day:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cost breakdown
router.get('/cost-breakdown', authenticateToken, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    if (dateFrom) {
      dateFilter += ` AND date >= $${paramCount++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      dateFilter += ` AND date <= $${paramCount++}`;
      params.push(dateTo);
    }

    if (req.user.role === 'supervisor') {
      dateFilter += ` AND user_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    const query = `
      SELECT 
        'Material' as name,
        COALESCE(SUM(material_cost), 0) as value
      FROM trips
      WHERE 1=1 ${dateFilter}
      UNION ALL
      SELECT 
        'Transport' as name,
        COALESCE(SUM(transport_cost), 0) as value
      FROM trips
      WHERE 1=1 ${dateFilter}
      UNION ALL
      SELECT 
        'Royalty' as name,
        COALESCE(SUM(royalty_cost), 0) as value
      FROM trips
      WHERE 1=1 ${dateFilter}
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cost breakdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

