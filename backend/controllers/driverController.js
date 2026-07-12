import * as db from '../config/db.js';

export async function getDrivers(req, res) {
  try {
    const result = await db.query('SELECT * FROM drivers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drivers.' });
  }
}

export async function createDriver(req, res) {
  const { name, license_number, license_category, license_expiry_date, contact_number, safety_score, status } = req.body;

  try {
    const check = await db.query('SELECT id FROM drivers WHERE license_number = $1', [license_number.toUpperCase().trim()]);
    if (check.rowCount > 0) {
      return res.status(400).json({ error: 'License number already registered.' });
    }

    const result = await db.query(
      `INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, license_number.toUpperCase().trim(), license_category, license_expiry_date, contact_number.trim(), parseFloat(safety_score || 100.0), status || 'Available']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create driver.' });
  }
}

export async function updateDriver(req, res) {
  const { id } = req.params;
  const { name, license_number, license_category, license_expiry_date, contact_number, safety_score, status } = req.body;

  try {
    const check = await db.query('SELECT id FROM drivers WHERE license_number = $1 AND id != $2', [license_number.toUpperCase().trim(), id]);
    if (check.rowCount > 0) {
      return res.status(400).json({ error: 'License number already in use by another driver.' });
    }

    const result = await db.query(
      `UPDATE drivers 
       SET name = $1, license_number = $2, license_category = $3, license_expiry_date = $4, contact_number = $5, safety_score = $6, status = $7 
       WHERE id = $8 RETURNING *`,
      [name, license_number.toUpperCase().trim(), license_category, license_expiry_date, contact_number.trim(), parseFloat(safety_score), status, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Driver not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update driver.' });
  }
}

export async function deleteDriver(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM drivers WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Driver not found.' });
    res.json({ message: 'Driver deleted successfully.', driver: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete driver. It might be referenced in trips.' });
  }
}
