import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  MapPin,
  Clock,
  Layers,
  Search,
  CheckCircle2,
  ArrowRight,
  Accessibility,
  CreditCard,
  Building,
  HelpCircle
} from 'lucide-react';
import { getRoutes, getStations } from '../services/api';
import TrustBadge from '../components/TrustBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('ALL');
  const [stationSearch, setStationSearch] = useState('');

  const fetchInit = async () => {
    setLoading(true);
    setError(null);
    try {
      const [routesRes, stationsRes] = await Promise.all([getRoutes(), getStations()]);
      if (routesRes.success) setRoutes(routesRes.data || []);
      if (stationsRes.success) setStations(stationsRes.data || []);
    } catch (err) {
      console.error('Error fetching routes and stations:', err);
      setError('Unable to load network routes and stations. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInit();
  }, []);

  const filteredStations = stations.filter((stn) => {
    if (selectedRouteFilter !== 'ALL') {
      if (!stn.connectedRoutes?.includes(selectedRouteFilter)) return false;
    }
    if (stationSearch) {
      const q = stationSearch.toLowerCase();
      const matchName = stn.name.toLowerCase().includes(q);
      const matchUrdu = stn.nameUrdu?.includes(q);
      const matchLoc = stn.locationSummary?.toLowerCase().includes(q);
      if (!matchName && !matchUrdu && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4 text-teal-600" />
          <span>Peshawar Transit Network</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Peshawar BRT Routes & Stations
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Complete corridor directory for the 27 km TransPeshawar Zu Peshawar BRT system, including Main Line, Express, and Feeder feeder loops.
        </p>
      </div>

      {/* Routes Directory */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">BRT Transit Corridors</h2>
        {error ? (
          <ErrorState message={error} onRetry={fetchInit} />
        ) : loading ? (
          <LoadingSkeleton type="route" count={3} />
        ) : routes.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No route corridors available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <div
                key={route.routeCode}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between transit-card"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base px-2.5 py-1 rounded bg-slate-900 text-white">
                      {route.routeCode}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      {route.type}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {route.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {route.description}
                  </p>

                  <div className="text-xs text-slate-500 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hours: {route.schedule?.firstBus} - {route.schedule?.lastBus}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5 text-slate-400" />
                      <span>Peak frequency: {route.schedule?.peakFrequency}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedRouteFilter(route.routeCode);
                      window.scrollTo({ top: 600, behavior: 'smooth' });
                    }}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    View Stations &rarr;
                  </button>

                  <Link
                    to={`/status?route=${route.routeCode}`}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                  >
                    Check Status
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Station Directory & Interactive Lookup */}
      <section className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Station Catalog & Facilities ({filteredStations.length})
            </h2>
            <p className="text-xs text-slate-500">
              Station facilities, interchange connections, and location details
            </p>
          </div>

          {/* Station Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <label htmlFor="routes-corridor-filter" className="sr-only">Filter by corridor</label>
            <select
              id="routes-corridor-filter"
              value={selectedRouteFilter}
              onChange={(e) => setSelectedRouteFilter(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-white"
            >
              <option value="ALL">All Network Stations</option>
              {routes.map((r) => (
                <option key={r.routeCode} value={r.routeCode}>
                  {r.routeCode} ({r.name})
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-64">
              <label htmlFor="routes-station-search" className="sr-only">Search station name</label>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="routes-station-search"
                type="text"
                placeholder="Search station name..."
                value={stationSearch}
                onChange={(e) => setStationSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Stations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2">
            <p className="text-sm font-semibold text-slate-700">No stations matched your criteria.</p>
            <p className="text-xs text-slate-500">Try adjusting your corridor filter or search query.</p>
            <button
              onClick={() => {
                setSelectedRouteFilter('ALL');
                setStationSearch('');
              }}
              className="text-xs font-semibold text-teal-700 hover:underline pt-1 inline-block"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStations.map((stn) => (
              <div
                key={stn.code}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between hover:border-teal-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {stn.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {stn.name}
                        </h4>
                      </div>
                      {stn.nameUrdu && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {stn.nameUrdu}
                        </p>
                      )}
                    </div>

                    {stn.isInterchange && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded shrink-0">
                        Interchange
                      </span>
                    )}
                  </div>

                  {stn.locationSummary && (
                    <p className="text-xs text-slate-500 mb-3">
                      {stn.locationSummary}
                    </p>
                  )}

                  {/* Connected routes */}
                  <div className="flex flex-wrap items-center gap-1 mb-2">
                    <span className="text-[11px] text-slate-400 mr-1">Routes:</span>
                    {stn.connectedRoutes?.map((rc) => (
                      <span
                        key={rc}
                        className="text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded"
                      >
                        {rc}
                      </span>
                    ))}
                  </div>

                  {/* Facilities */}
                  {stn.facilities && stn.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {stn.facilities.map((fac) => (
                        <span
                          key={fac}
                          className="text-[10px] bg-slate-50 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    to={`/status?station=${encodeURIComponent(stn.name)}`}
                    className="font-semibold text-teal-700 hover:text-teal-900"
                  >
                    Check Station Status &rarr;
                  </Link>

                  <Link
                    to={`/report`}
                    className="text-slate-400 hover:text-slate-700 text-[11px]"
                  >
                    Report Issue Here
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
