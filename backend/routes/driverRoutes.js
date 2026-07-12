import express from 'express';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../controllers/driverController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateDriverRegistration } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getDrivers);
router.post('/', authenticateToken, authorizeRoles('fleet_manager', 'safety_officer'), validateDriverRegistration, createDriver);
router.put('/:id', authenticateToken, authorizeRoles('fleet_manager', 'safety_officer'), validateDriverRegistration, updateDriver);
router.delete('/:id', authenticateToken, authorizeRoles('fleet_manager', 'safety_officer'), deleteDriver);

export default router;
