import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bus,
  Search,
  ShieldCheck,
  AlertTriangle,
  Clock,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { getRoutes, getAlerts, getPublicReports, getStations } from '../services/api';
import RouteCard from '../components/RouteCard';
import AlertCard from '../components/AlertCard';
import ReportCard from '../components/ReportCard';
import TrustBadge from '../components/TrustBadge';
import RouteStationSearch from '../components/RouteStationSearch';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

export default function Home() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [routesRes, alertsRes, reportsRes, stationsRes] = await Promise.all([
        getRoutes(),
        getAlerts(),
        getPublicReports({ limit: 6 }),
        getStations()
      ]);

      if (routesRes.success) setRoutes(routesRes.data || []);
      if (alertsRes.success) setAlerts(alertsRes.data || []);
      if (reportsRes.success) setReports(reportsRes.data || []);
      if (stationsRes.success) setStations(stationsRes.data || []);
    } catch (err) {
      console.error('Error loading homepage data:', err);
      setError('Unable to reach the BRT Dost transit API. Please check your internet connection or verify the server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (selectedRoute) {
      navigate(`/status?route=${selectedRoute}`);
    } else if (searchQuery.trim()) {
      navigate(`/status?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/status');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Subtle background transit grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#008170_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Peshawar BRT Trust & Freshness Engine</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Check Before <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">You Leave.</span>
          </h1>

          {/* Supporting Text */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Check available service updates, understand their verification status, and report transport issues through BRT Dost.
          </p>

          {/* Search & Quick Check Box */}
          <div className="max-w-3xl mx-auto mt-8 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-2xl space-y-3">
            <RouteStationSearch
              placeholder="Search corridor code (e.g. ML-01) or station (Saddar, Chamkani, Board Bazar)..."
              autoNavigate={true}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 pt-1">
              <span className="font-medium text-slate-200">Common Peshawar Hubs:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Saddar Cantt', code: 'Saddar' },
                  { name: 'Chamkani', code: 'Chamkani' },
                  { name: 'Board Bazar', code: 'Board' },
                  { name: 'University of Peshawar', code: 'University' },
                  { name: 'Karkhano Market', code: 'Karkhano' }
                ].map((stn) => (
                  <button
                    key={stn.name}
                    type="button"
                    onClick={() => navigate(`/status?station=${encodeURIComponent(stn.name)}`)}
                    className="hover:text-teal-300 underline underline-offset-2 transition-colors text-slate-300"
                  >
                    {stn.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Honest verification: Never presenting unverified rumors or outdated notices as live facts.</span>
          </div>
        </div>
      </section>

      {/* Trust & Freshness Engine Explanation Key */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="max-w-2xl mb-6">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Signature Innovation</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              The Trust & Freshness Engine
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Public transport info can easily mislead if unverified reports or expired advisories are displayed as confirmed facts. BRT Dost enforces six standard information states:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Verified */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Verified</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-700">Confirmed</span>
              </div>
              <p className="text-xs text-emerald-900/90 leading-relaxed">
                An authorized transit administrator has reviewed and confirmed the update with UTC timestamp and source attribution.
              </p>
            </div>

            {/* 2. Unverified */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Unverified</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-700">Passenger Report</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Submitted by a commuter but not yet confirmed by an admin. Segregated from verified announcements to avoid spreading rumors.
              </p>
            </div>

            {/* 3. Stale */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Stale</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-800">Freshness Expired</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Previously confirmed information that has exceeded its configured freshness period without staff re-confirmation. Conditions may have changed.
              </p>
            </div>

            {/* 4. Unknown */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-full">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                  <span>Unknown</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-600">Honest Null</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                No reliable current information is available. We never assume "Normal" or "Operational" without active positive confirmation.
              </p>
            </div>

            {/* 5. Expired */}
            <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  <span>Expired</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-600">Archived</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                An alert that has passed its scheduled expiry timestamp. Automatically demoted from live feeds and archived for audit transparency.
              </p>
            </div>

            {/* 6. Withdrawn */}
            <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Withdrawn</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500">Revoked</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                An advisory that an authorized administrator has formally withdrawn because conditions cleared or were resolved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Network Routes & Status Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Peshawar BRT Route Corridors
            </h2>
            <p className="text-sm text-slate-600">
              Live operational health evaluated dynamically by the Trust Engine
            </p>
          </div>
          <Link
            to="/routes"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>View Full Network Guide & Stations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : loading ? (
          <LoadingSkeleton type="route" count={3} />
        ) : routes.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No route records available from the transit database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <RouteCard key={route.routeCode} route={route} />
            ))}
          </div>
        )}
      </section>

      {/* Dual Feed: Verified Announcements vs Recent Passenger Reports */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: Verified Service Announcements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Verified Announcements
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Control room bulletins and administrator-confirmed advisories
                </p>
              </div>

              <Link
                to="/status"
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                View All
              </Link>
            </div>

            {error ? (
              <ErrorState compact={true} message="Failed to load announcements" onRetry={fetchData} />
            ) : loading ? (
              <LoadingSkeleton type="cards" count={2} />
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                No active service announcements published at this moment.
              </div>
            ) : (
              <div className="space-y-3.5">
                {alerts.slice(0, 3).map((alert) => (
                  <AlertCard key={alert._id} alert={alert} />
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Unverified Passenger Reports */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Recent Passenger Reports
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Crowdsourced issues logged by commuters (Unverified until reviewed)
                </p>
              </div>

              <Link
                to="/report"
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                Submit Report
              </Link>
            </div>

            {error ? (
              <ErrorState compact={true} message="Failed to load passenger reports" onRetry={fetchData} />
            ) : loading ? (
              <LoadingSkeleton type="cards" count={2} />
            ) : reports.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                No passenger reports submitted in recent window.
              </div>
            ) : (
              <div className="space-y-3.5">
                {reports.slice(0, 3).map((report) => (
                  <ReportCard key={report._id} report={report} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to action card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white rounded-2xl p-8 sm:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Civic Transport Collaboration
            </span>
            <h3 className="text-2xl font-bold tracking-tight">
              Experienced a disruption or delay on Peshawar BRT?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Help your fellow Peshawar commuters by reporting station congestion, AC failures, card vending machine issues, or bus delays. Submissions are processed by transit moderators.
            </p>
          </div>

          <Link
            to="/report"
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 shrink-0"
          >
            <AlertCircle className="w-4 h-4 text-slate-950" />
            <span>Submit a Passenger Report</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
