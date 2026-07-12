import * as db from '../config/db.js';

export async function getVehicles(req, res) {
  try {
    const result = await db.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles.' });
  }
}

export async function createVehicle(req, res) {
  const { registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, region, status } = req.body;

  if (!registration_number || !name_model || !type || !max_load_capacity || !region) {
    return res.status(400).json({ error: 'Registration number, model/name, type, region, and maximum load capacity are required.' });
  }

  try {
    const check = await db.query('SELECT id FROM vehicles WHERE registration_number = $1', [registration_number.toUpperCase().trim()]);
    if (check.rowCount > 0) {
      return res.status(400).json({ error: `A vehicle with registration number ${registration_number} already exists.` });
    }

    const result = await db.query(
      `INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, region, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        registration_number.toUpperCase().trim(),
        name_model,
        type,
        parseFloat(max_load_capacity),
        parseFloat(odometer || 0),
        parseFloat(acquisition_cost || 0),
        region,
        status || 'Available'
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vehicle.' });
  }
}

export async function updateVehicle(req, res) {
  const { id } = req.params;
  const { registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, region, status } = req.body;

  try {
    const check = await db.query('SELECT id FROM vehicles WHERE registration_number = $1 AND id != $2', [registration_number.toUpperCase().trim(), id]);
    if (check.rowCount > 0) {
      return res.status(400).json({ error: `Registration number ${registration_number} is already in use by another vehicle.` });
    }

    const result = await db.query(
      `UPDATE vehicles 
       SET registration_number = $1, name_model = $2, type = $3, max_load_capacity = $4, odometer = $5, acquisition_cost = $6, region = $7, status = $8 
       WHERE id = $9 RETURNING *`,
      [registration_number.toUpperCase().trim(), name_model, type, parseFloat(max_load_capacity), parseFloat(odometer), parseFloat(acquisition_cost), region, status, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vehicle.' });
  }
}

export async function deleteVehicle(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json({ message: 'Vehicle deleted successfully.', vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vehicle. It might be referenced by trips or logs.' });
  }
}
