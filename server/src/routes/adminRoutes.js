const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAdminReports,
  reviewReport,
  promoteReportToAlert,
  getAdminAlerts,
  createAlert,
  updateAlert,
  reconfirmAlert,
  withdrawAlert
} = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { alertValidationRules, validateRequest } = require('../middleware/validators');

// Protect all admin endpoints
router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/dashboard', getDashboardStats);

// Report Moderation
router.get('/reports', getAdminReports);
router.patch('/reports/:id/review', reviewReport);
router.post('/reports/:id/promote', promoteReportToAlert);

// Service Alerts Management
router.get('/alerts', getAdminAlerts);
router.post('/alerts', alertValidationRules, validateRequest, createAlert);
router.patch('/alerts/:id', updateAlert);
router.post('/alerts/:id/reconfirm', reconfirmAlert);
router.post('/alerts/:id/withdraw', withdrawAlert);
router.patch('/alerts/:id/withdraw', withdrawAlert);

module.exports = router;
