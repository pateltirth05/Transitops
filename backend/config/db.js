import pg from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection config
const config = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'tirth1025',
  database: process.env.PGDATABASE || 'transitops',
};

let pool;

export async function initializeDatabase() {
  const setupPool = new pg.Pool({
    ...config,
    database: 'postgres',
  });

  try {
    const res = await setupPool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [config.database]);
    if (res.rowCount === 0) {
      console.log(`Database '${config.database}' does not exist. Creating...`);
      await setupPool.query(`CREATE DATABASE ${config.database}`);
      console.log(`Database '${config.database}' created successfully.`);
    }
  } catch (err) {
    console.error('Error checking/creating database:', err.message);
  } finally {
    await setupPool.end();
  }

  pool = new pg.Pool(config);

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully.');

    console.log('Resetting and recreating tables with fresh Indian formatted schema...');
    await client.query(`
      DROP TABLE IF EXISTS app_settings CASCADE;
      DROP TABLE IF EXISTS expenses CASCADE;
      DROP TABLE IF EXISTS fuel_logs CASCADE;
      DROP TABLE IF EXISTS maintenance_logs CASCADE;
      DROP TABLE IF EXISTS trips CASCADE;
      DROP TABLE IF EXISTS drivers CASCADE;
      DROP TABLE IF EXISTS vehicles CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Schema is one folder up (backend/schema.sql)
    const sqlPath = path.join(__dirname, '..', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('Tables recreated successfully.');

    await seedData(client);

    client.release();
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }
}

async function seedData(client) {
  // 1. Seed Users
  console.log('Seeding user profiles...');
  const users = [
    { email: 'manager@transitops.com', role: 'fleet_manager' },
    { email: 'driver@transitops.com', role: 'driver' },
    { email: 'safety@transitops.com', role: 'safety_officer' },
    { email: 'finance@transitops.com', role: 'financial_analyst' }
  ];

  const passwordHash = bcrypt.hashSync('password123', 10);
  for (const u of users) {
    await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
      [u.email, passwordHash, u.role]
    );
  }

  // 2. Seed Vehicles with Region field and Indian acquisition costs
  console.log('Seeding Indian vehicles registry...');
  const vehicles = [
    { registration_number: 'MH-12-PQ-5020', name_model: 'Tata Prima 2825.K', type: 'Truck', max_load_capacity: 16000, odometer: 42000, acquisition_cost: 3800000, region: 'West', status: 'Available' },
    { registration_number: 'DL-01-AB-1234', name_model: 'Mahindra Bolero Pik-Up', type: 'Van', max_load_capacity: 1500, odometer: 18500, acquisition_cost: 950000, region: 'North', status: 'Available' },
    { registration_number: 'KA-03-MY-8844', name_model: 'Ashok Leyland Dost+', type: 'Van', max_load_capacity: 2000, odometer: 24000, acquisition_cost: 820000, region: 'South', status: 'Available' },
    { registration_number: 'GJ-01-XX-9900', name_model: 'Tata Winger Cargo', type: 'Van', max_load_capacity: 1200, odometer: 56000, acquisition_cost: 1100000, region: 'West', status: 'Available' },
    { registration_number: 'HR-55-AA-7722', name_model: 'BharatBenz 3523R', type: 'Semi-Trailer', max_load_capacity: 28000, odometer: 115000, acquisition_cost: 4500000, region: 'North', status: 'In Shop' },
    { registration_number: 'WB-02-TR-4567', name_model: 'Eicher Pro 2049', type: 'Truck', max_load_capacity: 3500, odometer: 9500, acquisition_cost: 1400000, region: 'East', status: 'Available' }
  ];

  for (const v of vehicles) {
    await client.query(
      `INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, region, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [v.registration_number, v.name_model, v.type, v.max_load_capacity, v.odometer, v.acquisition_cost, v.region, v.status]
    );
  }

  // 3. Seed Drivers with Indian Licenses and Mobile numbers (+91)
  console.log('Seeding compliance-checked drivers...');
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 25);
  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 45);

  const drivers = [
    { name: 'Rajesh Kumar', license_number: 'DL-0420210123456', license_category: 'Class A', license_expiry_date: nextYear, contact_number: '+91 9876543210', safety_score: 96.50, status: 'Available' },
    { name: 'Amit Sharma', license_number: 'MH-1220190987654', license_category: 'Class A', license_expiry_date: nextMonth, contact_number: '+91 8765432109', safety_score: 92.00, status: 'Available' },
    { name: 'Sanjay Patil', license_number: 'MH-1420180456123', license_category: 'Class B', license_expiry_date: expiredDate, contact_number: '+91 7654321098', safety_score: 88.00, status: 'Available' },
    { name: 'Vijay Singh', license_number: 'HR-2620201122334', license_category: 'Class A', license_expiry_date: nextYear, contact_number: '+91 9988776655', safety_score: 72.00, status: 'Suspended' },
    { name: 'Vikram Das', license_number: 'WB-0220220345678', license_category: 'Class C', license_expiry_date: nextYear, contact_number: '+91 9012345678', safety_score: 95.00, status: 'Available' }
  ];

  for (const d of drivers) {
    await client.query(
      `INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [d.name, d.license_number, d.license_category, d.license_expiry_date, d.contact_number, d.safety_score, d.status]
    );
  }

  // Seed App Settings
  console.log('Seeding default app settings...');
  await client.query(
    "INSERT INTO app_settings (depot_name, distance_unit, currency) VALUES ('Mumbai Central Depot', 'KM', 'INR')"
  );

  // Get Primary Key IDs to establish relationships
  const dbVehicles = await client.query('SELECT id, registration_number, odometer FROM vehicles');
  const dbDrivers = await client.query('SELECT id, name FROM drivers');

  const tataPrima = dbVehicles.rows.find(v => v.registration_number === 'MH-12-PQ-5020');
  const bolero = dbVehicles.rows.find(v => v.registration_number === 'DL-01-AB-1234');
  const dost = dbVehicles.rows.find(v => v.registration_number === 'KA-03-MY-8844');
  const bharatBenz = dbVehicles.rows.find(v => v.registration_number === 'HR-55-AA-7722');
  const winger = dbVehicles.rows.find(v => v.registration_number === 'GJ-01-XX-9900');

  const rajesh = dbDrivers.rows.find(d => d.name === 'Rajesh Kumar');
  const amit = dbDrivers.rows.find(d => d.name === 'Amit Sharma');
  const vikram = dbDrivers.rows.find(d => d.name === 'Vikram Das');

  // 4. Seed completed trips
  console.log('Seeding operational dispatches...');
  if (tataPrima && rajesh) {
    await client.query(
      `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, fuel_consumed, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['Mumbai', 'Pune', tataPrima.id, rajesh.id, 14500, 150, 152, 60, 'Completed']
    );
    await client.query(`INSERT INTO fuel_logs (vehicle_id, liters, cost, log_date) VALUES ($1, $2, $3, CURRENT_DATE - 10)`, [tataPrima.id, 60, 6000]);
  }

  if (bolero && amit) {
    await client.query(
      `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, fuel_consumed, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['Delhi', 'Gurugram', bolero.id, amit.id, 1200, 45, 47, 8, 'Completed']
    );
    await client.query(`INSERT INTO fuel_logs (vehicle_id, liters, cost, log_date) VALUES ($1, $2, $3, CURRENT_DATE - 8)`, [bolero.id, 8, 800]);
    await client.query(`INSERT INTO expenses (vehicle_id, type, amount, date, description) VALUES ($1, 'Toll', 350, CURRENT_DATE - 8, 'NH-8 toll plaza')`, [bolero.id]);
  }

  if (dost && vikram) {
    await client.query(
      `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, fuel_consumed, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['Bengaluru', 'Mysuru', dost.id, vikram.id, 1800, 140, 140, 15, 'Completed']
    );
    await client.query(`INSERT INTO fuel_logs (vehicle_id, liters, cost, log_date) VALUES ($1, $2, $3, CURRENT_DATE - 5)`, [dost.id, 15, 1500]);
  }

  // 5. Seed Maintenance log history
  console.log('Seeding repair history...');
  if (bharatBenz) {
    await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, description, cost, status, created_at) 
       VALUES ($1, 'Brake shoe replacement and hub greasing', 24000, 'Active', CURRENT_DATE - 1)`,
      [bharatBenz.id]
    );
  }

  if (winger) {
    await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, description, cost, status, created_at, completed_at) 
       VALUES ($1, 'Minor scratch dent painting and oil change', 12000, 'Completed', CURRENT_DATE - 20, CURRENT_DATE - 19)`,
      [winger.id]
    );
    await client.query(
      `INSERT INTO expenses (vehicle_id, type, amount, date, description) 
       VALUES ($1, 'Maintenance', 12000, CURRENT_DATE - 19, 'Closed maintenance: Scratch painting')`,
      [winger.id]
    );
  }

  console.log('Seeding completed! All systems ready.');
}

export function query(text, params) {
  return pool.query(text, params);
}

export async function getClient() {
  return await pool.connect();
}
