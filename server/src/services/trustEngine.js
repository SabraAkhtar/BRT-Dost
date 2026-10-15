/**
 * BRT Dost — Trust & Freshness Engine
 *
 * Core intelligence system for transport information reliability,
 * timestamp-based freshness calculation, source transparency, and conflict flagging.
 *
 * Principle: "Never present unverified, expired, or outdated information as
 * confirmed live transport status. Return UNKNOWN when no reliable data exists."
 */

const {
  FRESHNESS_CONFIG,
  ALERT_STATES,
  REPORT_STATES,
  ROUTE_STATUS_CODES,
  STATE_LABELS,
  MODERATION_TO_TRUST_STATE
} = require('../config/trustConfig');

// ─── Utility Helpers ─────────────────────────────────────────────────────────

/**
 * Safely parses a date value, returning null for missing or invalid timestamps.
 * @param {*} value - Any date-like value
 * @returns {Date|null}
 */
function safeParseDateUTC(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Computes elapsed milliseconds from a timestamp to now (UTC).
 * Returns null if timestamp is missing or invalid.
 * @param {*} timestamp
 * @returns {number|null}
 */
function elapsedMs(timestamp) {
  const d = safeParseDateUTC(timestamp);
  if (!d) return null;
  return Math.max(0, Date.now() - d.getTime());
}

/**
 * Formats elapsed time as a human-readable relative string.
 * @param {number|null} ms - Elapsed milliseconds
 * @returns {string}
 */
function formatElapsedHuman(ms) {
  if (ms === null || ms === undefined) return 'Unknown time';
  const totalMins = Math.floor(ms / (1000 * 60));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `${Math.max(1, mins)} minute${mins !== 1 ? 's' : ''} ago`;
  if (mins === 0) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  return `${hrs}h ${mins}m ago`;
}

/**
 * Formats elapsed ms as fractional hours (1 decimal place).
 */
function toHours(ms) {
  if (ms === null || ms === undefined) return null;
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
}

// ─── Alert Freshness Evaluation ───────────────────────────────────────────────

/**
 * Calculates the exact Trust & Freshness state of a service alert.
 *
 * State priority order:
 *   1. WITHDRAWN  – explicitly retracted by admin
 *   2. EXPIRED    – past scheduled expiresAt OR status === 'expired'
 *   3. STALE      – freshness window elapsed without re-confirmation
 *   4. VERIFIED / OFFICIAL_VERIFIED – within freshness window
 *   5. UNKNOWN    – missing/invalid data
 *
 * @param {Object|null} alert - Mongoose document or plain object
 * @returns {Object} Freshness evaluation metadata
 */
function evaluateAlertFreshness(alert) {
  // ── Safety: null/undefined guard ───────────────────────────────────────────
  if (!alert) {
    return {
      state: ALERT_STATES.UNKNOWN,
      label: STATE_LABELS[ALERT_STATES.UNKNOWN],
      isFresh: false,
      elapsedHuman: null,
      elapsedHours: null,
      freshnessWindowHours: FRESHNESS_CONFIG.defaultAlertFreshnessHours,
      description: 'No alert data provided.',
      missingTimestamp: true
    };
  }

  // ── 1. WITHDRAWN ───────────────────────────────────────────────────────────
  if (alert.status === 'withdrawn') {
    return {
      state: ALERT_STATES.WITHDRAWN,
      label: STATE_LABELS[ALERT_STATES.WITHDRAWN],
      isFresh: false,
      elapsedHuman: null,
      elapsedHours: null,
      freshnessWindowHours: null,
      description: 'This announcement was officially withdrawn by transit administrators.',
      source: alert.source || 'BRT Dost Operations Desk'
    };
  }

  // ── Timestamp safety check ────────────────────────────────────────────────
  const confirmedAt = safeParseDateUTC(alert.lastConfirmedAt || alert.publishedAt || alert.createdAt);
  const missingTimestamp = !confirmedAt;

  if (missingTimestamp) {
    return {
      state: ALERT_STATES.UNKNOWN,
      label: STATE_LABELS[ALERT_STATES.UNKNOWN],
      isFresh: false,
      elapsedHuman: null,
      elapsedHours: null,
      freshnessWindowHours: FRESHNESS_CONFIG.defaultAlertFreshnessHours,
      description: 'Alert has a missing or invalid confirmation timestamp. Cannot determine freshness.',
      missingTimestamp: true,
      source: alert.source || 'Unknown'
    };
  }

  const elapsed = elapsedMs(confirmedAt);
  const elapsedHours = toHours(elapsed);
  const freshnessWindowHours = (typeof alert.freshnessHours === 'number' && alert.freshnessHours >= 1)
    ? alert.freshnessHours
    : FRESHNESS_CONFIG.defaultAlertFreshnessHours;
  const freshnessWindowMs = freshnessWindowHours * 60 * 60 * 1000;

  // ── 2. EXPIRED ────────────────────────────────────────────────────────────
  const expiresAt = safeParseDateUTC(alert.expiresAt);
  const isExpiredByTime = expiresAt && Date.now() > expiresAt.getTime();
  const isExpiredByStatus = alert.status === 'expired';

  if (isExpiredByStatus || isExpiredByTime) {
    const expiredAgo = expiresAt ? formatElapsedHuman(elapsedMs(expiresAt)) : null;
    return {
      state: ALERT_STATES.EXPIRED,
      label: STATE_LABELS[ALERT_STATES.EXPIRED],
      isFresh: false,
      elapsedHuman: formatElapsedHuman(elapsed),
      elapsedHours,
      freshnessWindowHours,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      expiredAgo,
      description: expiredAgo
        ? `This advisory expired ${expiredAgo}.`
        : 'This advisory has reached its scheduled expiration time.',
      source: alert.source || 'BRT Dost Operations Desk'
    };
  }

  // ── 3. STALE ──────────────────────────────────────────────────────────────
  if (elapsed > freshnessWindowMs) {
    return {
      state: ALERT_STATES.STALE,
      label: STATE_LABELS[ALERT_STATES.STALE],
      isFresh: false,
      elapsedHuman: formatElapsedHuman(elapsed),
      elapsedHours,
      freshnessWindowHours,
      description: `Last confirmed ${formatElapsedHuman(elapsed)} — freshness limit is ${freshnessWindowHours}h. Information may no longer reflect current conditions.`,
      source: alert.source || 'BRT Dost Operations Desk',
      lastConfirmedAt: confirmedAt.toISOString()
    };
  }

  // ── 4. VERIFIED / OFFICIAL_VERIFIED ───────────────────────────────────────
  const isOfficial = alert.verificationStatus === 'official' || alert.sourceType === 'official_feed';
  const state = isOfficial ? ALERT_STATES.OFFICIAL_VERIFIED : ALERT_STATES.VERIFIED;

  return {
    state,
    label: STATE_LABELS[state],
    isFresh: true,
    elapsedHuman: formatElapsedHuman(elapsed),
    elapsedHours,
    freshnessWindowHours,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    description: `Confirmed reliable by ${alert.source || 'BRT Moderation Desk'}. Updated ${formatElapsedHuman(elapsed)}.`,
    source: alert.source || 'BRT Dost Operations Desk',
    lastConfirmedAt: confirmedAt.toISOString(),
    isOfficial
  };
}

// ─── Report Trust State ───────────────────────────────────────────────────────

/**
 * Maps a passenger report's moderationStatus to its Trust Engine state.
 * Separates moderation domain from UI trust representation.
 *
 * @param {Object} report - Mongoose document or plain object
 * @returns {Object} Report trust metadata
 */
function evaluateReportTrust(report) {
  if (!report) {
    return {
      state: REPORT_STATES.UNVERIFIED,
      label: STATE_LABELS[REPORT_STATES.UNVERIFIED],
      description: 'No report data available.'
    };
  }

  // Conflict takes precedence over moderation status
  if (report.isConflict || report.moderationStatus === 'conflict_flagged') {
    return {
      state: REPORT_STATES.CONFLICT,
      label: STATE_LABELS[REPORT_STATES.CONFLICT],
      description: report.conflictReason
        || 'System detected differing reports or an alert mismatch. Admin review in progress. Do not treat as confirmed.',
      isConflict: true,
      submittedAt: safeParseDateUTC(report.createdAt)?.toISOString() || null,
      elapsedHuman: formatElapsedHuman(elapsedMs(report.createdAt)),
      source: 'Passenger Submission (Unverified)',
      reviewedBy: report.reviewedBy || null
    };
  }

  const state = MODERATION_TO_TRUST_STATE[report.moderationStatus] || REPORT_STATES.UNVERIFIED;
  const isVerified = state === REPORT_STATES.VERIFIED;

  return {
    state,
    label: STATE_LABELS[state],
    description: isVerified
      ? 'An administrator has reviewed and confirmed this report as accurate.'
      : state === REPORT_STATES.REJECTED
        ? 'This report was reviewed and determined to be inaccurate or a duplicate.'
        : 'Passenger submission awaiting admin moderation. Treat as unconfirmed.',
    isConflict: false,
    submittedAt: safeParseDateUTC(report.createdAt)?.toISOString() || null,
    elapsedHuman: formatElapsedHuman(elapsedMs(report.createdAt)),
    source: 'Passenger Submission',
    reviewedBy: isVerified ? (report.reviewedBy || null) : null,
    reviewedAt: isVerified ? (safeParseDateUTC(report.reviewedAt)?.toISOString() || null) : null
  };
}

// ─── Route Status Evaluation ──────────────────────────────────────────────────

/**
 * Evaluates route-level operational status.
 * NEVER returns a positive status without verified fresh data.
 * NEVER presents UNKNOWN as "Operational."
 *
 * @param {Object} route - Route model object
 * @param {Array}  routeAlerts - Alerts for this route
 * @param {Array}  unverifiedReports - Pending passenger reports
 * @returns {Object} Route health and reliability evaluation
 */
function evaluateRouteStatus(route, routeAlerts = [], unverifiedReports = []) {
  const evaluatedAlerts = (routeAlerts || []).map(alert => ({
    alert,
    freshness: evaluateAlertFreshness(alert)
  }));

  const freshAlerts = evaluatedAlerts.filter(
    a => a.freshness.isFresh && (a.alert.status === 'active' || a.alert.status === 'published')
  );
  const staleAlerts = evaluatedAlerts.filter(a => a.freshness.state === ALERT_STATES.STALE);

  // DISRUPTION — fresh verified alert confirms service disruption/closure
  const disruptionAlert = freshAlerts.find(
    a => a.alert.severity === 'disruption' || a.alert.severity === 'closure'
  );
  if (disruptionAlert) {
    return {
      code: ROUTE_STATUS_CODES.DISRUPTION,
      badge: STATE_LABELS[ROUTE_STATUS_CODES.DISRUPTION],
      color: 'rose',
      summary: disruptionAlert.alert.title,
      description: disruptionAlert.alert.description,
      source: disruptionAlert.alert.source,
      lastConfirmedAt: disruptionAlert.freshness.lastConfirmedAt,
      elapsedHuman: disruptionAlert.freshness.elapsedHuman,
      isFresh: true,
      pendingReportsCount: (unverifiedReports || []).length
    };
  }

  // WARNING — fresh alert with advisory conditions
  const warningAlert = freshAlerts.find(a => a.alert.severity === 'warning');
  if (warningAlert) {
    return {
      code: ROUTE_STATUS_CODES.WARNING,
      badge: STATE_LABELS[ROUTE_STATUS_CODES.WARNING],
      color: 'amber',
      summary: warningAlert.alert.title,
      description: warningAlert.alert.description,
      source: warningAlert.alert.source,
      lastConfirmedAt: warningAlert.freshness.lastConfirmedAt,
      elapsedHuman: warningAlert.freshness.elapsedHuman,
      isFresh: true,
      pendingReportsCount: (unverifiedReports || []).length
    };
  }

  // CONFIRMED_OPERATIONAL — fresh info alert explicitly confirms service
  const infoAlert = freshAlerts.find(a => a.alert.severity === 'info');
  if (infoAlert) {
    return {
      code: ROUTE_STATUS_CODES.CONFIRMED_OPERATIONAL,
      badge: STATE_LABELS[ROUTE_STATUS_CODES.CONFIRMED_OPERATIONAL],
      color: 'teal',
      summary: infoAlert.alert.title,
      description: infoAlert.alert.description,
      source: infoAlert.alert.source,
      lastConfirmedAt: infoAlert.freshness.lastConfirmedAt,
      elapsedHuman: infoAlert.freshness.elapsedHuman,
      isFresh: true,
      pendingReportsCount: (unverifiedReports || []).length
    };
  }

  // STALE — previous admin confirmation exists but window has elapsed
  if (staleAlerts.length > 0) {
    const top = staleAlerts[0];
    return {
      code: ROUTE_STATUS_CODES.STALE,
      badge: STATE_LABELS[ROUTE_STATUS_CODES.STALE],
      color: 'amber',
      summary: `Previous update from ${top.freshness.elapsedHuman || 'unknown time'}`,
      description: 'Service status cannot be guaranteed without a recent administrator re-confirmation.',
      source: top.alert.source,
      lastConfirmedAt: top.freshness.lastConfirmedAt,
      elapsedHuman: top.freshness.elapsedHuman,
      isFresh: false,
      pendingReportsCount: (unverifiedReports || []).length
    };
  }

  // UNVERIFIED_ACTIVITY — passengers report issues but no verified alert exists
  if ((unverifiedReports || []).length > 0) {
    return {
      code: ROUTE_STATUS_CODES.UNVERIFIED_ACTIVITY,
      badge: STATE_LABELS[ROUTE_STATUS_CODES.UNVERIFIED_ACTIVITY],
      color: 'yellow',
      summary: `${unverifiedReports.length} passenger report(s) pending verification`,
      description: 'Passenger reports have been logged and are awaiting admin verification. Do not treat as confirmed.',
      source: 'Passenger Submissions (Unverified)',
      lastConfirmedAt: null,
      elapsedHuman: null,
      isFresh: false,
      pendingReportsCount: unverifiedReports.length
    };
  }

  // UNKNOWN — honest default; no data available
  return {
    code: ROUTE_STATUS_CODES.UNKNOWN,
    badge: STATE_LABELS[ROUTE_STATUS_CODES.UNKNOWN],
    color: 'slate',
    summary: 'No verified update within freshness window',
    description: 'BRT Dost has not received admin confirmation or an official data feed for this route. Status is unconfirmed.',
    source: 'None available',
    lastConfirmedAt: null,
    elapsedHuman: null,
    isFresh: false,
    pendingReportsCount: 0
  };
}

// ─── Conflict Detection ───────────────────────────────────────────────────────

/**
 * Checks whether a new passenger report conflicts with existing reports or active alerts.
 * Never silently picks one as correct — always flags for human review.
 *
 * @param {Object} newReport
 * @param {Array}  recentReports - Recent reports for the same area
 * @param {Array}  activeAlerts  - Currently active verified alerts
 * @returns {{ isConflict: boolean, reason: string }}
 */
function analyzeReportConflict(newReport, recentReports = [], activeAlerts = []) {
  // Conflict: active alert says normal but passenger reports breakdown/delay
  const conflictingAlert = (activeAlerts || []).find(a =>
    a.routeCode === newReport.routeCode &&
    a.severity === 'info' &&
    (newReport.category === 'Bus Breakdown' || newReport.category === 'Delay')
  );

  if (conflictingAlert) {
    return {
      isConflict: true,
      reason: `Report claims '${newReport.category}' while active alert '${conflictingAlert.title}' marks this line as normal service. Flagged for administrator review.`
    };
  }

  // Conflict: multiple reports with different categories at same station in 2 hours
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const recentSameStation = (recentReports || []).filter(r =>
    r.stationName === newReport.stationName &&
    new Date(r.createdAt).getTime() > twoHoursAgo &&
    r._id?.toString() !== (newReport._id?.toString() || '')
  );

  const hasDiscrepancy = recentSameStation.some(r => r.category !== newReport.category);
  if (recentSameStation.length >= 2 && hasDiscrepancy) {
    return {
      isConflict: true,
      reason: `Conflicting passenger issue categories at station '${newReport.stationName}' within 2 hours. Requires moderation review.`
    };
  }

  return { isConflict: false, reason: '' };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  evaluateAlertFreshness,
  evaluateReportTrust,
  evaluateRouteStatus,
  analyzeReportConflict,
  safeParseDateUTC,
  formatElapsedHuman,
  // Re-export config for consumers that need only thresholds
  FRESHNESS_CONFIG,
  ALERT_STATES,
  REPORT_STATES,
  ROUTE_STATUS_CODES,
  STATE_LABELS,
  // Legacy compat alias
  DEFAULT_FRESHNESS_HOURS: FRESHNESS_CONFIG.defaultAlertFreshnessHours
};
