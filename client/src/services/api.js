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

// Public Routes & Stations API
export const getRoutes = async () => {
  const res = await api.get('/routes');
  return res.data;
};

export const getRouteByCode = async (code) => {
  const res = await api.get(`/routes/${code}`);
  return res.data;
};

export const getStations = async (params = {}) => {
  const res = await api.get('/stations', { params });
  return res.data;
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
