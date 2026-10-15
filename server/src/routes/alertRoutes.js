const express = require('express');
const router = express.Router();
const { getPublicAlerts, getAlertById } = require('../controllers/alertController');

router.get('/', getPublicAlerts);
router.get('/:id', getAlertById);

module.exports = router;
