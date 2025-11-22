import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get daily expenses for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { dateFrom, dateTo, toAccount } = req.query;
    let query = `
      SELECT * FROM daily_expenses 
      WHERE user_id = $1
    `;
    const params = [req.user.id];
    let paramCount = 2;

    if (dateFrom) {
      query += ` AND date >= $${paramCount++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND date <= $${paramCount++}`;
      params.push(dateTo);
    }
    if (toAccount) {
      query += ` AND to_account ILIKE $${paramCount++}`;
      params.push(`%${toAccount}%`);
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get opening balance for user
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT opening_balance FROM supervisor_balances WHERE user_id = $1',
      [req.user.id]
    );

    const openingBalance = result.rows.length > 0 ? parseFloat(result.rows[0].opening_balance) : 0;

    // Get latest closing balance from expenses
    const latestExpense = await pool.query(
      `SELECT closing_balance FROM daily_expenses 
       WHERE user_id = $1 
       ORDER BY date DESC, created_at DESC 
       LIMIT 1`,
      [req.user.id]
    );

    const availableBalance = latestExpense.rows.length > 0
      ? parseFloat(latestExpense.rows[0].closing_balance)
      : openingBalance;

    res.json({ openingBalance, availableBalance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add daily expense
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      date,
      from_account,
      to_account,
      amount,
      transaction_type,
      remarks,
      company_expense_type,
    } = req.body;

    // Get current balance
    const balanceResult = await pool.query(
      `SELECT opening_balance FROM supervisor_balances WHERE user_id = $1`,
      [req.user.id]
    );

    let openingBalance = 0;
    if (balanceResult.rows.length === 0) {
      // Create balance record if it doesn't exist
      await pool.query(
        'INSERT INTO supervisor_balances (user_id, opening_balance) VALUES ($1, $2)',
        [req.user.id, 0]
      );
    } else {
      openingBalance = parseFloat(balanceResult.rows[0].opening_balance);
    }

    // Get latest closing balance
    const latestExpense = await pool.query(
      `SELECT closing_balance FROM daily_expenses 
       WHERE user_id = $1 
       ORDER BY date DESC, created_at DESC 
       LIMIT 1`,
      [req.user.id]
    );

    const availableBalance = latestExpense.rows.length > 0
      ? parseFloat(latestExpense.rows[0].closing_balance)
      : openingBalance;

    // Calculate closing balance
    let closingBalance;
    if (transaction_type === 'OPENING_BALANCE') {
      closingBalance = parseFloat(amount);
      // Update opening balance
      await pool.query(
        'UPDATE supervisor_balances SET opening_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [closingBalance, req.user.id]
      );
    } else if (transaction_type === 'CREDIT') {
      closingBalance = availableBalance + parseFloat(amount);
    } else {
      closingBalance = availableBalance - parseFloat(amount);
    }

    const result = await pool.query(
      `INSERT INTO daily_expenses (
        user_id, date, from_account, to_account, amount, transaction_type,
        available_balance, closing_balance, remarks, company_expense_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.user.id, date, from_account, to_account, parseFloat(amount),
        transaction_type, availableBalance, closingBalance, remarks, company_expense_type
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update expense
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const expenseId = req.params.id;
    const updateFields = req.body;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT user_id FROM daily_expenses WHERE id = $1',
      [expenseId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Recalculate balances if amount or type changed
    if (updateFields.amount || updateFields.transaction_type) {
      // Recalculate all subsequent expenses
      // This is a simplified version - you may want to optimize
      const allExpenses = await pool.query(
        `SELECT * FROM daily_expenses 
         WHERE user_id = $1 
         ORDER BY date ASC, created_at ASC`,
        [req.user.id]
      );

      const balanceResult = await pool.query(
        'SELECT opening_balance FROM supervisor_balances WHERE user_id = $1',
        [req.user.id]
      );
      const openingBalance = balanceResult.rows.length > 0
        ? parseFloat(balanceResult.rows[0].opening_balance)
        : 0;

      let runningBalance = openingBalance;

      for (const expense of allExpenses) {
        if (expense.id === expenseId) {
          // Update this expense
          const amountChange = updateFields.transaction_type === 'CREDIT'
            ? parseFloat(updateFields.amount || expense.amount)
            : -parseFloat(updateFields.amount || expense.amount);
          runningBalance += amountChange;
          expense.available_balance = runningBalance - amountChange;
          expense.closing_balance = runningBalance;
        } else {
          const amountChange = expense.transaction_type === 'CREDIT'
            ? parseFloat(expense.amount)
            : -parseFloat(expense.amount);
          expense.available_balance = runningBalance;
          runningBalance += amountChange;
          expense.closing_balance = runningBalance;
        }
      }

      // Update all expenses
      for (const expense of allExpenses) {
        await pool.query(
          'UPDATE daily_expenses SET available_balance = $1, closing_balance = $2 WHERE id = $3',
          [expense.available_balance, expense.closing_balance, expense.id]
        );
      }
    }

    // Update other fields
    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateFields).forEach((key) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'available_balance' && key !== 'closing_balance') {
        setClause.push(`${key} = $${paramCount++}`);
        values.push(updateFields[key]);
      }
    });

    if (setClause.length > 0) {
      setClause.push('updated_at = CURRENT_TIMESTAMP');
      values.push(expenseId);
      const query = `UPDATE daily_expenses SET ${setClause.join(', ')} WHERE id = $${paramCount++}`;
      await pool.query(query, values);
    }

    const result = await pool.query('SELECT * FROM daily_expenses WHERE id = $1', [expenseId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const checkResult = await pool.query(
      'SELECT user_id FROM daily_expenses WHERE id = $1',
      [req.params.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM daily_expenses WHERE id = $1', [req.params.id]);

    // Recalculate balances for remaining expenses
    const allExpenses = await pool.query(
      `SELECT * FROM daily_expenses 
       WHERE user_id = $1 
       ORDER BY date ASC, created_at ASC`,
      [req.user.id]
    );

    const balanceResult = await pool.query(
      'SELECT opening_balance FROM supervisor_balances WHERE user_id = $1',
      [req.user.id]
    );
    const openingBalance = balanceResult.rows.length > 0
      ? parseFloat(balanceResult.rows[0].opening_balance)
      : 0;

    let runningBalance = openingBalance;

    for (const expense of allExpenses) {
      const amountChange = expense.transaction_type === 'CREDIT'
        ? parseFloat(expense.amount)
        : -parseFloat(expense.amount);
      expense.available_balance = runningBalance;
      runningBalance += amountChange;
      expense.closing_balance = runningBalance;

      await pool.query(
        'UPDATE daily_expenses SET available_balance = $1, closing_balance = $2 WHERE id = $3',
        [expense.available_balance, expense.closing_balance, expense.id]
      );
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

