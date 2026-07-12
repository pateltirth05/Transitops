import * as db from '../config/db.js';

// Indian Driving License Format check: e.g. MH-1220190123456
export function isValidIndianLicense(license) {
  const cleanLicense = license.toUpperCase().replace(/\s+/g, '');
  const pattern = /^[A-Z]{2}-\d{2}\d{4}\d{7}$|^[A-Z]{2}\d{13}$/;
  return pattern.test(cleanLicense);
}

// Indian Mobile check: e.g. +91 9876543210
export function isValidIndianMobile(mobile) {
  const cleanMobile = mobile.replace(/\s+/g, '');
  const pattern = /^(?:\+91|0)?[6-9]\d{9}$/;
  return pattern.test(cleanMobile);
}

// Driver Registration Validation Middleware
export async function validateDriverRegistration(req, res, next) {
  const { name, license_number, license_expiry_date, contact_number } = req.body;

  if (!name || !license_number || !license_expiry_date || !contact_number) {
    return res.status(400).json({ error: 'Name, license number, license expiry date, and contact number are required.' });
  }

  if (!isValidIndianLicense(license_number)) {
    return res.status(400).json({ 
      error: 'Invalid Indian Driving License format. Must be alphanumeric in format SS-RRYYYYYNNNNNNN (e.g. MH-1220190123456).' 
    });
  }

  if (!isValidIndianMobile(contact_number)) {
    return res.status(400).json({ 
      error: 'Invalid Indian Mobile Number. Must be a valid 10-digit number optionally prefixed with +91.' 
    });
  }

  next();
}

// Trip Creation Validation Middleware
export async function validateTripCreation(req, res, next) {
  const { id } = req.params;

  try {
    const tripQuery = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripQuery.rowCount === 0) {
      return res.status(404).json({ error: 'Trip draft not found.' });
    }
    const trip = tripQuery.rows[0];
    const { vehicle_id, driver_id, cargo_weight, planned_distance } = trip;

    if (!vehicle_id || !driver_id || !cargo_weight || !planned_distance) {
      return res.status(400).json({ error: 'Trip draft has missing parameters.' });
    }

    // 1. Fetch vehicle details
    const vehicleRes = await db.query('SELECT * FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehicleRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    const vehicle = vehicleRes.rows[0];

    // 2. Fetch driver details
    const driverRes = await db.query('SELECT * FROM drivers WHERE id = $1', [driver_id]);
    if (driverRes.rowCount === 0) {
      return res.status(404).json({ error: 'Driver not found in db.' });
    }
    const driver = driverRes.rows[0];

    // 3. Business Rule Checks
    if (vehicle.status === 'Retired') {
      return res.status(400).json({ error: `Vehicle ${vehicle.registration_number} is Retired and cannot be dispatched.` });
    }
    if (vehicle.status === 'In Shop') {
      return res.status(400).json({ error: `Vehicle ${vehicle.registration_number} is In Shop (Maintenance) and cannot be dispatched.` });
    }
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ error: `Vehicle ${vehicle.registration_number} is currently On Trip and cannot be assigned.` });
    }
    if (driver.status === 'Suspended') {
      return res.status(400).json({ error: `Driver ${driver.name} is Suspended and cannot be assigned to trips.` });
    }
    if (driver.status === 'Off Duty') {
      return res.status(400).json({ error: `Driver ${driver.name} is currently Off Duty.` });
    }

    const expiryDate = new Date(driver.license_expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    if (expiryDate < today) {
      return res.status(400).json({ error: `Driver ${driver.name} has an expired driving license (Expired on ${driver.license_expiry_date.toISOString().split('T')[0]}).` });
    }

    if (driver.status === 'On Trip') {
      return res.status(400).json({ error: `Driver ${driver.name} is already On Trip and cannot be assigned.` });
    }

    if (parseFloat(cargo_weight) > parseFloat(vehicle.max_load_capacity)) {
      return res.status(400).json({ 
        error: `Cargo weight (${cargo_weight} kg) exceeds vehicle's maximum load capacity (${vehicle.max_load_capacity} kg) for ${vehicle.registration_number}.` 
      });
    }

    req.validatedVehicle = vehicle;
    req.validatedDriver = driver;
    
    next();
  } catch (err) {
    console.error('Error in validateTripCreation middleware:', err);
    res.status(500).json({ error: 'Database validation error.' });
  }
}

// Trip Completion Validation Middleware
export async function validateTripCompletion(req, res, next) {
  const { id } = req.params;
  const { actual_distance, fuel_consumed, final_odometer } = req.body;

  if (actual_distance === undefined || fuel_consumed === undefined || final_odometer === undefined) {
    return res.status(400).json({ error: 'actual_distance, fuel_consumed, and final_odometer are required.' });
  }

  try {
    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripRes.rowCount === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
    const trip = tripRes.rows[0];

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ error: 'Only Dispatched trips can be marked as Completed.' });
    }

    const vehicleRes = await db.query('SELECT * FROM vehicles WHERE id = $1', [trip.vehicle_id]);
    if (vehicleRes.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle associated with trip not found.' });
    }
    const vehicle = vehicleRes.rows[0];

    // Odometer validation
    if (parseFloat(final_odometer) < parseFloat(vehicle.odometer)) {
      return res.status(400).json({ 
        error: `Final odometer (${final_odometer} km) cannot be less than vehicle's current odometer (${vehicle.odometer} km).` 
      });
    }

    req.validatedTrip = trip;
    req.validatedVehicle = vehicle;
    next();
  } catch (err) {
    console.error('Error in validateTripCompletion middleware:', err);
    res.status(500).json({ error: 'Database validation error.' });
  }
}
