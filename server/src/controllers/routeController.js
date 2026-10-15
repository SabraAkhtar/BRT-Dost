const Route = require('../models/Route');
const Station = require('../models/Station');
const Alert = require('../models/Alert');
const Report = require('../models/Report');
const { evaluateRouteStatus, evaluateAlertFreshness } = require('../services/trustEngine');

/**
 * Get all BRT routes with evaluated Trust Engine status
 */
const getRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find({ isActive: true }).sort({ routeCode: 1 });
    
    // Fetch active alerts and pending reports to evaluate real-time trust status
    const allAlerts = await Alert.find({ status: { $in: ['published', 'active', 'expired'] } });
    const allReports = await Report.find({ moderationStatus: 'pending' });

    const routesWithStatus = routes.map(route => {
      const routeAlerts = allAlerts.filter(a => a.routeCode === route.routeCode || a.routeCode === 'ALL');
      const routeReports = allReports.filter(r => r.routeCode === route.routeCode);
      const trustStatus = evaluateRouteStatus(route, routeAlerts, routeReports);

      return {
        ...route.toObject(),
        trustStatus,
        stationCount: route.stations ? route.stations.length : 0
      };
    });

    return res.status(200).json({
      success: true,
      count: routesWithStatus.length,
      data: routesWithStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific route details by routeCode
 */
const getRouteByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const route = await Route.findOne({ routeCode: code.toUpperCase() });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route '${code}' not found in BRT network`
      });
    }

    // Get alerts for this route
    const rawAlerts = await Alert.find({
      $or: [{ routeCode: route.routeCode }, { routeCode: 'ALL' }],
      status: { $in: ['published', 'active', 'expired'] }
    }).sort({ lastConfirmedAt: -1 });

    const alerts = rawAlerts.map(alert => ({
      ...alert.toObject(),
      freshness: evaluateAlertFreshness(alert)
    }));

    // Get public unverified reports for this route
    const rawReports = await Report.find({
      routeCode: route.routeCode,
      moderationStatus: { $in: ['pending', 'verified'] }
    }).sort({ createdAt: -1 }).limit(20);

    const reports = rawReports.map(r => r.toPublicJSON());
    const pendingReports = rawReports.filter(r => r.moderationStatus === 'pending');
    const trustStatus = evaluateRouteStatus(route, rawAlerts, pendingReports);

    return res.status(200).json({
      success: true,
      data: {
        route,
        trustStatus,
        alerts,
        reports
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stations list with optional search query
 */
const getStations = async (req, res, next) => {
  try {
    const { q, route } = req.query;
    const query = { isActive: true };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { locationSummary: { $regex: q, $options: 'i' } }
      ];
    }

    if (route) {
      query.connectedRoutes = route.toUpperCase();
    }

    const stations = await Station.find(query).sort({ code: 1 });

    return res.status(200).json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoutes,
  getRouteByCode,
  getStations
};
