const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Route = require('../models/Route');
const Station = require('../models/Station');
const Alert = require('../models/Alert');
const Report = require('../models/Report');

const stationsData = [
  { code: 'ST-01', name: 'Chamkani', nameUrdu: 'چمکنی', isInterchange: true, connectedRoutes: ['ML-01', 'ER-01', 'F-02'], facilities: ['Zu Card Kiosk', 'Elevator', 'Bus Depot', 'Parking', 'Wheelchair Ramp'], locationSummary: 'Eastern terminus near GT Road bypass' },
  { code: 'ST-02', name: 'Sardar Garhi', nameUrdu: 'سردار گڑھی', isInterchange: false, connectedRoutes: ['ML-01'], facilities: ['Zu Card Kiosk', 'Wheelchair Ramp', 'Ticket Vending'], locationSummary: 'Main GT Road near Sardar Garhi' },
  { code: 'ST-03', name: 'Chato Chowk', nameUrdu: 'چاٹو چوک', isInterchange: false, connectedRoutes: ['ML-01'], facilities: ['Zu Card Kiosk', 'Elevator'], locationSummary: 'GT Road commercial corridor' },
  { code: 'ST-04', name: 'Hashtnagri', nameUrdu: 'ہشتنگری', isInterchange: false, connectedRoutes: ['ML-01', 'ER-01'], facilities: ['Zu Card Kiosk', 'Elevator', 'Security Desk'], locationSummary: 'Historic Hashtnagri gate entrance' },
  { code: 'ST-05', name: 'Malik Saad Shaheed', nameUrdu: 'ملک سعد شہید', isInterchange: true, connectedRoutes: ['ML-01', 'ER-01', 'F-02'], facilities: ['Zu Card Kiosk', 'Customer Care Center', 'Elevator', 'Police Desk', 'Restrooms'], locationSummary: 'Major downtown interchange connecting Old City and Cantonment' },
  { code: 'ST-06', name: 'Khyber Bazar', nameUrdu: 'خیبر بازار', isInterchange: false, connectedRoutes: ['ML-01'], facilities: ['Zu Card Kiosk', 'Elevator', 'Wheelchair Ramp'], locationSummary: 'Lady Reading Hospital (LRH) access point' },
  { code: 'ST-07', name: 'Shoba Bazar', nameUrdu: 'شعبہ بازار', isInterchange: false, connectedRoutes: ['ML-01'], facilities: ['Zu Card Kiosk', 'Elevator'], locationSummary: 'Auto-market and rail corridor' },
  { code: 'ST-08', name: 'Railway Station', nameUrdu: 'ریلوے اسٹیشن', isInterchange: false, connectedRoutes: ['ML-01'], facilities: ['Zu Card Kiosk', 'Elevator', 'Inter-city Rail Transfer'], locationSummary: 'Peshawar Cantonment Railway Station' },
  { code: 'ST-09', name: 'Saddar Cantt', nameUrdu: 'صدر کینٹ', isInterchange: true, connectedRoutes: ['ML-01', 'ER-01', 'F-03'], facilities: ['Zu Card Kiosk', 'Customer Service', 'Elevator', 'ATM', 'Wheelchair Ramp'], locationSummary: 'Core commercial hub, shopping district and cantonment' },
  { code: 'ST-10', name: 'Tehkal Payan', nameUrdu: 'تہکال پایاں', isInterchange: false, connectedRoutes: ['ML-01'], facilities: ['Zu Card Kiosk', 'Wheelchair Ramp'], locationSummary: 'Jamrud Road, Tehkal' },
  { code: 'ST-11', name: 'Tehkal Bala', nameUrdu: 'تہکال بالا', isInterchange: false, connectedRoutes: ['ML-01'], facilities: ['Zu Card Kiosk', 'Elevator'], locationSummary: 'Upper Tehkal residential & markets' },
  { code: 'ST-12', name: 'University Town', nameUrdu: 'یونیورسٹی ٹاؤن', isInterchange: false, connectedRoutes: ['ML-01', 'ER-01'], facilities: ['Zu Card Kiosk', 'Elevator', 'Wheelchair Ramp'], locationSummary: 'Jamrud Road opposite Town Club' },
  { code: 'ST-13', name: 'University of Peshawar', nameUrdu: 'پشاور یونیورسٹی', isInterchange: true, connectedRoutes: ['ML-01', 'ER-01'], facilities: ['Zu Card Kiosk', 'Elevator', 'Student Service Counter', 'Restrooms'], locationSummary: 'Academic zone: UoP, UET, Khyber Medical College' },
  { code: 'ST-14', name: 'Islamia College', nameUrdu: 'اسلامیہ کالج', isInterchange: false, connectedRoutes: ['ML-01'], facilities: ['Zu Card Kiosk', 'Elevator'], locationSummary: 'Historical Islamia College campus' },
  { code: 'ST-15', name: 'Board Bazar', nameUrdu: 'بورڈ بازار', isInterchange: false, connectedRoutes: ['ML-01', 'ER-01'], facilities: ['Zu Card Kiosk', 'Elevator', 'High-Traffic Concourse'], locationSummary: 'Major suburban transit and shopping center' },
  { code: 'ST-16', name: 'Bab-e-Peshawar', nameUrdu: 'باب پشاور', isInterchange: false, connectedRoutes: ['ML-01'], facilities: ['Zu Card Kiosk', 'Elevator', 'Flyover Hub'], locationSummary: 'Ring Road Jamrud Junction flyover' },
  { code: 'ST-17', name: 'Phase 3 Chowk', nameUrdu: 'فیز ۳ چوک', isInterchange: true, connectedRoutes: ['ML-01', 'F-01'], facilities: ['Zu Card Kiosk', 'Elevator', 'Feeder Transfer'], locationSummary: 'Entrance to Hayatabad Township' },
  { code: 'ST-18', name: 'Mall of Hayatabad', nameUrdu: 'مال آف حیات آباد', isInterchange: true, connectedRoutes: ['ML-01', 'ER-01', 'F-01'], facilities: ['Zu Card Kiosk', 'Elevator', 'Commercial Plaza Transfer'], locationSummary: 'Hayatabad Phase 5 commercial center' },
  { code: 'ST-19', name: 'Karkhano Market', nameUrdu: 'کارخانو مارکیٹ', isInterchange: true, connectedRoutes: ['ML-01', 'ER-01'], facilities: ['Zu Card Kiosk', 'Terminal Depot', 'Elevator', 'Restrooms', 'Security Post'], locationSummary: 'Western terminus near Khyber Pass industrial gateway' }
];

