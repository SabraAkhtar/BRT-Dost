import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  RefreshCw,
  GitCompare,
  Trash2,
  FileText,
  Send,
  Eye,
  LogOut,
  MapPin,
  Tag,
  AlertCircle,
  Building,
  Edit,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminStats,
  getAdminReports,
  reviewReport,
  promoteReportToAlert,
  getAdminAlerts,
  createAlert,
  updateAlert,
  reconfirmAlert,
  withdrawAlert,
  getRoutes,
  getStations
} from '../services/api';
import TrustBadge from '../components/TrustBadge';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active section tab: 'reports', 'alerts', 'publish'
  const [currentTab, setCurrentTab] = useState('reports');
  const [reportFilter, setReportFilter] = useState('pending'); // 'pending', 'under review', 'conflict_flagged', 'verified', 'rejected', 'all'
  const [alertFilter, setAlertFilter] = useState('all'); // 'all', 'active', 'stale', 'expired', 'withdrawn', 'draft'
  const [searchTerm, setSearchTerm] = useState('');

  // Notification feedback
  const [toast, setToast] = useState(null);

  // Modals state
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewModalAction, setReviewModalAction] = useState(null); // 'review', 'reject', 'verify'
  const [moderationNotes, setModerationNotes] = useState('');

  // Promote Modal
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteSeverity, setPromoteSeverity] = useState('warning');
  const [promoteFreshnessHours, setPromoteFreshnessHours] = useState(4);
  const [promoteTitle, setPromoteTitle] = useState('');

  // Edit Alert Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    severity: 'info',
    routeCode: 'ALL',
    stationName: 'Network-wide',
    source: '',
    freshnessHours: 4,
    expiresInHours: 24,
    status: 'published'
  });

  // Withdraw Confirmation Modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [alertToWithdraw, setAlertToWithdraw] = useState(null);

  // Publish Alert Form state
  const [alertForm, setAlertForm] = useState({
    title: '',
    description: '',
    severity: 'info',
    routeCode: 'ALL',
    stationName: 'Network-wide',
    source: 'BRT Dost Operations Desk',
    sourceType: 'admin_verified',
    freshnessHours: 4,
    expiresInHours: 24,
    isDemoData: false
  });
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, alertsRes, routesRes, stationsRes] = await Promise.all([
        getAdminStats(),
        getAdminReports({ status: reportFilter }),
        getAdminAlerts({ status: alertFilter }),
        getRoutes(),
        getStations()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (reportsRes.success) setReports(reportsRes.data);
      if (alertsRes.success) setAlerts(alertsRes.data);
      if (routesRes.success) setRoutes(routesRes.data);
      if (stationsRes.success) setStations(stationsRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showToast('Error refreshing dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, reportFilter, alertFilter]);

  // Review Report Handler
  const handleReviewReport = async (reportId, status, notes = '') => {
    try {
      const res = await reviewReport(reportId, status, notes || moderationNotes);
      if (res.success) {
        showToast(`Report updated to "${status}" successfully`);
        setSelectedReport(null);
        setReviewModalAction(null);
        setModerationNotes('');
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Moderation action failed', 'error');
    }
  };

  // Promote Report to Alert
  const handlePromoteReport = async () => {
    if (!selectedReport) return;
    try {
      const res = await promoteReportToAlert(selectedReport._id, {
        title: promoteTitle || `${selectedReport.category} at ${selectedReport.stationName}`,
        severity: promoteSeverity,
        freshnessHours: promoteFreshnessHours
      });
      if (res.success) {
        showToast('Report verified and promoted to public service announcement!');
        setIsPromoteModalOpen(false);
        setSelectedReport(null);
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Promotion failed', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEditAlert = (alert) => {
    setEditingAlert(alert);
    setEditForm({
      title: alert.title || '',
      description: alert.description || '',
      severity: alert.severity || 'info',
      routeCode: alert.routeCode || 'ALL',
      stationName: alert.stationName || 'Network-wide',
      source: alert.source || 'BRT Dost Operations Desk',
      freshnessHours: alert.freshnessHours || 4,
      expiresInHours: alert.expiresAt ? Math.max(1, Math.round((new Date(alert.expiresAt) - Date.now()) / (1000 * 60 * 60))) : 24,
      status: alert.status || 'published'
    });
    setIsEditModalOpen(true);
  };

  // Save Edited Alert
  const handleSaveEditAlert = async (e) => {
    e.preventDefault();
    if (!editingAlert) return;
    try {
      const expiresAt = new Date(Date.now() + editForm.expiresInHours * 60 * 60 * 1000);
      const res = await updateAlert(editingAlert._id, {
        ...editForm,
        expiresAt
      });
      if (res.success) {
        showToast('Service advisory updated successfully');
        setIsEditModalOpen(false);
        setEditingAlert(null);
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update alert', 'error');
    }
  };

  // Re-confirm Alert Freshness
  const handleReconfirmAlert = async (alertId) => {
    try {
      const res = await reconfirmAlert(alertId);
      if (res.success) {
        showToast('Alert re-confirmed! Freshness window countdown has been reset.');
        loadDashboardData();
      }
    } catch (err) {
      showToast('Failed to re-confirm alert', 'error');
    }
  };

  // Withdraw Alert Confirmation
  const confirmWithdraw = async () => {
    if (!alertToWithdraw) return;
    try {
      const res = await withdrawAlert(alertToWithdraw._id);
      if (res.success) {
        showToast('Alert retracted and marked as withdrawn.');
        setIsWithdrawModalOpen(false);
        setAlertToWithdraw(null);
        loadDashboardData();
      }
    } catch (err) {
      showToast('Failed to withdraw alert', 'error');
    }
  };

  // Create Service Alert
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setPublishing(true);
    try {
      const expiresAt = new Date(Date.now() + alertForm.expiresInHours * 60 * 60 * 1000);
      const res = await createAlert({
        ...alertForm,
        expiresAt
      });
      if (res.success) {
        showToast('Service announcement published to public feed!');
        setAlertForm({
          title: '',
          description: '',
          severity: 'info',
          routeCode: 'ALL',
          stationName: 'Network-wide',
          source: 'BRT Dost Operations Desk',
          sourceType: 'admin_verified',
          freshnessHours: 4,
          expiresInHours: 24,
          isDemoData: false
        });
        setCurrentTab('alerts');
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish alert', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (authLoading) {
    return <div className="p-12 text-center text-slate-500">Checking credentials...</div>;
  }

  // Filter reports by local search
  const filteredReports = reports.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.routeCode?.toLowerCase().includes(q) ||
      r.stationName?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  // Filter alerts by local search
  const filteredAlerts = alerts.filter((a) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.routeCode?.toLowerCase().includes(q) ||
      a.stationName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl border text-sm flex items-center gap-2 max-w-md animate-slideUp ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : 'bg-slate-900 text-teal-300 border-teal-500/30'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-teal-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner / User Badge */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Authorized Operations Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Logged in as <strong className="text-white">{user?.username}</strong> ({user?.fullName}) • Role: <span className="capitalize text-teal-300">{user?.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/15 text-white px-3.5 py-2.5 rounded-xl border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Stats</span>
          </button>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Reports</span>
          <div className="text-2xl font-black text-amber-600">{stats?.pendingReports ?? 0}</div>
          <span className="text-[10px] text-slate-400">Requires review</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Conflict Flags</span>
          <div className="text-2xl font-black text-purple-600">{stats?.conflictReports ?? 0}</div>
          <span className="text-[10px] text-slate-400">Contradictory data</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Verified Reports</span>
          <div className="text-2xl font-black text-emerald-600">{stats?.verifiedReports ?? 0}</div>
          <span className="text-[10px] text-slate-400">Approved by staff</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Active Alerts</span>
          <div className="text-2xl font-black text-teal-700">{stats?.activeAlerts ?? 0}</div>
          <span className="text-[10px] text-slate-400">Published live</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Stale Alerts</span>
          <div className="text-2xl font-black text-rose-600">{stats?.staleAlerts ?? 0}</div>
          <span className="text-[10px] text-slate-400">&gt;4h unconfirmed</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Total Lines</span>
          <div className="text-2xl font-black text-slate-800">{stats?.totalRoutes ?? 5}</div>
          <span className="text-[10px] text-slate-400">Monitored corridors</span>
        </div>
      </div>

      {/* Dashboard Section Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setCurrentTab('reports');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              currentTab === 'reports'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Passenger Moderation Queue ({reports.length})
          </button>

          <button
            onClick={() => {
              setCurrentTab('alerts');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              currentTab === 'alerts'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Service Announcements Desk ({alerts.length})
          </button>

          <button
            onClick={() => setCurrentTab('publish')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'publish'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish New Service Alert</span>
          </button>
        </div>

        {/* Search within section */}
        {currentTab !== 'publish' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={`Filter ${currentTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
        )}
      </div>

      {/* SECTION 1: Moderation Queue */}
      {currentTab === 'reports' && (
        <div className="space-y-4">
          {/* Sub-filter pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-semibold mr-1">Status Filter:</span>
              {[
                { key: 'pending', label: 'Pending Review' },
                { key: 'under review', label: 'Under Review' },
                { key: 'conflict_flagged', label: 'Conflict Flagged' },
                { key: 'verified', label: 'Verified' },
                { key: 'rejected', label: 'Rejected' },
                { key: 'all', label: 'All Reports' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setReportFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    reportFilter === f.key
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500">
              Showing {filteredReports.length} report(s)
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-800">Moderation Queue Clear</p>
              <p className="text-xs text-slate-500">No reports matching the "{reportFilter}" status filter.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Route / Station</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5">Contact (Private)</th>
                      <th className="p-3.5">Submitted</th>
                      <th className="p-3.5 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReports.map((report) => (
                      <tr key={report._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 whitespace-nowrap">
                          <TrustBadge
                            state={report.isConflict ? 'CONFLICT_FLAGGED' : (report.trust?.state || report.moderationStatus)}
                            label={report.trust?.label || report.moderationStatus}
                            size="sm"
                          />
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{report.routeCode}</div>
                          <div className="text-slate-500 text-[11px]">{report.stationName}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-medium text-slate-700">
                          {report.category}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <p className="line-clamp-2 text-slate-700">{report.description}</p>
                          {report.isConflict && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              Conflict: {report.conflictReason || 'Mismatch with active reports'}
                            </span>
                          )}
                          {report.moderationNotes && (
                            <span className="block mt-1 text-[10px] text-slate-400 italic">
                              Note: {report.moderationNotes}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {report.passengerContact || <span className="text-slate-400 italic">None</span>}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                          {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <div className="text-slate-400">{new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                          {/* Mark Under Review */}
                          {report.moderationStatus === 'pending' && (
                            <button
                              onClick={() => handleReviewReport(report._id, 'under review', 'Assigned to field staff for investigation')}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[11px]"
                              title="Mark as under review"
                            >
                              Under Review
                            </button>
                          )}

                          {/* Verify & Promote */}
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setPromoteTitle(`${report.category} reported at ${report.stationName}`);
                              setIsPromoteModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold text-[11px] shadow-xs"
                            title="Verify and publish as public alert"
                          >
                            Verify & Promote
                          </button>

                          {/* Verify without alert */}
                          {report.moderationStatus !== 'verified' && (
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setReviewModalAction('verify');
                              }}
                              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-semibold text-[11px]"
                              title="Mark verified without creating alert"
                            >
                              Verify
                            </button>
                          )}

                          {/* Reject */}
                          {report.moderationStatus !== 'rejected' && (
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setReviewModalAction('reject');
                              }}
                              className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-semibold text-[11px]"
                              title="Reject submission"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Service Announcements Desk */}
      {currentTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-semibold mr-1">Alerts Filter:</span>
              {[
                { key: 'all', label: 'All Bulletins' },
                { key: 'active', label: 'Active & Fresh' },
                { key: 'stale', label: 'Stale (>4h)' },
                { key: 'expired', label: 'Expired' },
                { key: 'withdrawn', label: 'Withdrawn' },
                { key: 'draft', label: 'Drafts' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAlertFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    alertFilter === f.key
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentTab('publish')}
              className="self-start sm:self-auto px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Publish Advisory</span>
            </button>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              No service announcements found matching "{alertFilter}".
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Trust Freshness</th>
                      <th className="p-3.5">Corridor / Station</th>
                      <th className="p-3.5">Headline & Source</th>
                      <th className="p-3.5">Severity</th>
                      <th className="p-3.5">Validity / Expiry</th>
                      <th className="p-3.5">Record Type</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAlerts.map((alert) => {
                      const freshness = alert.freshness || {};
                      const isStale = freshness.state === 'STALE';
                      const isExpired = alert.status === 'expired' || freshness.state === 'EXPIRED';
                      const isWithdrawn = alert.status === 'withdrawn' || freshness.state === 'WITHDRAWN';
                      const isHistorical = isExpired || isWithdrawn;

                      return (
                        <tr
                          key={alert._id}
                          className={`transition-colors ${
                            isHistorical ? 'bg-slate-50/50 opacity-80' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="p-3.5 whitespace-nowrap">
                            <TrustBadge
                              state={freshness.state || alert.status}
                              label={freshness.label || alert.status}
                              size="sm"
                            />
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-slate-900">{alert.routeCode}</span>
                            <div className="text-slate-500 text-[11px]">{alert.stationName || 'Network-wide'}</div>
                          </td>
                          <td className="p-3.5 max-w-sm">
                            <div className="font-bold text-slate-900">{alert.title}</div>
                            <div className="text-slate-500 text-[11px] truncate">{alert.description}</div>
                            <div className="text-slate-400 text-[10px] mt-0.5">
                              Source: <strong className="text-slate-600">{alert.source}</strong>
                            </div>
                            {alert.isDemoData && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                                Demo Data
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="capitalize font-semibold text-slate-700">
                              {alert.severity}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-slate-600 text-[11px]">
                            {alert.expiresAt ? (
                              <div>
                                <span className={isExpired ? 'text-rose-600 font-semibold' : ''}>
                                  Until: {new Date(alert.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className="text-slate-400">
                                  {new Date(alert.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">No expiration set</span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isHistorical
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isHistorical ? 'Historical' : 'Current Live'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                            {/* Edit Alert */}
                            <button
                              onClick={() => handleOpenEditAlert(alert)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                              title="Edit alert content"
                            >
                              <Edit className="w-3 h-3 inline mr-0.5" />
                              Edit
                            </button>

                            {/* Re-confirm Freshness */}
                            {!isHistorical && (
                              <button
                                onClick={() => handleReconfirmAlert(alert._id)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded font-semibold text-[11px] shadow-xs"
                                title="Reset freshness countdown timer"
                              >
                                Re-confirm
                              </button>
                            )}

                            {/* Withdraw Alert */}
                            {!isWithdrawn && (
                              <button
                                onClick={() => {
                                  setAlertToWithdraw(alert);
                                  setIsWithdrawModalOpen(true);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 rounded font-semibold text-[11px]"
                                title="Withdraw notice"
                              >
                                Withdraw
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Publish New Service Alert */}
      {currentTab === 'publish' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 max-w-3xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              Publish Verified Service Announcement
            </h2>
            <p className="text-xs text-slate-500">
              Published announcements immediately feed into the Trust & Freshness Engine for public commuters.
            </p>
          </div>

          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Route */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  BRT Route *
                </label>
                <select
                  value={alertForm.routeCode}
                  onChange={(e) => setAlertForm({ ...alertForm, routeCode: e.target.value })}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-white"
                >
                  <option value="ALL">Entire Peshawar BRT Network</option>
                  {routes.map((r) => (
                    <option key={r.routeCode} value={r.routeCode}>
                      {r.routeCode} — {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Station */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Station
                </label>
                <select
                  value={alertForm.stationName}
                  onChange={(e) => setAlertForm({ ...alertForm, stationName: e.target.value })}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-white"
                >
                  <option value="Network-wide">Network-wide / General</option>
                  {stations.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Severity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Advisory Severity *
                </label>
                <select
                  value={alertForm.severity}
                  onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-white"
                >
                  <option value="info">Informational (Normal Operations Confirmed)</option>
                  <option value="warning">Warning / Advisory (Delay / Crowding)</option>
                  <option value="disruption">Service Disruption (Diversion / Major Breakdown)</option>
                  <option value="closure">Corridor Closure / Station Outage</option>
                </select>
              </div>

              {/* Freshness Window (Hours) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Freshness Window (Hours before Stale) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={alertForm.freshnessHours}
                  onChange={(e) => setAlertForm({ ...alertForm, freshnessHours: parseInt(e.target.value, 10) || 4 })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400">
                  After this period without re-confirmation, system flags announcement as Stale.
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Announcement Headline *
              </label>
              <input
                type="text"
                placeholder="e.g. Regular 3-Minute Headway Across Main Line"
                value={alertForm.title}
                onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Advisory Details & Guidance *
              </label>
              <textarea
                rows={3}
                placeholder="Detailed explanation for passengers..."
                value={alertForm.description}
                onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                required
              />
            </div>

            {/* Source Attribution */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Source Attribution (Required for Trust Transparency) *
              </label>
              <input
                type="text"
                placeholder="e.g. TransPeshawar Control Room (Chief Dispatcher)"
                value={alertForm.source}
                onChange={(e) => setAlertForm({ ...alertForm, source: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                required
              />
            </div>

            {/* Demo Data Flag */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isDemoCheck"
                checked={alertForm.isDemoData}
                onChange={(e) => setAlertForm({ ...alertForm, isDemoData: e.target.checked })}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isDemoCheck" className="text-xs text-slate-700 font-medium">
                Label visibly as <strong>Demo / Test Data</strong> (Adheres to honest presentation principle)
              </label>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="submit"
                disabled={publishing}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Publish Announcement'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('alerts')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1: Promote Report to Alert */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title="Promote Passenger Report to Public Alert"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Converting passenger report from <strong>{selectedReport?.stationName}</strong> on <strong>{selectedReport?.routeCode}</strong> into a verified announcement.
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 italic">
            "{selectedReport?.description}"
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Public Alert Title
            </label>
            <input
              type="text"
              value={promoteTitle}
              onChange={(e) => setPromoteTitle(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Severity
              </label>
              <select
                value={promoteSeverity}
                onChange={(e) => setPromoteSeverity(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              >
                <option value="warning">Warning / Delay</option>
                <option value="disruption">Disruption</option>
                <option value="info">Informational</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Freshness (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={promoteFreshnessHours}
                onChange={(e) => setPromoteFreshnessHours(parseInt(e.target.value, 10) || 4)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setIsPromoteModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handlePromoteReport}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Confirm & Publish Alert
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Report Moderation (Verify or Reject with Note) */}
      <Modal
        isOpen={!!reviewModalAction}
        onClose={() => {
          setReviewModalAction(null);
          setSelectedReport(null);
          setModerationNotes('');
        }}
        title={reviewModalAction === 'reject' ? 'Reject Passenger Report' : 'Verify Passenger Report'}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            {reviewModalAction === 'reject' ? (
              <span>Are you sure you want to reject this passenger report? It will be marked as invalid/inappropriate.</span>
            ) : (
              <span>Mark this report as verified by transit administration.</span>
            )}
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 italic">
            "{selectedReport?.description}"
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Internal Moderation Note {reviewModalAction === 'reject' ? '(Recommended)' : '(Optional)'}
            </label>
            <textarea
              rows={2}
              placeholder={reviewModalAction === 'reject' ? 'Reason for rejection (e.g., Duplicate, Unverifiable, Inappropriate)...' : 'Internal notes on verification...'}
              value={moderationNotes}
              onChange={(e) => setModerationNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setReviewModalAction(null);
                setSelectedReport(null);
                setModerationNotes('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => handleReviewReport(selectedReport?._id, reviewModalAction === 'reject' ? 'rejected' : 'verified')}
              className={`px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm ${
                reviewModalAction === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Confirm {reviewModalAction === 'reject' ? 'Rejection' : 'Verification'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Edit Alert Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAlert(null);
        }}
        title="Edit Service Announcement"
      >
        <form onSubmit={handleSaveEditAlert} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Headline *
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Advisory Details *
            </label>
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Route Corridor
              </label>
              <select
                value={editForm.routeCode}
                onChange={(e) => setEditForm({ ...editForm, routeCode: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              >
                <option value="ALL">Entire BRT Network</option>
                {routes.map((r) => (
                  <option key={r.routeCode} value={r.routeCode}>
                    {r.routeCode} ({r.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Severity
              </label>
              <select
                value={editForm.severity}
                onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              >
                <option value="info">Informational</option>
                <option value="warning">Warning / Advisory</option>
                <option value="disruption">Service Disruption</option>
                <option value="closure">Corridor Closure</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Source Attribution
            </label>
            <input
              type="text"
              value={editForm.source}
              onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingAlert(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Withdraw Confirmation Dialog */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => {
          setIsWithdrawModalOpen(false);
          setAlertToWithdraw(null);
        }}
        title="Withdraw Service Advisory"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-rose-600 text-sm font-bold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Confirm Advisory Withdrawal</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to withdraw <strong>"{alertToWithdraw?.title}"</strong>?
            This will immediately remove the advisory from the public active announcements feed.
            An audit record preserving the withdrawal timestamp will be retained.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsWithdrawModalOpen(false);
                setAlertToWithdraw(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Keep Active
            </button>
            <button
              type="button"
              onClick={confirmWithdraw}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Confirm Withdrawal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
