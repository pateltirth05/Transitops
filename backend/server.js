import app from './app.js';
import { initializeDatabase } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize PostgreSQL database schemas 
await initializeDatabase();


app.listen(PORT, () => {
  console.log(`TransitOps API Server running on http://localhost:${PORT}`);
});
