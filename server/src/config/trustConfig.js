/**
 * BRT Dost — Trust & Freshness Engine: Central Configuration
 *
 * This file defines every information state, state applicability rules,
 * freshness thresholds, and source transparency requirements.
 * All values are configurable via environment variables.
 *
 * NEVER modify state logic here to make data look more reliable than it is.
 */

// ─── Freshness Thresholds ────────────────────────────────────────────────────

const FRESHNESS_CONFIG = {
  /** Default max age (hours) before a verified alert becomes STALE */
  defaultAlertFreshnessHours: parseInt(process.env.DEFAULT_FRESHNESS_HOURS || '4', 10),

  /** Max age (hours) before a verified passenger report is considered old */
  reportFreshnessHours: parseInt(process.env.REPORT_FRESHNESS_HOURS || '24', 10),

  /** Minimum time (minutes) between freshness re-confirmations to prevent spam */
  reconfirmCooldownMinutes: parseInt(process.env.RECONFIRM_COOLDOWN_MINUTES || '10', 10)
};

// ─── State Definitions ────────────────────────────────────────────────────────

/**
 * States applicable to SERVICE ALERTS (admin-created or official announcements).
 *
 * VERIFIED     – Admin has reviewed and published; within freshness window.
 * STALE        – Was verified, but freshness window has elapsed; re-confirmation needed.
 * EXPIRED      – Alert has passed its scheduled expiresAt timestamp.
 * WITHDRAWN    – Admin explicitly withdrew the announcement.
 * UNKNOWN      – No usable current information (missing/invalid data).
 */
const ALERT_STATES = {
  VERIFIED: 'VERIFIED',
  OFFICIAL_VERIFIED: 'OFFICIAL_VERIFIED',
  STALE: 'STALE',
  EXPIRED: 'EXPIRED',
  WITHDRAWN: 'WITHDRAWN',
  UNKNOWN: 'UNKNOWN'
};

/**
 * States applicable to PASSENGER REPORTS (crowd-sourced submissions).
 *
 * UNVERIFIED   – Submitted, awaiting admin review.
 * VERIFIED     – Admin has confirmed the report is legitimate.
 * CONFLICT     – System detected contradicting reports or alert mismatch.
 * REJECTED     – Admin determined the report was inaccurate or duplicate.
 */
const REPORT_STATES = {
  UNVERIFIED: 'UNVERIFIED',
  VERIFIED: 'VERIFIED',
  CONFLICT: 'CONFLICT_FLAGGED',
  REJECTED: 'REJECTED'
};

/**
 * States applicable to ROUTE / SERVICE STATUS (aggregate view).
 *
 * CONFIRMED_OPERATIONAL – Fresh verified alert confirms normal service.
 * DISRUPTION            – Fresh verified alert reports disruption/closure.
 * WARNING               – Fresh verified alert warns of advisory conditions.
 * STALE                 – Previous confirmation exists but freshness window elapsed.
 * UNVERIFIED_ACTIVITY   – Passenger reports exist but no admin verification.
 * UNKNOWN               – No data available (honest default; never invent status).
 */
const ROUTE_STATUS_CODES = {
  CONFIRMED_OPERATIONAL: 'CONFIRMED_OPERATIONAL',
  DISRUPTION: 'DISRUPTION',
  WARNING: 'WARNING',
  STALE: 'STALE',
  UNVERIFIED_ACTIVITY: 'UNVERIFIED_ACTIVITY',
  UNKNOWN: 'UNKNOWN'
};

// ─── Human-Readable Labels (used in API responses & frontend) ─────────────────

/**
 * Accessible display labels — use text + icons, never color alone.
 * These exact strings are consumed by the frontend TrustBadge component.
 */
const STATE_LABELS = {
  // Alert labels
  [ALERT_STATES.VERIFIED]: 'Verified update',
  [ALERT_STATES.OFFICIAL_VERIFIED]: 'Official Transit Announcement',
  [ALERT_STATES.STALE]: 'Information may be outdated',
  [ALERT_STATES.EXPIRED]: 'Alert expired',
  [ALERT_STATES.WITHDRAWN]: 'Alert withdrawn',
  [ALERT_STATES.UNKNOWN]: 'No confirmed current information',

  // Report labels
  [REPORT_STATES.UNVERIFIED]: 'Passenger report — not verified',
  [REPORT_STATES.VERIFIED]: 'Verified passenger report',
  [REPORT_STATES.CONFLICT]: 'Conflicting reports — under review',
  [REPORT_STATES.REJECTED]: 'Report rejected by admin',

  // Route status labels
  [ROUTE_STATUS_CODES.CONFIRMED_OPERATIONAL]: 'Confirmed operational',
  [ROUTE_STATUS_CODES.DISRUPTION]: 'Service disruption',
  [ROUTE_STATUS_CODES.WARNING]: 'Service advisory',
  [ROUTE_STATUS_CODES.STALE]: 'Status may be outdated',
  [ROUTE_STATUS_CODES.UNVERIFIED_ACTIVITY]: 'Unverified passenger activity',
  [ROUTE_STATUS_CODES.UNKNOWN]: 'Status unknown — no live confirmation'
};

// ─── Moderation Status → Trust State Mapping ─────────────────────────────────

/**
 * Maps Mongoose moderationStatus values to Trust Engine report states.
 * This keeps domain models decoupled from UI representation.
 */
const MODERATION_TO_TRUST_STATE = {
  pending: REPORT_STATES.UNVERIFIED,
  'under review': REPORT_STATES.UNVERIFIED,
  under_review: REPORT_STATES.UNVERIFIED,
  verified: REPORT_STATES.VERIFIED,
  rejected: REPORT_STATES.REJECTED,
  conflict_flagged: REPORT_STATES.CONFLICT
};

module.exports = {
  FRESHNESS_CONFIG,
  ALERT_STATES,
  REPORT_STATES,
  ROUTE_STATUS_CODES,
  STATE_LABELS,
  MODERATION_TO_TRUST_STATE
};
