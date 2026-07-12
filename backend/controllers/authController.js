import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as db from '../config/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyfortransitops';

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check lock status
    if (user.is_locked) {
      return res.status(401).json({ 
        error: 'Account locked due to 5 consecutive failed login attempts. Please contact your Fleet Manager to unlock.' 
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      let isLocked = user.is_locked;
      let errorMsg = `Invalid email or password. Attempt ${newAttempts} of 5.`;

      if (newAttempts >= 5) {
        isLocked = true;
        errorMsg = 'Account locked due to 5 consecutive failed login attempts. Please contact your Fleet Manager to unlock.';
      }

      await db.query('UPDATE users SET failed_attempts = $1, is_locked = $2 WHERE id = $3', [newAttempts, isLocked, user.id]);
      return res.status(401).json({ error: errorMsg });
    }

    // Reset failed attempts on success
    await db.query('UPDATE users SET failed_attempts = 0, is_locked = false WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}

export async function unlockUser(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email parameter required.' });

  try {
    const result = await db.query(
      "UPDATE users SET failed_attempts = 0, is_locked = false WHERE email = $1 RETURNING *",
      [email.toLowerCase().trim()]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json({ message: `Account for ${email} unlocked successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unlock user.' });
  }
}
