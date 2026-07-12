import express from 'express';
import { login, me, unlockUser } from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticateToken, me);
router.post('/unlock', authenticateToken, authorizeRoles('fleet_manager'), unlockUser);

export default router;
