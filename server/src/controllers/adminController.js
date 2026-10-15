const Report = require('../models/Report');
const Alert = require('../models/Alert');
const Route = require('../models/Route');
const { evaluateAlertFreshness, evaluateReportTrust } = require('../services/trustEngine');

/**
 * Overview statistics for Admin Dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      pendingCount,
      conflictCount,
      verifiedCount,
      rejectedCount,
      totalReports,
      activeAlertsCount,
      routesCount
    ] = await Promise.all([
      Report.countDocuments({ moderationStatus: 'pending' }),
      Report.countDocuments({ moderationStatus: 'conflict_flagged' }),
      Report.countDocuments({ moderationStatus: 'verified' }),
      Report.countDocuments({ moderationStatus: 'rejected' }),
      Report.countDocuments({}),
      Alert.countDocuments({ status: 'active' }),
      Route.countDocuments({ isActive: true })
    ]);

    // Check how many active alerts are currently stale
    const activeAlerts = await Alert.find({ status: 'active' });
    let staleCount = 0;
    activeAlerts.forEach(alert => {
      const freshness = evaluateAlertFreshness(alert);
      if (freshness.state === 'STALE') staleCount++;
    });

    return res.status(200).json({
      success: true,
      data: {
        pendingReports: pendingCount,
        conflictReports: conflictCount,
        verifiedReports: verifiedCount,
        rejectedReports: rejectedCount,
        totalReports,
        activeAlerts: activeAlertsCount,
        staleAlerts: staleCount,
        totalRoutes: routesCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reports with complete administrator details (including contact & internal notes)
 */
