const Report = require('../models/Report');
const Route = require('../models/Route');
const Alert = require('../models/Alert');
const { analyzeReportConflict, evaluateReportTrust } = require('../services/trustEngine');

/**
 * Submit passenger issue report.
 * Persists with default 'pending' status and performs conflict detection.
 * Preserves original report timestamp and source.
 */
const createReport = async (req, res, next) => {
  try {
    const { routeCode, stationName, category, description, passengerContact } = req.body;

    // Look up route name for display purposes
    let routeName = 'BRT Network';
    let routeDoc = null;
    if (routeCode && routeCode !== 'ALL') {
      routeDoc = await Route.findOne({ routeCode: routeCode.toUpperCase() });
      if (routeDoc) {
        routeName = routeDoc.name;
      }
    }

    // Fetch recent reports and active alerts for conflict analysis
    const recentReports = await Report.find({
      routeCode: routeCode.toUpperCase(),
      createdAt: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }
    });

    const activeAlerts = await Alert.find({
      $or: [{ routeCode: routeCode.toUpperCase() }, { routeCode: 'ALL' }],
      status: { $in: ['active', 'published'] }
    });

    // Run conflict detection — never silently picks one side as correct
    const conflictAnalysis = analyzeReportConflict(
      { routeCode: routeCode.toUpperCase(), stationName, category, description },
      recentReports,
      activeAlerts
    );

    const newReport = new Report({
      route: routeDoc ? routeDoc._id : undefined,
      routeCode: routeCode.toUpperCase(),
      routeName,
      stationName,
      category,
      description,
      passengerContact: passengerContact || '',
      moderationStatus: conflictAnalysis.isConflict ? 'conflict_flagged' : 'pending',
      isConflict: conflictAnalysis.isConflict,
      conflictReason: conflictAnalysis.reason
    });

    await newReport.save();

    // Attach trust evaluation to response
    const trust = evaluateReportTrust(newReport);

    return res.status(201).json({
      success: true,
      message: conflictAnalysis.isConflict
        ? 'Report submitted. Our Trust Engine detected differing reports for this area — an administrator has been flagged to verify.'
        : 'Report submitted. It will remain marked as "Passenger report — not verified" until reviewed by transport administrators.',
      data: {
        ...newReport.toPublicJSON(),
        trust
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public passenger reports with Trust Engine metadata.
 * Only exposes safe public fields — contact info is strictly excluded.
 * Excludes rejected reports from public feed.
 */
const getPublicReports = async (req, res, next) => {
  try {
    const { route, status, limit = 30 } = req.query;
    const filter = {};

    if (route) {
      filter.routeCode = route.toUpperCase();
    }

    if (status) {
      filter.moderationStatus = status;
    } else {
      // Show pending, verified, and conflict_flagged — not rejected
      filter.moderationStatus = { $in: ['pending', 'verified', 'conflict_flagged'] };
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    // Attach trust evaluation to each public report
    const publicReports = reports.map(r => ({
      ...r.toPublicJSON(),
      trust: evaluateReportTrust(r)
    }));

    return res.status(200).json({
      success: true,
      count: publicReports.length,
      data: publicReports
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getPublicReports
};
