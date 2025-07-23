import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get all jobs with filtering and pagination
router.get('/', authMiddleware, async (req, res) => {
  const { search, location, page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = 'SELECT * FROM jobs WHERE 1=1';
  const queryParams = [];

  if (search) {
    queryParams.push(`%${search}%`);
    query += ` AND (title ILIKE $${queryParams.length} OR company_name ILIKE $${queryParams.length})`;
  }

  if (location) {
    queryParams.push(`%${location}%`);
    query += ` AND location ILIKE $${queryParams.length}`;
  }

  queryParams.push(Number(limit));
  query += ` LIMIT $${queryParams.length}`;
  
  queryParams.push(offset);
  query += ` OFFSET $${queryParams.length}`;

  try {
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch jobs.' });
  }
});

export default router;
