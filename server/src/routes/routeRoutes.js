const express = require('express');
const router = express.Router();
const { getRoutes, getRouteByCode, getStations } = require('../controllers/routeController');

router.get('/', getRoutes);
router.get('/stations', getStations);
router.get('/:code', getRouteByCode);

module.exports = router;