const routesData = [
  {
    routeCode: 'ML-01',
    name: 'Main Line (Chamkani - Karkhano)',
    type: 'Main Line',
    description: 'The 27 km primary dedicated BRT corridor connecting eastern and western Peshawar across 31 modern elevated and at-grade stations.',
    startPoint: 'Chamkani Terminal',
    endPoint: 'Karkhano Market Terminal',
    color: '#008170',
    schedule: { firstBus: '06:00 AM', lastBus: '10:00 PM', peakFrequency: '2-3 mins', offPeakFrequency: '5-7 mins' },
    isDemoData: false,
    stations: stationsData.filter(s => s.connectedRoutes.includes('ML-01')).map((s, idx) => ({
      name: s.name,
      code: s.code,
      order: idx + 1,
      isInterchange: s.isInterchange
    }))
  },
  {
    routeCode: 'ER-01',
    name: 'Express Route 1 (Chamkani - Karkhano Direct)',
    type: 'Express',
    description: 'Limited-stop high-speed corridor serving major transit hubs: Chamkani, Hashtnagri, Malik Saad, Saddar, University, Board Bazar, Hayatabad, Karkhano.',
    startPoint: 'Chamkani Terminal',
    endPoint: 'Karkhano Market Terminal',
    color: '#e11d48',
    schedule: { firstBus: '06:30 AM', lastBus: '09:00 PM', peakFrequency: '6-8 mins', offPeakFrequency: '12-15 mins' },
    isDemoData: false,
    stations: stationsData.filter(s => s.connectedRoutes.includes('ER-01')).map((s, idx) => ({
      name: s.name,
      code: s.code,
      order: idx + 1,
      isInterchange: true
    }))
  },
  {
    routeCode: 'F-01',
    name: 'Feeder Route 1 (Hayatabad Circular)',
    type: 'Feeder',
    description: 'Direct feeder buses connecting Hayatabad Phase 1 through Phase 7 residential sectors with Mall of Hayatabad and Phase 3 BRT stations.',
    startPoint: 'Phase 3 Chowk',
    endPoint: 'Phase 7 Sector E',
    color: '#f59e0b',
    schedule: { firstBus: '06:15 AM', lastBus: '09:30 PM', peakFrequency: '8-10 mins', offPeakFrequency: '15 mins' },
    isDemoData: false,
    stations: [
      { name: 'Phase 3 Chowk', code: 'ST-17', order: 1, isInterchange: true },
      { name: 'Phase 1 Sector B', code: 'F1-02', order: 2, isInterchange: false },
      { name: 'Phase 2 Commercial', code: 'F1-03', order: 3, isInterchange: false },
      { name: 'Mall of Hayatabad', code: 'ST-18', order: 4, isInterchange: true },
      { name: 'Phase 4 Hospital', code: 'F1-05', order: 5, isInterchange: false },
      { name: 'Phase 7 Terminal', code: 'F1-06', order: 6, isInterchange: false }
    ]
  },
  {
    routeCode: 'F-02',
    name: 'Feeder Route 2 (Ring Road Connector)',
    type: 'Feeder',
    description: 'Connects Chamkani Station with Malik Saad Shaheed via Southern Ring Road and Charsadda Road.',
    startPoint: 'Chamkani',
    endPoint: 'Malik Saad Shaheed',
    color: '#0284c7',
    schedule: { firstBus: '06:30 AM', lastBus: '09:00 PM', peakFrequency: '10-12 mins', offPeakFrequency: '20 mins' },
    isDemoData: false,
    stations: [
      { name: 'Chamkani', code: 'ST-01', order: 1, isInterchange: true },
      { name: 'Paharipura Ring Road', code: 'F2-02', order: 2, isInterchange: false },
      { name: 'Charsadda Road Interchange', code: 'F2-03', order: 3, isInterchange: false },
      { name: 'Malik Saad Shaheed', code: 'ST-05', order: 4, isInterchange: true }
    ]
  },
  {
    routeCode: 'F-03',
    name: 'Feeder Route 3 (Bara Road to Cantt)',
    type: 'Feeder',
    description: 'Serves commuters traveling between Bara Road commercial fringe, Kohat Gate, and Saddar Cantt BRT station.',
    startPoint: 'Bara Gate',
    endPoint: 'Saddar Cantt',
    color: '#8b5cf6',
    schedule: { firstBus: '07:00 AM', lastBus: '08:30 PM', peakFrequency: '12-15 mins', offPeakFrequency: '25 mins' },
    isDemoData: true,
    stations: [
      { name: 'Bara Gate', code: 'F3-01', order: 1, isInterchange: false },
      { name: 'Kohat Road Crossing', code: 'F3-02', order: 2, isInterchange: false },
      { name: 'Saddar Cantt', code: 'ST-09', order: 3, isInterchange: true }
    ]
  }
];

