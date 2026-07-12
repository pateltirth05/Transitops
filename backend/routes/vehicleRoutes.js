import express from 'express';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getVehicles);
router.post('/', authenticateToken, authorizeRoles('fleet_manager'), createVehicle);
router.put('/:id', authenticateToken, authorizeRoles('fleet_manager'), updateVehicle);
router.delete('/:id', authenticateToken, authorizeRoles('fleet_manager'), deleteVehicle);

export default router;
