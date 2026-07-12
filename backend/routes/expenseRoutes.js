import express from 'express';
import { 
  getFuelLogs, 
  createFuelLog, 
  getExpenses, 
  createExpense,
  getDashboardStats,
  getAnalyticsReports
} from '../controllers/expenseController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/fuel-logs', authenticateToken, getFuelLogs);
router.post('/fuel-logs', authenticateToken, authorizeRoles('fleet_manager', 'financial_analyst'), createFuelLog);

router.get('/expenses', authenticateToken, getExpenses);
router.post('/expenses', authenticateToken, authorizeRoles('fleet_manager', 'financial_analyst'), createExpense);

router.get('/dashboard/stats', authenticateToken, getDashboardStats);
router.get('/reports/analytics', authenticateToken, getAnalyticsReports);

export default router;
