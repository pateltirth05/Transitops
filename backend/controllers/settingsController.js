import * as db from '../config/db.js';

export async function getSettings(req, res) {
  try {
    const result = await db.query('SELECT * FROM app_settings ORDER BY id ASC LIMIT 1');
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Settings not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
}

export async function updateSettings(req, res) {
  const { depot_name, distance_unit, currency } = req.body;
  if (!depot_name || !distance_unit || !currency) {
    return res.status(400).json({ error: 'depot_name, distance_unit, and currency are required.' });
  }
  try {
    const result = await db.query(
      `UPDATE app_settings 
       SET depot_name = $1, distance_unit = $2, currency = $3 
       WHERE id = (SELECT id FROM app_settings ORDER BY id ASC LIMIT 1) 
       RETURNING *`,
      [depot_name, distance_unit, currency]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
}
