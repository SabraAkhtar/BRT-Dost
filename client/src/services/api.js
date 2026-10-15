import axios from 'axios';

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '/api';

// Strip trailing slash if present to prevent double-slash API routes
const apiBaseUrl = rawBaseUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Bearer token to admin requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('brt_dost_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor to handle session expiration
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on a protected endpoint, clear stale token
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        localStorage.removeItem('brt_dost_token');
        localStorage.removeItem('brt_dost_user');
      }
    }
    return Promise.reject(error);
  }
);

// Built-in Peshawar Transit Directory (used as resilient fallback when live API server is waking up or offline)
export const FALLBACK_STATIONS = [
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
  { code: 'ST-19', name: 'Karkhano Market', nameUrdu: 'کارخانو مارکیٹ', isInterchange: true, connectedRoutes: ['ML-01', 'ER-01'], facilities: ['Zu Card Kiosk', 'Terminal Depot', 'Elevator', 'Restrooms', 'Security Post'], locationSummary: 'Western terminus near Khyber Pass industrial gateway' },
  { code: 'ST-20', name: 'Wazir Colony (Feeder Stop)', nameUrdu: 'وزیر کالونی', isInterchange: false, connectedRoutes: ['F-02', 'ML-01'], facilities: ['Bus Shelter', 'Wheelchair Ramp', 'Schedule Board'], locationSummary: 'Wazir Colony / Kohat Road feeder corridor connecting to Malik Saad Shaheed Station' }
];

export const FALLBACK_ROUTES = [
  {
    routeCode: 'ML-01',
    name: 'Main Line (Chamkani - Karkhano)',
    type: 'Main Line',
    description: 'The 27 km primary dedicated BRT corridor connecting eastern and western Peshawar across 31 modern elevated and at-grade stations.',
    startPoint: 'Chamkani Terminal',
    endPoint: 'Karkhano Market Terminal',
    color: '#008170',
    schedule: { firstBus: '06:00 AM', lastBus: '10:00 PM', peakFrequency: '2-3 mins', offPeakFrequency: '5-7 mins' },
    stations: FALLBACK_STATIONS.filter(s => s.connectedRoutes.includes('ML-01')).map((s, idx) => ({
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
    stations: FALLBACK_STATIONS.filter(s => s.connectedRoutes.includes('ER-01')).map((s, idx) => ({
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
    stations: [
      { name: 'Phase 3 Chowk', code: 'ST-17', order: 1, isInterchange: true },
      { name: 'Mall of Hayatabad', code: 'ST-18', order: 2, isInterchange: true }
    ]
  },
  {
    routeCode: 'F-02',
    name: 'Feeder Route 2 (Ring Road & Wazir Colony Connector)',
    type: 'Feeder',
    description: 'Connects Chamkani Station with Wazir Colony and Malik Saad Shaheed via Southern Ring Road link.',
    startPoint: 'Chamkani',
    endPoint: 'Malik Saad Shaheed',
    color: '#0284c7',
    schedule: { firstBus: '06:30 AM', lastBus: '09:00 PM', peakFrequency: '10-12 mins', offPeakFrequency: '20 mins' },
    stations: [
      { name: 'Chamkani', code: 'ST-01', order: 1, isInterchange: true },
      { name: 'Wazir Colony (Feeder Stop)', code: 'ST-20', order: 2, isInterchange: false },
      { name: 'Malik Saad Shaheed', code: 'ST-05', order: 3, isInterchange: true }
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
    stations: [
      { name: 'Bara Gate', code: 'F3-01', order: 1, isInterchange: false },
      { name: 'Saddar Cantt', code: 'ST-09', order: 2, isInterchange: true }
    ]
  }
];

// Public Routes & Stations API with Resilient Offline Fallback
export const getRoutes = async () => {
  try {
    const res = await api.get('/routes');
    if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    console.warn('[API] Connecting to live server, using directory fallback');
  }
  return { success: true, count: FALLBACK_ROUTES.length, data: FALLBACK_ROUTES };
};

export const getRouteByCode = async (code) => {
  try {
    const res = await api.get(`/routes/${code}`);
    if (res.data && res.data.success && res.data.data) {
      return res.data;
    }
  } catch (err) {
    console.warn('[API] Connecting to live server, using route fallback');
  }
  const found = FALLBACK_ROUTES.find(r => r.routeCode.toLowerCase() === (code || '').toLowerCase());
  return { success: !!found, data: found || null };
};

export const getStations = async (params = {}) => {
  try {
    const res = await api.get('/stations', { params });
    if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    console.warn('[API] Connecting to live server, using station directory fallback');
  }
  return { success: true, count: FALLBACK_STATIONS.length, data: FALLBACK_STATIONS };
};

// Public Alerts API
export const getAlerts = async (params = {}) => {
  const res = await api.get('/alerts', { params });
  return res.data;
};

export const getAlertById = async (id) => {
  const res = await api.get(`/alerts/${id}`);
  return res.data;
};

// Public Reports API
export const submitReport = async (reportData) => {
  const res = await api.post('/reports', reportData);
  return res.data;
};

export const getPublicReports = async (params = {}) => {
  const res = await api.get('/reports', { params });
  return res.data;
};

// Authentication API
export const loginAdmin = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};

export const getAuthMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const logoutAdmin = async () => {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // ignore network errors on logout
  }
  localStorage.removeItem('brt_dost_token');
  localStorage.removeItem('brt_dost_user');
};

// Protected Admin API
export const getAdminStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export const getAdminReports = async (params = {}) => {
  const res = await api.get('/admin/reports', { params });
  return res.data;
};

export const reviewReport = async (id, status, moderationNotes = '') => {
  const res = await api.patch(`/admin/reports/${id}/review`, { status, moderationNotes });
  return res.data;
};

export const promoteReportToAlert = async (id, data) => {
  const res = await api.post(`/admin/reports/${id}/promote`, data);
  return res.data;
};

export const getAdminAlerts = async (params = {}) => {
  const res = await api.get('/admin/alerts', { params });
  return res.data;
};

export const createAlert = async (alertData) => {
  const res = await api.post('/admin/alerts', alertData);
  return res.data;
};

export const updateAlert = async (id, alertData) => {
  const res = await api.patch(`/admin/alerts/${id}`, alertData);
  return res.data;
};

export const reconfirmAlert = async (id) => {
  const res = await api.post(`/admin/alerts/${id}/reconfirm`);
  return res.data;
};

export const withdrawAlert = async (id) => {
  const res = await api.post(`/admin/alerts/${id}/withdraw`);
  return res.data;
};

export default api;