async function seedDatabase(force = false) {
  try {
    const routeCount = await Route.countDocuments();
    if (routeCount > 0 && !force) {
      console.log('[Seed] Database already contains data. Skipping seeder.');
      return;
    }

    console.log('[Seed] Seeding database with Peshawar BRT transit data...');

    // Clear existing
    if (force) {
      await Promise.all([
        User.deleteMany({}),
        Route.deleteMany({}),
        Station.deleteMany({}),
        Alert.deleteMany({}),
        Report.deleteMany({})
      ]);
      console.log('[Seed] Cleared existing records.');
    }

    // 1. Seed Administrator Account from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@brtdost.pk';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || 'AdminBRT2026!';
    
    let adminUser = await User.findOne({ $or: [{ email: adminEmail.toLowerCase() }, { username: adminUsername.toLowerCase() }] });
    if (!adminUser) {
      adminUser = new User({
        username: adminUsername.toLowerCase(),
        email: adminEmail.toLowerCase(),
        password: defaultPassword,
        fullName: 'Chief Transit Moderator',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
      console.log(`[Seed] Initialized administrator: ${adminUsername} (${adminEmail})`);
    } else {
      console.log(`[Seed] Administrator account (${adminUsername}) already exists.`);
    }

    // 2. Seed Stations
    const stations = await Station.insertMany(stationsData);
    console.log(`[Seed] Seeded ${stations.length} Peshawar BRT stations.`);

    // 3. Seed Routes
    const routes = await Route.insertMany(routesData);
    console.log(`[Seed] Seeded ${routes.length} BRT routes.`);

    // 4. Seed Demonstrative Alerts illustrating all Trust & Freshness States
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const sevenHoursAgo = new Date(now.getTime() - 7 * 60 * 60 * 1000); // Exceeds default 4hr threshold -> Stale!

    const sampleAlerts = [
      {
        title: 'Regular Peak Operations Across Main Line',
        description: 'All 31 stations along the Chamkani to Karkhano main corridor are operating at 3-minute peak headways. Turnstiles and ticket kiosks fully operational.',
        severity: 'info',
        routeCode: 'ML-01',
        routeName: 'Main Line (Chamkani - Karkhano)',
        stationName: 'Network-wide',
        source: 'TransPeshawar Control Room (Official Operations)',
        sourceType: 'official_feed',
        verificationStatus: 'official',
        status: 'active',
        publishedAt: oneHourAgo,
        lastConfirmedAt: oneHourAgo,
        freshnessHours: 4,
        isDemoData: false,
        createdBy: adminUser._id
      },
      {
        title: 'High Passenger Inflow at Saddar Cantt Concourse',
        description: 'Heavy evening passenger surge observed at Saddar Cantt station. Extra security personnel deployed to assist passenger boarding.',
        severity: 'warning',
        routeCode: 'ML-01',
        routeName: 'Main Line (Chamkani - Karkhano)',
        stationName: 'Saddar Cantt',
        source: 'BRT Dost Moderator (Station Supervisor Check)',
        sourceType: 'admin_verified',
        verificationStatus: 'verified',
        status: 'active',
        publishedAt: sevenHoursAgo,
        lastConfirmedAt: sevenHoursAgo, // Freshness window is 4h, so 7h ago means STALE!
        freshnessHours: 4,
        isDemoData: true,
        createdBy: adminUser._id
      },
      {
        title: 'Feeder 2 Route Diversion near Ring Road Works',
        description: 'Due to road carpeting near Paharipura junction, Feeder 2 buses are temporarily rerouted via northern access road. Expect 5-8 min delay.',
        severity: 'warning',
        routeCode: 'F-02',
        routeName: 'Feeder Route 2 (Ring Road Connector)',
        stationName: 'Paharipura Ring Road',
        source: 'Traffic Police Peshawar & Transit Admin',
        sourceType: 'admin_verified',
        verificationStatus: 'verified',
        status: 'active',
        publishedAt: oneHourAgo,
        lastConfirmedAt: oneHourAgo,
        freshnessHours: 4,
        isDemoData: true,
        createdBy: adminUser._id
      }
    ];

    await Alert.insertMany(sampleAlerts);
    console.log(`[Seed] Seeded ${sampleAlerts.length} initial service announcements showcasing Verified and Stale states.`);

    // 5. Seed Initial Passenger Reports demonstrating Pending, Verified, and Conflicted states
    const sampleReports = [
      {
        routeCode: 'ML-01',
        routeName: 'Main Line (Chamkani - Karkhano)',
        stationName: 'Board Bazar',
        category: 'Station Infrastructure',
        description: 'Ticket vending machine #2 on the westbound concourse is not accepting 100 Rs notes.',
        passengerContact: 'passenger1@test.pk',
        moderationStatus: 'pending',
        isConflict: false
      },
      {
        routeCode: 'ML-01',
        routeName: 'Main Line (Chamkani - Karkhano)',
        stationName: 'Malik Saad Shaheed',
        category: 'Delay',
        description: 'Buses heading towards Karkhano are taking 12 minutes between departures at Malik Saad.',
        passengerContact: '0300-1234567',
        moderationStatus: 'conflict_flagged',
        isConflict: true,
        conflictReason: 'Contradicts active control room update of 3-min headway. Flagged for verification.'
      },
      {
        routeCode: 'F-01',
        routeName: 'Feeder Route 1 (Hayatabad Circular)',
        stationName: 'Phase 3 Chowk',
        category: 'AC / Climate Control',
        description: 'AC was blowing lukewarm air on bus registration PZ-881 around 4:30 PM.',
        passengerContact: '',
        moderationStatus: 'verified',
        moderationNotes: 'Report confirmed by maintenance depot supervisor. Bus routed to depot for air-con servicing.',
        reviewedBy: adminUser._id,
        reviewedAt: oneHourAgo,
        isConflict: false
      }
    ];

    await Report.insertMany(sampleReports);
    console.log(`[Seed] Seeded ${sampleReports.length} passenger reports illustrating Pending, Conflicted, and Verified moderation states.`);

    console.log('[Seed] Database seeding completed successfully!');
  } catch (err) {
    console.error(`[Seed] Seeding failed: ${err.message}`, err);
  }
}

// Support running directly: node src/utils/seed.js
if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
  const { connectDB, disconnectDB } = require('../config/db');

  (async () => {
    await connectDB();
    await seedDatabase(true);
    await disconnectDB();
    process.exit(0);
  })();
}

module.exports = { seedDatabase };
