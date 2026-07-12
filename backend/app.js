import express from 'express';
import cors from 'cors';

// Import Route modules
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';

const app = express();

// Configure global middlewares
app.use(cors());
app.use(express.json());

// Map modular endpoints
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api', expenseRoutes); //covers fuel-logs, expenses, stats, analytics reports

export default app;
