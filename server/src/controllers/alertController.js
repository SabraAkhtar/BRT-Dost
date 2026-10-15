const Alert = require('../models/Alert');
const { evaluateAlertFreshness } = require('../services/trustEngine');

/**
 * Auto-marks an alert as 'expired' in the DB if its expiresAt has passed.
 * Called at query time — no background worker needed for MVP.
 * Returns the (possibly updated) alert document.
 */
async function maybeAutoExpire(alert) {
  if (
    alert.status !== 'expired' &&
    alert.status !== 'withdrawn' &&
    alert.expiresAt &&
    Date.now() > new Date(alert.expiresAt).getTime()
  ) {
    alert.status = 'expired';
    await alert.save();
  }
  return alert;
}

/**
 * Get public service alerts with calculated Trust & Freshness metadata.
 * Includes expired alerts so the UI can show "Alert expired" cards.
 * Does NOT include withdrawn alerts (those are removed from public view).
 */
const getPublicAlerts = async (req, res, next) => {
  try {
    const { route, severity } = req.query;

    // Include expired but NOT withdrawn from public feed
    const filter = {
      status: { $in: ['published', 'active', 'expired'] }
    };

    if (route) {
      filter.$or = [{ routeCode: route.toUpperCase() }, { routeCode: 'ALL' }];
    }

    if (severity) {
      filter.severity = severity;
    }

    const rawAlerts = await Alert.find(filter)
      .sort({ lastConfirmedAt: -1 })
      .populate('createdBy', 'username fullName');

    // Auto-expire any alerts that have passed their expiresAt at query time
    const alerts = await Promise.all(rawAlerts.map(maybeAutoExpire));

    // Attach evaluated freshness state to each alert
    const evaluated = alerts.map(alert => {
      const freshness = evaluateAlertFreshness(alert);
      const obj = alert.toObject ? alert.toObject() : alert;
      return { ...obj, freshness };
    });

    return res.status(200).json({
      success: true,
      count: evaluated.length,
      data: evaluated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single alert by ID with full Trust Engine evaluation.
 */
const getAlertById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Allow viewing expired/withdrawn by ID for transparency (admin links etc)
    const alert = await Alert.findById(id).populate('createdBy', 'username fullName');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Service alert not found'
      });
    }

    // Auto-expire if applicable
    await maybeAutoExpire(alert);

    const freshness = evaluateAlertFreshness(alert);
    const obj = alert.toObject ? alert.toObject() : alert;

    return res.status(200).json({
      success: true,
      data: { ...obj, freshness }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicAlerts,
  getAlertById,
  maybeAutoExpire
};
