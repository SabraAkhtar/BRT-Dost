/**
 * BRT Dost — Trust & Freshness Engine: Comprehensive Test Suite
 *
 * Covers all 8 required scenarios from the specification:
 *   1. Newly verified alert
 *   2. Old verified alert (STALE)
 *   3. Unverified passenger report
 *   4. Expired alert
 *   5. Withdrawn alert
 *   6. Two conflicting reports
 *   7. Missing timestamps
 *   8. Missing service information (UNKNOWN route status)
 *
 * Uses Node.js built-in test runner (no external dependencies required).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  evaluateAlertFreshness,
  evaluateReportTrust,
  evaluateRouteStatus,
  analyzeReportConflict,
  formatElapsedHuman,
  safeParseDateUTC
} = require('../src/services/trustEngine');

const {
  ALERT_STATES,
  REPORT_STATES,
  ROUTE_STATUS_CODES,
  STATE_LABELS
} = require('../src/config/trustConfig');

// ─── Helper factory functions ─────────────────────────────────────────────────

function makeAlert(overrides = {}) {
  return {
    status: 'active',
    verificationStatus: 'verified',
    source: 'BRT Dost Operations Desk',
    sourceType: 'admin_verified',
    severity: 'info',
    title: 'Test Alert',
    description: 'Test description',
    lastConfirmedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
    freshnessHours: 4,
    expiresAt: null,
    ...overrides
  };
}

function makeReport(overrides = {}) {
  return {
    routeCode: 'ML-01',
    routeName: 'Main Line',
    stationName: 'Saddar Cantt',
    category: 'Delay',
    description: 'Test report description',
    moderationStatus: 'pending',
    isConflict: false,
    conflictReason: '',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    ...overrides
  };
}

// ─── SCENARIO 1: Newly Verified Alert ────────────────────────────────────────

test('Scenario 1 — Newly verified alert is VERIFIED and fresh', async (t) => {
  const alert = makeAlert({
    lastConfirmedAt: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
    freshnessHours: 4
  });

  const result = evaluateAlertFreshness(alert);

  await t.test('state is VERIFIED', () => {
    assert.equal(result.state, ALERT_STATES.VERIFIED);
  });
  await t.test('isFresh is true', () => {
    assert.equal(result.isFresh, true);
  });
  await t.test('label matches accessible text', () => {
    assert.equal(result.label, STATE_LABELS[ALERT_STATES.VERIFIED]);
  });
  await t.test('elapsedHuman is present', () => {
    assert.ok(result.elapsedHuman, 'Should have human elapsed string');
  });
  await t.test('source is preserved', () => {
    assert.equal(result.source, alert.source);
  });
  await t.test('lastConfirmedAt is ISO string', () => {
    assert.ok(result.lastConfirmedAt.endsWith('Z'), 'Should be UTC ISO format');
  });
});

test('Scenario 1b — Official feed alert returns OFFICIAL_VERIFIED', async (t) => {
  const alert = makeAlert({
    verificationStatus: 'official',
    sourceType: 'official_feed',
    lastConfirmedAt: new Date(Date.now() - 30 * 60 * 1000)
  });

  const result = evaluateAlertFreshness(alert);

  await t.test('state is OFFICIAL_VERIFIED', () => {
    assert.equal(result.state, ALERT_STATES.OFFICIAL_VERIFIED);
  });
  await t.test('isFresh is true', () => {
    assert.equal(result.isFresh, true);
  });
  await t.test('isOfficial flag is set', () => {
    assert.equal(result.isOfficial, true);
  });
});

// ─── SCENARIO 2: Old Verified Alert (STALE) ───────────────────────────────────

test('Scenario 2 — Old verified alert exceeds freshness window → STALE', async (t) => {
  const alert = makeAlert({
    lastConfirmedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h ago, limit is 4h
    freshnessHours: 4
  });

  const result = evaluateAlertFreshness(alert);

  await t.test('state is STALE', () => {
    assert.equal(result.state, ALERT_STATES.STALE);
  });
  await t.test('isFresh is false', () => {
    assert.equal(result.isFresh, false);
  });
  await t.test('label matches STATE_LABELS.STALE', () => {
    assert.equal(result.label, STATE_LABELS[ALERT_STATES.STALE]);
  });
  await t.test('description mentions freshness limit', () => {
    assert.match(result.description, /4h/);
  });
  await t.test('elapsedHours reflects actual time elapsed', () => {
    assert.ok(result.elapsedHours >= 5.9, `Expected ≥ 5.9h elapsed, got ${result.elapsedHours}`);
  });
  await t.test('freshnessWindowHours matches alert config', () => {
    assert.equal(result.freshnessWindowHours, 4);
  });
});

test('Scenario 2b — Stale alert with custom freshness threshold (24h)', async (t) => {
  const alert = makeAlert({
    lastConfirmedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25h ago
    freshnessHours: 24
  });

  const result = evaluateAlertFreshness(alert);

  await t.test('state is STALE at 25h with 24h threshold', () => {
    assert.equal(result.state, ALERT_STATES.STALE);
  });
  await t.test('freshnessWindowHours is 24 from alert config', () => {
    assert.equal(result.freshnessWindowHours, 24);
  });
});

// ─── SCENARIO 3: Unverified Passenger Report ─────────────────────────────────

test('Scenario 3 — Unverified passenger report has correct trust state', async (t) => {
  const report = makeReport({ moderationStatus: 'pending' });
  const result = evaluateReportTrust(report);

  await t.test('state is UNVERIFIED', () => {
    assert.equal(result.state, REPORT_STATES.UNVERIFIED);
  });
  await t.test('label says "Passenger report — not verified"', () => {
    assert.equal(result.label, 'Passenger report — not verified');
  });
  await t.test('description mentions awaiting moderation', () => {
    assert.match(result.description, /moderation|unconfirmed/i);
  });
  await t.test('source is passenger submission', () => {
    assert.equal(result.source, 'Passenger Submission');
  });
  await t.test('elapsedHuman is present', () => {
    assert.ok(result.elapsedHuman);
  });
  await t.test('reviewedBy is null (not yet reviewed)', () => {
    assert.equal(result.reviewedBy, null);
  });
});

test('Scenario 3b — Verified passenger report has VERIFIED state', async (t) => {
  const report = makeReport({
    moderationStatus: 'verified',
    reviewedBy: 'admin-user-id',
    reviewedAt: new Date(Date.now() - 10 * 60 * 1000)
  });
  const result = evaluateReportTrust(report);

  await t.test('state is VERIFIED', () => {
    assert.equal(result.state, REPORT_STATES.VERIFIED);
  });
  await t.test('description mentions admin confirmed', () => {
    assert.match(result.description, /administrator|confirmed/i);
  });
  await t.test('reviewedBy is populated', () => {
    assert.ok(result.reviewedBy);
  });
});

// ─── SCENARIO 4: Expired Alert ────────────────────────────────────────────────

test('Scenario 4a — Alert past its expiresAt timestamp is EXPIRED', async (t) => {
  const alert = makeAlert({
    expiresAt: new Date(Date.now() - 45 * 60 * 1000), // expired 45 mins ago
    lastConfirmedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'active' // status in DB is still active — should be auto-expired
  });

  const result = evaluateAlertFreshness(alert);

  await t.test('state is EXPIRED', () => {
    assert.equal(result.state, ALERT_STATES.EXPIRED);
  });
  await t.test('isFresh is false', () => {
    assert.equal(result.isFresh, false);
  });
  await t.test('label is "Alert expired"', () => {
    assert.equal(result.label, 'Alert expired');
  });
  await t.test('expiredAgo string is present', () => {
    assert.ok(result.expiredAgo, 'Should indicate when it expired');
  });
  await t.test('expiresAt ISO string is returned', () => {
    assert.ok(result.expiresAt);
  });
});

test('Scenario 4b — Alert with status=expired is EXPIRED even if expiresAt is in future', async (t) => {
  const alert = makeAlert({
    status: 'expired',
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // future date
    lastConfirmedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  });

  const result = evaluateAlertFreshness(alert);

  await t.test('state is EXPIRED when status=expired', () => {
    assert.equal(result.state, ALERT_STATES.EXPIRED);
  });
});

// ─── SCENARIO 5: Withdrawn Alert ─────────────────────────────────────────────

test('Scenario 5 — Withdrawn alert has WITHDRAWN state regardless of timestamps', async (t) => {
  const alert = makeAlert({
    status: 'withdrawn',
    // Even if very recent — withdrawn takes priority
    lastConfirmedAt: new Date(Date.now() - 5 * 60 * 1000)
  });

  const result = evaluateAlertFreshness(alert);

  await t.test('state is WITHDRAWN', () => {
    assert.equal(result.state, ALERT_STATES.WITHDRAWN);
  });
  await t.test('isFresh is false', () => {
    assert.equal(result.isFresh, false);
  });
  await t.test('label is "Alert withdrawn"', () => {
    assert.equal(result.label, 'Alert withdrawn');
  });
  await t.test('description explains withdrawal', () => {
    assert.match(result.description, /withdrawn/i);
  });
});

// ─── SCENARIO 6: Two Conflicting Reports ─────────────────────────────────────

test('Scenario 6a — Report conflicts with active operational alert', async (t) => {
  const newReport = {
    routeCode: 'ML-01',
    stationName: 'Malik Saad Shaheed',
    category: 'Bus Breakdown',
    description: 'Bus stopped on track near Malik Saad.'
  };

  const activeAlerts = [{
    routeCode: 'ML-01',
    severity: 'info',
    title: 'Normal Regular Service — 3 min headway'
  }];

  const result = analyzeReportConflict(newReport, [], activeAlerts);

  await t.test('conflict is detected', () => {
    assert.equal(result.isConflict, true);
  });
  await t.test('reason mentions the claim and alert', () => {
    assert.match(result.reason, /Bus Breakdown/);
    assert.match(result.reason, /Normal Regular Service/);
  });
});

test('Scenario 6b — Multiple different-category reports at same station → conflict', async (t) => {
  const twoHoursAgo = Date.now() - 90 * 60 * 1000; // 90 min ago
  const recentReports = [
    {
      _id: '111',
      stationName: 'Board Bazar',
      category: 'Overcrowding',
      createdAt: new Date(twoHoursAgo)
    },
    {
      _id: '222',
      stationName: 'Board Bazar',
      category: 'Delay',
      createdAt: new Date(twoHoursAgo - 10 * 60 * 1000)
    }
  ];

  const newReport = {
    _id: '333',
    routeCode: 'ML-01',
    stationName: 'Board Bazar',
    category: 'Station Infrastructure',
    description: 'Lift is broken'
  };

  const result = analyzeReportConflict(newReport, recentReports, []);

  await t.test('conflict detected from multiple categories', () => {
    assert.equal(result.isConflict, true);
  });
  await t.test('reason mentions the station name', () => {
    assert.match(result.reason, /Board Bazar/);
  });
});

test('Scenario 6c — Report trust state for conflict_flagged report', async (t) => {
  const report = makeReport({
    moderationStatus: 'conflict_flagged',
    isConflict: true,
    conflictReason: 'Contradicts 3-min headway alert. Flagged for review.'
  });

  const result = evaluateReportTrust(report);

  await t.test('state is CONFLICT_FLAGGED', () => {
    assert.equal(result.state, REPORT_STATES.CONFLICT);
  });
  await t.test('label says "Conflicting reports — under review"', () => {
    assert.equal(result.label, 'Conflicting reports — under review');
  });
  await t.test('conflict reason is preserved', () => {
    assert.match(result.description, /Contradicts/);
  });
  await t.test('isConflict flag is true', () => {
    assert.equal(result.isConflict, true);
  });
});

// ─── SCENARIO 7: Missing Timestamps ──────────────────────────────────────────

test('Scenario 7 — Alert with null timestamps returns UNKNOWN safely', async (t) => {
  const alert = makeAlert({
    lastConfirmedAt: null,
    publishedAt: null,
    createdAt: null
  });

  const result = evaluateAlertFreshness(alert);

  await t.test('state is UNKNOWN (not a crash)', () => {
    assert.equal(result.state, ALERT_STATES.UNKNOWN);
  });
  await t.test('isFresh is false', () => {
    assert.equal(result.isFresh, false);
  });
  await t.test('missingTimestamp flag is set', () => {
    assert.equal(result.missingTimestamp, true);
  });
  await t.test('description mentions missing timestamp', () => {
    assert.match(result.description, /missing|invalid/i);
  });
});

test('Scenario 7b — Alert with invalid timestamp string returns UNKNOWN', async (t) => {
  const alert = makeAlert({ lastConfirmedAt: 'not-a-date' });
  const result = evaluateAlertFreshness(alert);

  await t.test('state is UNKNOWN for invalid date string', () => {
    assert.equal(result.state, ALERT_STATES.UNKNOWN);
  });
});

test('Scenario 7c — null alert object returns UNKNOWN', async (t) => {
  const result = evaluateAlertFreshness(null);
  await t.test('state is UNKNOWN', () => {
    assert.equal(result.state, ALERT_STATES.UNKNOWN);
  });
  await t.test('isFresh is false', () => {
    assert.equal(result.isFresh, false);
  });
});

test('Scenario 7d — safeParseDateUTC handles edge cases', async (t) => {
  await t.test('null returns null', () => {
    assert.equal(safeParseDateUTC(null), null);
  });
  await t.test('undefined returns null', () => {
    assert.equal(safeParseDateUTC(undefined), null);
  });
  await t.test('empty string returns null', () => {
    assert.equal(safeParseDateUTC(''), null);
  });
  await t.test('valid ISO string returns Date', () => {
    const d = safeParseDateUTC('2026-01-01T00:00:00Z');
    assert.ok(d instanceof Date);
  });
  await t.test('valid Date object returns Date', () => {
    const d = safeParseDateUTC(new Date());
    assert.ok(d instanceof Date);
  });
});

// ─── SCENARIO 8: Missing Service Information (UNKNOWN route status) ───────────

test('Scenario 8a — Route with no data returns UNKNOWN (Honest UNKNOWN rule)', async (t) => {
  const route = { routeCode: 'ML-01', name: 'Main Line' };
  const result = evaluateRouteStatus(route, [], []);

  await t.test('code is UNKNOWN — never invents operational status', () => {
    assert.equal(result.code, ROUTE_STATUS_CODES.UNKNOWN);
  });
  await t.test('isFresh is false', () => {
    assert.equal(result.isFresh, false);
  });
  await t.test('badge says no live confirmation', () => {
    assert.match(result.badge, /unknown|no live confirmation/i);
  });
  await t.test('pendingReportsCount is 0', () => {
    assert.equal(result.pendingReportsCount, 0);
  });
  await t.test('source is "None available"', () => {
    assert.equal(result.source, 'None available');
  });
});

test('Scenario 8b — Route with null/undefined arrays returns UNKNOWN safely', async (t) => {
  const route = { routeCode: 'ML-01', name: 'Main Line' };
  const result = evaluateRouteStatus(route, null, undefined);

  await t.test('does not throw with null arrays', () => {
    assert.equal(result.code, ROUTE_STATUS_CODES.UNKNOWN);
  });
});

test('Scenario 8c — Route with only expired/stale alerts returns STALE status', async (t) => {
  const route = { routeCode: 'ML-01', name: 'Main Line' };
  const staleAlert = makeAlert({
    status: 'active',
    lastConfirmedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10h ago
    freshnessHours: 4
  });

  const result = evaluateRouteStatus(route, [staleAlert], []);

  await t.test('code is STALE (not operational)', () => {
    assert.equal(result.code, ROUTE_STATUS_CODES.STALE);
  });
  await t.test('isFresh is false', () => {
    assert.equal(result.isFresh, false);
  });
});

test('Scenario 8d — Route with fresh disruption alert returns DISRUPTION', async (t) => {
  const route = { routeCode: 'ML-01', name: 'Main Line' };
  const freshDisruption = makeAlert({
    status: 'active',
    severity: 'disruption',
    title: 'Track blockage near Hashtnagri',
    lastConfirmedAt: new Date(Date.now() - 20 * 60 * 1000),
    freshnessHours: 4
  });

  const result = evaluateRouteStatus(route, [freshDisruption], []);

  await t.test('code is DISRUPTION', () => {
    assert.equal(result.code, ROUTE_STATUS_CODES.DISRUPTION);
  });
  await t.test('isFresh is true', () => {
    assert.equal(result.isFresh, true);
  });
  await t.test('elapsedHuman shows how recent it is', () => {
    assert.ok(result.elapsedHuman);
  });
});

// ─── Additional: Utility Functions ───────────────────────────────────────────

test('formatElapsedHuman — produces correct relative strings', async (t) => {
  await t.test('5 minutes → "5 minutes ago"', () => {
    assert.equal(formatElapsedHuman(5 * 60 * 1000), '5 minutes ago');
  });
  await t.test('1 hour exactly → "1 hour ago"', () => {
    assert.equal(formatElapsedHuman(60 * 60 * 1000), '1 hour ago');
  });
  await t.test('2.5 hours → "2h 30m ago"', () => {
    assert.equal(formatElapsedHuman(2.5 * 60 * 60 * 1000), '2h 30m ago');
  });
  await t.test('null ms → "Unknown time"', () => {
    assert.equal(formatElapsedHuman(null), 'Unknown time');
  });
  await t.test('0 ms → at least 1 minute', () => {
    assert.match(formatElapsedHuman(0), /1 minute/);
  });
});

// ─── State labels completeness check ─────────────────────────────────────────

test('STATE_LABELS — all required states have human-readable labels', (t) => {
  const requiredStates = [
    'VERIFIED', 'OFFICIAL_VERIFIED', 'STALE', 'EXPIRED', 'WITHDRAWN', 'UNKNOWN',
    'UNVERIFIED', 'CONFLICT_FLAGGED',
    'CONFIRMED_OPERATIONAL', 'DISRUPTION', 'WARNING'
  ];

  for (const state of requiredStates) {
    const label = Object.values(require('../src/config/trustConfig').STATE_LABELS)
      .concat(Object.keys(require('../src/config/trustConfig').STATE_LABELS));
    // Check via direct import
    const { STATE_LABELS: SL } = require('../src/config/trustConfig');
    assert.ok(SL[state], `STATE_LABELS["${state}"] should be defined`);
  }
});
