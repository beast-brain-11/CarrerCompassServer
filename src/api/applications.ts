import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all applications for a user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.uid;

  try {
    const result = await pool.query(
      `SELECT a.*, j.title, j.company_name, j.location 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE a.user_id = (SELECT id FROM users WHERE firebase_uid = $1)`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// Create a new application
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.uid;
  const { jobId, status, appliedAt, notes } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO applications (user_id, job_id, status, applied_at, notes) VALUES ((SELECT id FROM users WHERE firebase_uid = $1), $2, $3, $4, $5) RETURNING *',
      [userId, jobId, status, appliedAt, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create application.' });
  }
});

// Update an application
router.put('/:appId', authMiddleware, async (req: AuthRequest, res) => {
  const { appId } = req.params;
  const { status, notes } = req.body;
  const userId = req.user?.uid;

  try {
    const result = await pool.query(
      'UPDATE applications SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = (SELECT id FROM users WHERE firebase_uid = $4) RETURNING *',
      [status, notes, appId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found or user not authorized.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update application.' });
  }
});

// Delete an application
router.delete('/:appId', authMiddleware, async (req: AuthRequest, res) => {
  const { appId } = req.params;
  const userId = req.user?.uid;

  try {
    const result = await pool.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = (SELECT id FROM users WHERE firebase_uid = $2) RETURNING *',
      [appId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found or user not authorized.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete application.' });
  }
});

export default router;
