import * as db from '../config/db.js';

export async function getTrips(req, res) {
  try {
    const result = await db.query(`
      SELECT t.*, v.registration_number as vehicle_reg, v.name_model as vehicle_name, d.name as driver_name 
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trips.' });
  }
}

export async function createTripDraft(req, res) {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = req.body;

  if (!source || !destination || !vehicle_id || !driver_id || !cargo_weight || !planned_distance) {
    return res.status(400).json({ error: 'All fields are required to draft a trip.' });
  }

  try {
    const vehicle = await db.query('SELECT max_load_capacity FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicle.rowCount === 0) return res.status(404).json({ error: 'Vehicle not found.' });
    
    if (parseFloat(cargo_weight) > parseFloat(vehicle.rows[0].max_load_capacity)) {
      return res.status(400).json({ error: `Cargo weight (${cargo_weight} kg) exceeds vehicle maximum capacity (${vehicle.rows[0].max_load_capacity} kg).` });
    }

    const result = await db.query(
      `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Draft') RETURNING *`,
      [source, destination, vehicle_id, driver_id, parseFloat(cargo_weight), parseFloat(planned_distance)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to draft trip.' });
  }
}

export async function dispatchTrip(req, res) {
  const { id } = req.params;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const tripRes = await client.query(
      "UPDATE trips SET status = 'Dispatched' WHERE id = $1 RETURNING *",
      [id]
    );

    if (tripRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const trip = tripRes.rows[0];

    await client.query("UPDATE vehicles SET status = 'On Trip' WHERE id = $1", [trip.vehicle_id]);
    await client.query("UPDATE drivers SET status = 'On Trip' WHERE id = $1", [trip.driver_id]);

    await client.query('COMMIT');
    res.json({ message: 'Trip dispatched successfully.', trip });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to dispatch trip.' });
  } finally {
    client.release();
  }
}

export async function completeTrip(req, res) {
  const { id } = req.params;
  const { actual_distance, fuel_consumed, final_odometer } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const trip = req.validatedTrip;

    await client.query(
      `UPDATE trips 
       SET status = 'Completed', actual_distance = $1, fuel_consumed = $2 
       WHERE id = $3`,
      [parseFloat(actual_distance), parseFloat(fuel_consumed), id]
    );

    await client.query(
      "UPDATE vehicles SET status = 'Available', odometer = $1 WHERE id = $2",
      [parseFloat(final_odometer), trip.vehicle_id]
    );
    await client.query(
      "UPDATE drivers SET status = 'Available' WHERE id = $1",
      [trip.driver_id]
    );

    if (parseFloat(fuel_consumed) > 0) {
      const fuelCost = parseFloat(fuel_consumed) * 98.00; 
      await client.query(
        `INSERT INTO fuel_logs (vehicle_id, liters, cost, log_date) 
         VALUES ($1, $2, $3, CURRENT_DATE)`,
        [trip.vehicle_id, parseFloat(fuel_consumed), fuelCost]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Trip completed successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to complete trip.' });
  } finally {
    client.release();
  }
}

export async function cancelTrip(req, res) {
  const { id } = req.params;
  const client = await db.getClient();

  try {
    const tripRes = await client.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripRes.rowCount === 0) return res.status(404).json({ error: 'Trip not found.' });
    const trip = tripRes.rows[0];

    await client.query('BEGIN');

    await client.query("UPDATE trips SET status = 'Cancelled' WHERE id = $1", [id]);

    if (trip.status === 'Dispatched') {
      await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [trip.vehicle_id]);
      await client.query("UPDATE drivers SET status = 'Available' WHERE id = $1", [trip.driver_id]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Trip cancelled successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to cancel trip.' });
  } finally {
    client.release();
  }
}
