import { Router } from 'express';
import pool from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Create a new user profile
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { firstName, lastName, email } = req.body;
  const firebase_uid = req.user?.uid;

  if (!firebase_uid) {
    return res.status(400).json({ error: 'Firebase UID is missing.' });
  }

  try {
    const newUser = await pool.query(
      'INSERT INTO users (firebase_uid, first_name, last_name, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [firebase_uid, firstName, lastName, email]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user profile.' });
  }
});

// Get a user's profile
router.get('/:firebase_uid', authMiddleware, async (req: AuthRequest, res) => {
  const { firebase_uid } = req.params;

  if (req.user?.uid !== firebase_uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const user = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// Update a user's profile
router.put('/:firebase_uid', authMiddleware, async (req: AuthRequest, res) => {
  const { firebase_uid } = req.params;
  const { firstName, lastName, phoneNumber, location, headline, summary, masterResume } = req.body;

  if (req.user?.uid !== firebase_uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const updatedUser = await pool.query(
      `UPDATE users SET 
        first_name = $1, 
        last_name = $2, 
        phone_number = $3, 
        location = $4, 
        headline = $5, 
        summary = $6, 
        master_resume = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = $8 RETURNING *`,
      [firstName, lastName, phoneNumber, location, headline, summary, masterResume, firebase_uid]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

export default router;
