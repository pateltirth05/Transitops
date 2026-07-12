import * as db from '../config/db.js';

export async function getMaintenanceLogs(req, res) {
  try {
    const result = await db.query(`
      SELECT m.*, v.registration_number as vehicle_reg, v.name_model as vehicle_name 
      FROM maintenance_logs m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch maintenance logs.' });
  }
}

export async function createMaintenanceLog(req, res) {
  const { vehicle_id, description, cost } = req.body;

  if (!vehicle_id || !description) {
    return res.status(400).json({ error: 'Vehicle ID and description are required.' });
  }

  const client = await db.getClient();
  try {
    const vehicleRes = await client.query('SELECT * FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    const vehicle = vehicleRes.rows[0];

    if (vehicle.status === 'Retired') {
      return res.status(400).json({ error: 'Retired vehicles cannot be put into maintenance.' });
    }

    await client.query('BEGIN');

    const logRes = await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, description, cost, status) 
       VALUES ($1, $2, $3, 'Active') RETURNING *`,
      [vehicle_id, description, parseFloat(cost || 0)]
    );

    await client.query(
      "UPDATE vehicles SET status = 'In Shop' WHERE id = $1",
      [vehicle_id]
    );

    await client.query('COMMIT');
    res.status(201).json(logRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create maintenance log.' });
  } finally {
    client.release();
  }
}

export async function closeMaintenance(req, res) {
  const { id } = req.params;
  const { cost } = req.body;
  const client = await db.getClient();

  try {
    const logRes = await client.query('SELECT * FROM maintenance_logs WHERE id = $1', [id]);
    if (logRes.rowCount === 0) return res.status(404).json({ error: 'Maintenance log not found.' });
    const log = logRes.rows[0];

    if (log.status === 'Completed') {
      return res.status(400).json({ error: 'Maintenance is already completed.' });
    }

    const vehicleRes = await client.query('SELECT * FROM vehicles WHERE id = $1', [log.vehicle_id]);
    const vehicle = vehicleRes.rows[0];

    await client.query('BEGIN');

    await client.query(
      "UPDATE maintenance_logs SET status = 'Completed', cost = $1, completed_at = CURRENT_DATE WHERE id = $2",
      [parseFloat(cost || log.cost), id]
    );

    if (vehicle.status !== 'Retired') {
      await client.query(
        "UPDATE vehicles SET status = 'Available' WHERE id = $1",
        [log.vehicle_id]
      );
    }

    await client.query(
      `INSERT INTO expenses (vehicle_id, type, amount, date, description) 
       VALUES ($1, 'Maintenance', $2, CURRENT_DATE, $3)`,
      [log.vehicle_id, parseFloat(cost || log.cost), `Maintenance Closed: ${log.description}`]
    );

    await client.query('COMMIT');
    res.json({ message: 'Maintenance completed and vehicle restored to Available.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to close maintenance.' });
  } finally {
    client.release();
  }
}
