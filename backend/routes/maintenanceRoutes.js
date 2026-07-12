import express from 'express';
import { getMaintenanceLogs, createMaintenanceLog, closeMaintenance } from '../controllers/maintenanceController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getMaintenanceLogs);
router.post('/', authenticateToken, authorizeRoles('fleet_manager'), createMaintenanceLog);
router.post('/:id/close', authenticateToken, authorizeRoles('fleet_manager'), closeMaintenance);

export default router;
