import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  HelpCircle,
  MapPin,
  RefreshCw,
  Info
} from 'lucide-react';
import { getRoutes, getAlerts, getPublicReports, getStations } from '../services/api';
import AlertCard from '../components/AlertCard';
import ReportCard from '../components/ReportCard';
import TrustBadge from '../components/TrustBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

export default function StatusPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParam = searchParams.get('route') || 'all';
  const stationParam = searchParams.get('station') || '';
  const queryParam = searchParams.get('q') || '';

  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedRoute, setSelectedRoute] = useState(routeParam);
  const [selectedStation, setSelectedStation] = useState(stationParam);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'alerts', 'reports'

  useEffect(() => {
    setSelectedRoute(searchParams.get('route') || 'all');
    setSelectedStation(searchParams.get('station') || '');
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [routesRes, stationsRes, alertsRes, reportsRes] = await Promise.all([
        getRoutes(),
        getStations(),
        getAlerts(),
        getPublicReports({ limit: 50 })
      ]);

      if (routesRes.success) setRoutes(routesRes.data || []);
      if (stationsRes.success) setStations(stationsRes.data || []);
      if (alertsRes.success) setAlerts(alertsRes.data || []);
      if (reportsRes.success) setReports(reportsRes.data || []);
    } catch (err) {
      console.error('Error loading status data:', err);
      setError('Unable to load real-time service updates from the BRT server. Please check your internet connection or verify the server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (newRoute, newStation) => {
    const params = {};
    if (newRoute && newRoute !== 'all') params.route = newRoute;
    if (newStation) params.station = newStation;
    if (searchQuery) params.q = searchQuery;
    setSearchParams(params);
  };

  // Filter calculations
  const filteredAlerts = alerts.filter((alert) => {
    // Route match
    if (selectedRoute !== 'all') {
      if (alert.routeCode !== selectedRoute && alert.routeCode !== 'ALL') return false;
    }
    // Station match
    if (selectedStation) {
      if (alert.stationName && alert.stationName !== 'Network-wide' && !alert.stationName.toLowerCase().includes(selectedStation.toLowerCase())) {
        return false;
      }
    }
    // Keyword search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = alert.title.toLowerCase().includes(q);
      const matchDesc = alert.description.toLowerCase().includes(q);
      const matchSource = alert.source.toLowerCase().includes(q);
      const matchStation = alert.stationName && alert.stationName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchSource && !matchStation) return false;
    }
    return true;
  });

  const filteredReports = reports.filter((report) => {
    if (selectedRoute !== 'all') {
      if (report.routeCode !== selectedRoute) return false;
    }
    if (selectedStation) {
      if (!report.stationName.toLowerCase().includes(selectedStation.toLowerCase())) {
        return false;
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCat = report.category.toLowerCase().includes(q);
      const matchDesc = report.description.toLowerCase().includes(q);
      const matchStation = report.stationName.toLowerCase().includes(q);
      if (!matchCat && !matchDesc && !matchStation) return false;
    }
    return true;
  });

  // Selected route metadata & trust status
  const currentRouteDoc = selectedRoute !== 'all' ? routes.find((r) => r.routeCode === selectedRoute) : null;
  const currentTrust = currentRouteDoc?.trustStatus;

  // Partition active announcements from expired/archived notices
  const activeAlerts = filteredAlerts.filter(
    (a) => a.freshness?.state !== 'EXPIRED' && a.freshness?.state !== 'WITHDRAWN' && a.status === 'active'
  );
  const archivedAlerts = filteredAlerts.filter(
    (a) => a.freshness?.state === 'EXPIRED' || a.freshness?.state === 'WITHDRAWN' || a.status === 'expired' || a.status === 'withdrawn'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Peshawar BRT Transport Verification</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Check Service Status
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time verification breakdown for routes, stations, and passenger activity
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Updates</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Route filter */}
          <div>
            <label htmlFor="status-route-filter" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select BRT Route
            </label>
            <select
              id="status-route-filter"
              value={selectedRoute}
              onChange={(e) => {
                setSelectedRoute(e.target.value);
                handleFilterChange(e.target.value, selectedStation);
              }}
              className="w-full text-sm font-medium rounded-xl border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All BRT Lines (Network-wide)</option>
              {routes.map((r) => (
                <option key={r.routeCode} value={r.routeCode}>
                  {r.routeCode} — {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Station filter */}
          <div>
            <label htmlFor="status-station-filter" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Filter by Station
            </label>
            <select
              id="status-station-filter"
              value={selectedStation}
              onChange={(e) => {
                setSelectedStation(e.target.value);
                handleFilterChange(selectedRoute, e.target.value);
              }}
              className="w-full text-sm font-medium rounded-xl border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">All Stations</option>
              {stations.map((stn) => (
                <option key={stn.code} value={stn.name}>
                  {stn.name} ({stn.nameUrdu || stn.code})
                </option>
              ))}
            </select>
          </div>

          {/* Keyword search */}
          <div>
            <label htmlFor="status-keyword-search" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                id="status-keyword-search"
                type="text"
                placeholder="Search issue, disruption, keyword..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange(selectedRoute, selectedStation);
                }}
                className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Quick clear pills */}
        {(selectedRoute !== 'all' || selectedStation || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Active Filters:</span>
            {selectedRoute !== 'all' && (
              <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full font-semibold">
                Route: {selectedRoute}
              </span>
            )}
            {selectedStation && (
              <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full font-semibold">
                Station: {selectedStation}
              </span>
            )}
            {searchQuery && (
              <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full font-semibold">
                "{searchQuery}"
              </span>
            )}
            <button
              onClick={() => {
                setSelectedRoute('all');
                setSelectedStation('');
                setSearchQuery('');
                setSearchParams({});
              }}
              className="text-rose-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Route Trust Diagnostic Panel (if specific route is chosen) */}
      {currentRouteDoc && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg bg-slate-900 text-white px-3 py-1 rounded-md">
                  {currentRouteDoc.routeCode}
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  {currentRouteDoc.name}
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Corridor: {currentRouteDoc.startPoint} &rarr; {currentRouteDoc.endPoint} • Peak Headway: {currentRouteDoc.schedule?.peakFrequency}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <TrustBadge
                state={currentTrust?.code}
                label={currentTrust?.label || currentTrust?.badge}
              />
              <span className="text-xs text-slate-500 mt-1">
                Evaluation: {currentTrust?.badge} {currentTrust?.elapsedHuman ? `(${currentTrust.elapsedHuman})` : ''}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <div className="font-semibold text-slate-900 mb-0.5">Freshness Engine Diagnostic:</div>
            {currentTrust?.description || 'No recent verification record. System maintains honest Unknown status until transit staff confirms operational conditions.'}
          </div>
        </div>
      )}

      {/* Tabs: All / Verified Announcements / Passenger Reports */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Activity ({activeAlerts.length + filteredReports.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Verified Announcements ({activeAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Passenger Reports ({filteredReports.length})
        </button>
      </div>

      {/* Main Content Feed */}
      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : loading ? (
        <LoadingSkeleton type="cards" count={3} />
      ) : (
        <div className="space-y-8">
          {/* Section: Verified Announcements */}
          {(activeTab === 'all' || activeTab === 'alerts') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Active Service Announcements ({activeAlerts.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  Confirmed by authorized transit desk
                </span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    No active service alerts for this selection.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    In accordance with BRT Dost policy, we do not present an unconfirmed line as "Operational" without active confirmation. Status remains <span className="font-semibold text-slate-700">Unknown</span>.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAlerts.map((alert) => (
                    <AlertCard key={alert._id} alert={alert} />
                  ))}
                </div>
              )}

              {/* Archived / Expired Alerts subsection if any */}
              {archivedAlerts.length > 0 && (
                <div className="pt-4 mt-6 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>Archived & Expired Bulletins ({archivedAlerts.length})</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Retained for audit transparency. These advisories have passed their expiration or have been withdrawn.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {archivedAlerts.map((alert) => (
                      <AlertCard key={alert._id} alert={alert} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Passenger Reports */}
          {(activeTab === 'all' || activeTab === 'reports') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Crowdsourced Passenger Reports ({filteredReports.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  Separated from verified bulletins
                </span>
              </div>

              {filteredReports.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2">
                  <Info className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    No passenger reports submitted for this route or station.
                  </p>
                  <p className="text-xs text-slate-500">
                    Have you experienced a bus delay or broken facility? Help commuters by submitting an issue report.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredReports.map((report) => (
                    <ReportCard key={report._id} report={report} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

