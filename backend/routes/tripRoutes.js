import express from 'express';
import { getTrips, createTripDraft, dispatchTrip, completeTrip, cancelTrip } from '../controllers/tripController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateTripCreation, validateTripCompletion } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getTrips);
router.post('/', authenticateToken, authorizeRoles('fleet_manager', 'driver'), createTripDraft);
router.post('/:id/dispatch', authenticateToken, authorizeRoles('fleet_manager', 'driver'), validateTripCreation, dispatchTrip);
router.post('/:id/complete', authenticateToken, authorizeRoles('fleet_manager', 'driver'), validateTripCompletion, completeTrip);
router.post('/:id/cancel', authenticateToken, authorizeRoles('fleet_manager', 'driver'), cancelTrip);

export default router;