const getAdminReports = async (req, res, next) => {
  try {
    const { status, route, category, isConflict, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.moderationStatus = status;
    }

    if (route && route !== 'all') {
      filter.routeCode = route.toUpperCase();
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (isConflict === 'true') {
      filter.isConflict = true;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('reviewedBy', 'username fullName'),
      Report.countDocuments(filter)
    ]);

    // Attach trust evaluation to each report for admin dashboard display
    const reportsWithTrust = reports.map(r => ({
      ...r.toObject(),
      trust: evaluateReportTrust(r)
    }));

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: reportsWithTrust
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Review/Moderate passenger report (Verify, Reject, Flag Conflict, Pending)
 */
const reviewReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, moderationNotes } = req.body;

    const normalizedStatus = status === 'under_review' ? 'under review' : status;
    const allowedStatuses = ['pending', 'under review', 'under_review', 'verified', 'rejected', 'conflict_flagged'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid moderation status. Must be pending, under review, verified, rejected, or conflict_flagged.'
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.moderationStatus = normalizedStatus;
    if (moderationNotes !== undefined) {
      report.moderationNotes = moderationNotes;
    }
    // Always record who reviewed and when — audit trail
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    if (normalizedStatus === 'conflict_flagged') {
      report.isConflict = true;
    } else if (normalizedStatus === 'verified') {
      // Explicitly clear conflict flag if admin verifies it
      report.isConflict = false;
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report successfully updated to '${normalizedStatus}'`,
      data: {
        ...report.toObject(),
        trust: evaluateReportTrust(report)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Promote a passenger report to an official verified Alert
 */
const promoteReportToAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, severity = 'warning', freshnessHours = 4 } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Create new alert linked to report
    const newAlert = new Alert({
      title: title || `${report.category} at ${report.stationName}`,
      description: report.description,
      severity,
      route: report.route,
      routeCode: report.routeCode,
      routeName: report.routeName,
      stationName: report.stationName,
      source: `Admin Verified (Passenger Report #${report._id.toString().slice(-4)})`,
      sourceType: 'passenger_verified',
      verificationStatus: 'verified',
      status: 'active',
      publishedAt: new Date(),
      lastConfirmedAt: new Date(),
      freshnessHours: parseInt(freshnessHours, 10) || 4,
      originReportId: report._id,
      createdBy: req.user._id
    });

    await newAlert.save();

    // Mark report as verified
    report.moderationStatus = 'verified';
    report.moderationNotes = `Promoted to public service alert #${newAlert._id}`;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    return res.status(201).json({
      success: true,
      message: 'Report verified and promoted to public service announcement',
      data: {
        alert: newAlert,
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all alerts for Admin management
 */
const getAdminAlerts = async (req, res, next) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status && status !== 'all') {
      if (status === 'draft' || status === 'withdrawn') {
        filter.status = status;
      } else if (status === 'expired') {
        filter.$or = [
          { status: 'expired' },
          { expiresAt: { $lte: new Date() } }
        ];
      } else if (status === 'active' || status === 'published') {
        filter.status = { $in: ['active', 'published'] };
      }
    }

    const rawAlerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username fullName');

    let alerts = rawAlerts.map(alert => ({
      ...alert.toObject(),
      freshness: evaluateAlertFreshness(alert)
    }));

    // Post-filter for virtual/evaluated freshness states (e.g. STALE)
    if (status === 'stale') {
      alerts = alerts.filter(a => a.freshness?.state === 'STALE');
    } else if (status === 'active') {
      alerts = alerts.filter(a => a.freshness?.state !== 'EXPIRED' && a.freshness?.state !== 'WITHDRAWN');
    }

    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new service announcement
 */
const createAlert = async (req, res, next) => {
  try {
    const {
      title,
      description,
      message,
      severity = 'info',
      routeCode = 'ALL',
      stationName = 'Network-wide',
      source,
      sourceType = 'admin_verified',
      sourceDetails = '',
      status = 'published',
      freshnessHours = 4,
      expiresAt,
      isDemoData = false
    } = req.body;

    const alertDescription = description || message;
    if (!alertDescription) {
      return res.status(400).json({
        success: false,
        message: 'Alert message or description is required'
      });
    }

    let routeName = 'BRT Network';
    let routeDoc = null;
    if (routeCode && routeCode !== 'ALL') {
      routeDoc = await Route.findOne({ routeCode: routeCode.toUpperCase() });
      if (routeDoc) {
        routeName = routeDoc.name;
      }
    }

    const alert = new Alert({
      title,
      description: alertDescription,
      severity,
      route: routeDoc ? routeDoc._id : undefined,
      routeCode: routeCode.toUpperCase(),
      routeName,
      stationName,
      source,
      sourceType,
      sourceDetails,
      verificationStatus: 'verified',
      status: status === 'active' ? 'published' : status,
      publishedAt: new Date(),
      lastConfirmedAt: new Date(),
      freshnessHours: parseInt(freshnessHours, 10) || 4,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isDemoData: Boolean(isDemoData),
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await alert.save();

    return res.status(201).json({
      success: true,
      message: 'Service announcement created and published successfully',
      data: {
        ...alert.toObject(),
        freshness: evaluateAlertFreshness(alert)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Re-confirm alert freshness (Resets freshness window countdown)
 */
const reconfirmAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.lastConfirmedAt = new Date();
    alert.status = 'active'; // In case it was marked expired
    await alert.save();

    return res.status(200).json({
      success: true,
      message: 'Alert status re-confirmed. Freshness timer successfully refreshed.',
      data: {
        ...alert.toObject(),
        freshness: evaluateAlertFreshness(alert)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing service announcement
 */
const updateAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Apply allowed updates
    const allowedFields = [
      'title',
      'description',
      'message',
      'severity',
      'routeCode',
      'stationName',
      'source',
      'sourceDetails',
      'status',
      'freshnessHours',
      'expiresAt'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'message') {
          alert.description = updates[field];
        } else {
          alert[field] = updates[field];
        }
      }
    });

    if (updates.routeCode) {
      if (updates.routeCode === 'ALL') {
        alert.routeName = 'Entire BRT Network';
        alert.route = undefined;
      } else {
        const routeDoc = await Route.findOne({ routeCode: updates.routeCode.toUpperCase() });
        if (routeDoc) {
          alert.routeName = routeDoc.name;
          alert.route = routeDoc._id;
        }
      }
    }

    alert.updatedBy = req.user._id;

    if (updates.reconfirm) {
      alert.lastConfirmedAt = new Date();
    }

    await alert.save();

    return res.status(200).json({
      success: true,
      message: 'Alert updated successfully',
      data: {
        ...alert.toObject(),
        freshness: evaluateAlertFreshness(alert)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw/Deactivate an announcement safely
 */
const withdrawAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.status = 'withdrawn';
    // Store who withdrew and when for audit trail
    alert.updatedBy = req.user._id;
    alert.withdrawnAt = new Date();
    await alert.save();

    return res.status(200).json({
      success: true,
      message: 'Alert marked as withdrawn and removed from active public announcements',
      data: {
        ...alert.toObject(),
        freshness: evaluateAlertFreshness(alert)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAdminReports,
  reviewReport,
  promoteReportToAlert,
  getAdminAlerts,
  createAlert,
  updateAlert,
  reconfirmAlert,
  withdrawAlert
};
