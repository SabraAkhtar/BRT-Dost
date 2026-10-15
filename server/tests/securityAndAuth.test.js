const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const User = require('../src/models/User');
const Report = require('../src/models/Report');
const Alert = require('../src/models/Alert');
const Route = require('../src/models/Route');
const Station = require('../src/models/Station');
const { connectDB, disconnectDB } = require('../src/config/db');

let server;
let baseUrl;
let adminToken;
let normalUserToken;

before(async () => {
  await connectDB();

  // Create or update admin user
  await User.deleteMany({});
  const admin = new User({
    username: 'testadmin',
    email: 'testadmin@brtdost.pk',
    password: 'AdminPassword123!',
    fullName: 'Test Admin',
    role: 'admin'
  });
  await admin.save();

  // Create normal / non-admin user
  const normalUser = new User({
    username: 'normalcommuter',
    email: 'commuter@brtdost.pk',
    password: 'CommuterPassword123!',
    fullName: 'Normal Commuter',
    role: 'moderator',
    isActive: false // Deactivated
  });
  await normalUser.save();

  const JWT_SECRET = process.env.JWT_SECRET || 'brt_dost_dev_secret_key_peshawar_brt_2026_bootcamp_secure';
  adminToken = jwt.sign(
    { id: admin._id, username: admin.username, role: admin.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  normalUserToken = jwt.sign(
    { id: normalUser._id, username: normalUser.username, role: normalUser.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Start test HTTP server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
});

describe('Prompt 5 & 6 — Security, Authentication & Role-Based Access Control', () => {

  test('1. Logged-out access to protected endpoint /api/admin/stats is blocked (401)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /authentication required/i);
  });

  test('2. Request with forged or invalid JWT token is rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: 'Bearer forged.token.signature' }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /invalid authorization token/i);
  });

  test('3. Request with expired JWT token is rejected (401)', async () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'brt_dost_dev_secret_key_peshawar_brt_2026_bootcamp_secure';
    const expiredToken = jwt.sign({ id: 'dummy' }, JWT_SECRET, { expiresIn: '-1s' });
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.message, /expired/i);
  });

  test('4. Deactivated administrator cannot access protected APIs (403)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /deactivated/i);
  });

  test('5. Invalid login credentials returns safe generic 401 error', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent_user', password: 'wrongpassword' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /invalid credentials/i);
  });

  test('6. Valid login returns JWT token and strips password hash from response', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testadmin', password: 'AdminPassword123!' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.token);
    assert.equal(body.user.username, 'testadmin');
    assert.equal(body.user.password, undefined);
    assert.equal(body.user.passwordHash, undefined);
  });

  test('7. /api/auth/me restores authenticated session successfully', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.username, 'testadmin');
    assert.equal(body.user.password, undefined);
  });

  test('8. Public reports API (/api/reports) strips private passenger contact info', async () => {
    // Insert report with private contact info
    const report = new Report({
      routeCode: 'ML-01',
      routeName: 'Main Line (Chamkani - Karkhano)',
      stationName: 'Chamkani',
      category: 'Delay',
      description: 'Privacy test report with sensitive contact number.',
      passengerContact: '+923001234567',
      moderationStatus: 'verified'
    });
    await report.save();

    const res = await fetch(`${baseUrl}/api/reports?limit=10`);
    assert.equal(res.status, 200);
    const body = await res.json();
    const found = body.data.find(r => r._id === report._id.toString());
    assert.ok(found);
    // Public feed must NOT contain passengerContact
    assert.equal(found.passengerContact, undefined);
  });

  test('9. Admin reports API (/api/admin/reports) preserves contact info for authorized staff', async () => {
    const res = await fetch(`${baseUrl}/api/admin/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const privacyReport = body.data.find(r => r.passengerContact === '+923001234567');
    assert.ok(privacyReport);
    assert.equal(privacyReport.passengerContact, '+923001234567');
  });

  test('10. Invalid report moderation status is rejected with 400 Bad Request', async () => {
    const report = await Report.findOne({});
    const res = await fetch(`${baseUrl}/api/admin/reports/${report._id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'invalid_status_value' })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /invalid moderation status/i);
  });

  test('11. Creating alert without authorization is blocked (401)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacked Alert', description: 'Malicious announcement' })
    });
    assert.equal(res.status, 401);
  });

  test('12. Creating alert with missing title is rejected by validation middleware (400)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: '',
        description: 'Valid description',
        severity: 'info',
        source: 'Operations Desk'
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('13. Withdrawing an alert sets status to withdrawn and preserves audit trail', async () => {
    const alert = new Alert({
      title: 'Audit Withdrawal Test',
      description: 'Temporary diversion at Saddar',
      severity: 'warning',
      routeCode: 'ML-01',
      stationName: 'Saddar Cantt',
      source: 'Control Desk',
      status: 'active'
    });
    await alert.save();

    const res = await fetch(`${baseUrl}/api/admin/alerts/${alert._id}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    const updated = await Alert.findById(alert._id);
    assert.equal(updated.status, 'withdrawn');
    assert.ok(updated.withdrawnAt);
    assert.equal(updated.updatedBy.toString(), adminToken ? jwt.decode(adminToken).id : '');

    // Confirm it is excluded from public active alerts
    const publicRes = await fetch(`${baseUrl}/api/alerts`);
    const publicBody = await publicRes.json();
    const inPublic = publicBody.data.some(a => a._id === alert._id.toString());
    assert.equal(inPublic, false);
  });

  test('14. Promoting passenger report creates new verified Alert linked to origin report', async () => {
    const report = new Report({
      routeCode: 'ER-01',
      routeName: 'Express Route 1 (Chamkani - Karkhano)',
      stationName: 'University of Peshawar',
      category: 'AC / Climate Control',
      description: 'AC compressor failure in carriage 4',
      moderationStatus: 'pending'
    });
    await report.save();

    const res = await fetch(`${baseUrl}/api/admin/reports/${report._id}/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'AC Failure on ER-01',
        severity: 'warning',
        freshnessHours: 4
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.alert);
    assert.equal(body.data.alert.verificationStatus, 'verified');
    assert.equal(body.data.alert.originReportId, report._id.toString());

    // Origin report should now be marked verified with moderation note
    const updatedReport = await Report.findById(report._id);
    assert.equal(updatedReport.moderationStatus, 'verified');
    assert.match(updatedReport.moderationNotes, /promoted to public service alert/i);
  });
});
