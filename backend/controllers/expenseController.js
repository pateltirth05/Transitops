import * as db from '../config/db.js';

export async function getFuelLogs(req, res) {
  try {
    const result = await db.query(`
      SELECT f.*, v.registration_number as vehicle_reg, v.name_model as vehicle_name 
      FROM fuel_logs f
      LEFT JOIN vehicles v ON f.vehicle_id = v.id
      ORDER BY f.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fuel logs.' });
  }
}

export async function createFuelLog(req, res) {
  const { vehicle_id, liters, cost, log_date } = req.body;

  if (!vehicle_id || !liters || !cost) {
    return res.status(400).json({ error: 'Vehicle ID, liters, and cost are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO fuel_logs (vehicle_id, liters, cost, log_date) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [vehicle_id, parseFloat(liters), parseFloat(cost), log_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log fuel.' });
  }
}

export async function getExpenses(req, res) {
  try {
    const result = await db.query(`
      SELECT e.*, v.registration_number as vehicle_reg, v.name_model as vehicle_name 
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      ORDER BY e.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
}

export async function createExpense(req, res) {
  const { vehicle_id, type, amount, date, description } = req.body;

  if (!vehicle_id || !type || !amount) {
    return res.status(400).json({ error: 'Vehicle ID, type, and amount are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO expenses (vehicle_id, type, amount, date, description) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [vehicle_id, type, parseFloat(amount), date || new Date(), description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense.' });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const totalVehiclesRes = await db.query('SELECT COUNT(*) FROM vehicles');
    const activeVehiclesRes = await db.query("SELECT COUNT(*) FROM vehicles WHERE status = 'On Trip'");
    const availableVehiclesRes = await db.query("SELECT COUNT(*) FROM vehicles WHERE status = 'Available'");
    const inShopVehiclesRes = await db.query("SELECT COUNT(*) FROM vehicles WHERE status = 'In Shop'");
    
    const activeTripsRes = await db.query("SELECT COUNT(*) FROM trips WHERE status = 'Dispatched'");
    const pendingTripsRes = await db.query("SELECT COUNT(*) FROM trips WHERE status = 'Draft'");
    const driversOnDutyRes = await db.query("SELECT COUNT(*) FROM drivers WHERE status = 'On Trip'");
    const totalDriversRes = await db.query("SELECT COUNT(*) FROM drivers WHERE status != 'Suspended'");

    const totalV = parseInt(totalVehiclesRes.rows[0].count) || 0;
    const activeV = parseInt(activeVehiclesRes.rows[0].count) || 0;
    
    const fleetUtilization = totalV > 0 ? Math.round((activeV / totalV) * 100) : 0;

    res.json({
      totalVehicles: totalV,
      activeVehicles: activeV,
      availableVehicles: parseInt(availableVehiclesRes.rows[0].count) || 0,
      vehiclesInMaintenance: parseInt(inShopVehiclesRes.rows[0].count) || 0,
      activeTrips: parseInt(activeTripsRes.rows[0].count) || 0,
      pendingTrips: parseInt(pendingTripsRes.rows[0].count) || 0,
      driversOnDuty: parseInt(driversOnDutyRes.rows[0].count) || 0,
      totalDrivers: parseInt(totalDriversRes.rows[0].count) || 0,
      fleetUtilization: fleetUtilization
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
}

export async function getAnalyticsReports(req, res) {
  try {
    const vehiclesRes = await db.query('SELECT * FROM vehicles');
    const vehicles = vehiclesRes.rows;

    const reportData = [];

    for (const v of vehicles) {
      const tripsRes = await db.query(
        "SELECT SUM(actual_distance) as total_distance, SUM(fuel_consumed) as total_fuel, COUNT(*) as trip_count FROM trips WHERE vehicle_id = $1 AND status = 'Completed'",
        [v.id]
      );
      
      const totalDistance = parseFloat(tripsRes.rows[0].total_distance) || 0;
      const totalFuel = parseFloat(tripsRes.rows[0].total_fuel) || 0;
      const tripCount = parseInt(tripsRes.rows[0].trip_count) || 0;

      const fuelEfficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(2) : 'N/A';

      const fuelCostRes = await db.query('SELECT SUM(cost) as sum FROM fuel_logs WHERE vehicle_id = $1', [v.id]);
      const maintenanceCostRes = await db.query('SELECT SUM(cost) as sum FROM maintenance_logs WHERE vehicle_id = $1 AND status = \'Completed\'', [v.id]);
      const expensesCostRes = await db.query('SELECT SUM(amount) as sum FROM expenses WHERE vehicle_id = $1', [v.id]);

      const fuelCost = parseFloat(fuelCostRes.rows[0].sum) || 0;
      const maintenanceCost = parseFloat(maintenanceCostRes.rows[0].sum) || 0;
      const expensesCost = parseFloat(expensesCostRes.rows[0].sum) || 0;

      const totalOperationalCost = fuelCost + maintenanceCost + expensesCost;

      const completedTripsRes = await db.query(
        "SELECT actual_distance, cargo_weight FROM trips WHERE vehicle_id = $1 AND status = 'Completed'",
        [v.id]
      );

      let revenue = 0;
      for (const trip of completedTripsRes.rows) {
        const dist = parseFloat(trip.actual_distance) || 0;
        const weight = parseFloat(trip.cargo_weight) || 0;
        revenue += (dist * 18.0) + (weight * 1.5); 
      }

      const acqCost = parseFloat(v.acquisition_cost) || 1; 
      const roi = acqCost > 0 ? (((revenue - totalOperationalCost) / acqCost) * 100).toFixed(2) : '0.00';

      reportData.push({
        id: v.id,
        registration_number: v.registration_number,
        name_model: v.name_model,
        type: v.type,
        acquisition_cost: acqCost,
        status: v.status,
        region: v.region,
        trip_count: tripCount,
        total_distance: totalDistance.toFixed(1),
        fuel_efficiency: fuelEfficiency,
        fuel_cost: fuelCost.toFixed(2),
        maintenance_cost: maintenanceCost.toFixed(2),
        expenses_cost: expensesCost.toFixed(2),
        operational_cost: totalOperationalCost.toFixed(2),
        simulated_revenue: revenue.toFixed(2),
        roi: roi
      });
    }

    res.json(reportData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate analytics reports.' });
  }
}
