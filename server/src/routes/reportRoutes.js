const express = require('express');
const router = express.Router();
const { createReport, getPublicReports } = require('../controllers/reportController');
const { reportValidationRules, validateRequest } = require('../middleware/validators');

router.get('/', getPublicReports);
router.post('/', reportValidationRules, validateRequest, createReport);

module.exports = router;
