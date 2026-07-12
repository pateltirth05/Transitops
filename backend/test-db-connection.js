import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'transitops',
};

console.log('--- TransitOps DB Diagnostics ---');
console.log('Attempting to connect to PostgreSQL with credentials:');
console.log(`Host: ${config.host}`);
console.log(`Port: ${config.port}`);
console.log(`User: ${config.user}`);
console.log(`Password: ${config.password ? '**** (hidden)' : '(empty)'}`);
console.log(`Target Database: ${config.database}`);
console.log('---------------------------------');

const pool = new pg.Pool(config);

async function runDiagnostics() {
  try {
    const client = await pool.connect();
    console.log('SUCCESS: Connected to PostgreSQL server.');
    
    const dbNameRes = await client.query('SELECT current_database()');
    console.log(`SUCCESS: Active database name is: "${dbNameRes.rows[0].current_database}"`);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`SUCCESS: Found ${tablesRes.rowCount} tables in public schema:`);
    tablesRes.rows.forEach(row => {
      console.log(` - ${row.table_name}`);
    });

    client.release();
    console.log('\nResult: Connection check passed! Your database configuration is 100% correct.');
    process.exit(0);
  } catch (err) {
    console.error('\nERROR: Failed to connect to PostgreSQL database.');
    console.error(`Message: ${err.message}`);
    console.error(`Code: ${err.code || 'N/A'}`);
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure your local PostgreSQL service is running.');
    console.log('2. Verify that the password in backend/.env matches your pgAdmin credentials.');
    console.log('3. If you have not created the database yet, ensure the postgres user has rights to create databases, or create the "transitops" database manually in pgAdmin and run this check again.');
    process.exit(1);
  }
}

runDiagnostics();
