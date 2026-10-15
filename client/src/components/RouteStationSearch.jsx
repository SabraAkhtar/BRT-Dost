import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Bus,
  ArrowRight,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { getRoutes, getStations } from '../services/api';

/**
 * RouteStationSearch — Accessible, keyboard-navigable search component
 * connecting directly to live Route and Station APIs.
 */
export default function RouteStationSearch({
  placeholder = 'Search route (e.g. ML-01, Feeder) or station (Saddar, Chamkani)...',
  onSelectRoute,
  onSelectStation,
  autoNavigate = true,
  className = ''
}) {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [routesRes, stationsRes] = await Promise.all([getRoutes(), getStations()]);
      if (routesRes.success) setRoutes(routesRes.data || []);
      if (stationsRes.success) setStations(stationsRes.data || []);
    } catch (err) {
      console.error('Failed to load search data:', err);
      setError('Unable to load route and station directory. Click retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtering
  const cleanQ = query.trim().toLowerCase();

  const matchingRoutes = cleanQ
    ? routes.filter(
        (r) =>
          r.routeCode.toLowerCase().includes(cleanQ) ||
          r.name.toLowerCase().includes(cleanQ) ||
          r.type?.toLowerCase().includes(cleanQ) ||
          r.startPoint?.toLowerCase().includes(cleanQ) ||
          r.endPoint?.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchingStations = cleanQ
    ? stations.filter(
        (s) =>
          s.name.toLowerCase().includes(cleanQ) ||
          s.nameUrdu?.includes(cleanQ) ||
          s.code?.toLowerCase().includes(cleanQ) ||
          s.connectedRoutes?.some((cr) => cr.toLowerCase().includes(cleanQ))
      )
    : [];

  // Flatten items for unified keyboard navigation
  const flatItems = [
    ...matchingRoutes.map((r) => ({ type: 'route', data: r, id: `route-${r.routeCode}` })),
    ...matchingStations.map((s) => ({ type: 'station', data: s, id: `station-${s.code || s.name}` }))
  ];

  const handleSelect = (item) => {
    if (!item) return;
    setIsOpen(false);
    setSelectedIndex(-1);

    if (item.type === 'route') {
      const r = item.data;
      setQuery(`${r.routeCode} — ${r.name}`);
      if (onSelectRoute) {
        onSelectRoute(r);
      } else if (autoNavigate) {
        navigate(`/status?route=${r.routeCode}`);
      }
    } else if (item.type === 'station') {
      const s = item.data;
      setQuery(s.name);
      if (onSelectStation) {
        onSelectStation(s);
      } else if (autoNavigate) {
        navigate(`/status?station=${encodeURIComponent(s.name)}`);
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        handleSelect(flatItems[selectedIndex]);
      } else if (cleanQ) {
        setIsOpen(false);
        navigate(`/status?q=${encodeURIComponent(cleanQ)}`);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  // Popular quick station shortcuts when input is empty
  const popularStations = [
    'Malik Saad Shaheed',
    'Saddar Cantt',
    'University of Peshawar',
    'Board Bazar',
    'Karkhano Market',
    'Chamkani'
  ];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <label htmlFor="route-station-search-input" className="sr-only">
          Search routes or stations
        </label>
        <div className="absolute left-3.5 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          id="route-station-search-input"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="route-station-results-list"
          aria-activedescendant={
            selectedIndex >= 0 && flatItems[selectedIndex]
              ? flatItems[selectedIndex].id
              : undefined
          }
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-20 py-3.5 text-sm font-medium bg-white text-slate-900 rounded-xl border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder:text-slate-400 transition-all"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {loading && (
            <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" aria-label="Loading directory" />
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (cleanQ) {
                setIsOpen(false);
                navigate(`/status?q=${encodeURIComponent(cleanQ)}`);
              }
            }}
            className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Error state if API fails */}
      {error && isOpen && (
        <div
          role="alert"
          className="absolute z-50 left-0 right-0 mt-1.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-2 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-2.5 py-1 bg-white text-rose-700 border border-rose-300 rounded font-semibold hover:bg-rose-100 transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Dropdown */}
      {isOpen && !error && (
        <div
          id="route-station-results-list"
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-96 overflow-y-auto animate-fadeIn divide-y divide-slate-100"
        >
          {cleanQ ? (
            /* Results when query is typed */
            flatItems.length === 0 ? (
              /* Empty state */
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  No routes or stations match "{query}"
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Check your spelling or search by route code (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-semibold">ML-01</code>) or station name (<code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-semibold">Chamkani</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-semibold">Saddar</code>).
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/status?q=${encodeURIComponent(cleanQ)}`);
                    }}
                    className="text-xs text-teal-700 font-semibold hover:underline"
                  >
                    Search across all public incident alerts for "{query}" &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Section 1: Matching Routes */}
                {matchingRoutes.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-teal-600" />
                        <span>Matching Corridors ({matchingRoutes.length})</span>
                      </span>
                      <span>Press Enter to View Status</span>
                    </div>

                    <div className="space-y-0.5">
                      {matchingRoutes.map((route) => {
                        const idx = flatItems.findIndex((it) => it.id === `route-${route.routeCode}`);
                        const isSelected = selectedIndex === idx;

                        return (
                          <div
                            key={route.routeCode}
                            id={`route-${route.routeCode}`}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelect({ type: 'route', data: route })}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isSelected ? 'bg-teal-50 text-teal-950' : 'hover:bg-slate-50 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-slate-900 text-white shrink-0">
                                {route.routeCode}
                              </span>
                              <div className="truncate">
                                <div className="text-xs font-bold truncate">{route.name}</div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {route.startPoint} &rarr; {route.endPoint}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                                {route.type}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 2: Matching Stations */}
                {matchingStations.length > 0 && (
                  <div className="p-2 border-t border-slate-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span>Matching Stations ({matchingStations.length})</span>
                      </span>
                      <span>Transit Hubs</span>
                    </div>

                    <div className="space-y-0.5">
                      {matchingStations.map((station) => {
                        const idx = flatItems.findIndex((it) => it.id === `station-${station.code || station.name}`);
                        const isSelected = selectedIndex === idx;

                        return (
                          <div
                            key={station.code || station.name}
                            id={`station-${station.code || station.name}`}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelect({ type: 'station', data: station })}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isSelected ? 'bg-teal-50 text-teal-950' : 'hover:bg-slate-50 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/60">
                                <MapPin className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {station.name}
                                  {station.nameUrdu && (
                                    <span className="text-slate-500 font-normal ml-1.5 text-[11px]">
                                      ({station.nameUrdu})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {station.locationSummary || `Station #${station.code || station.sequence}`}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {station.connectedRoutes?.slice(0, 2).map((cr) => (
                                <span
                                  key={cr}
                                  className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  {cr}
                                </span>
                              ))}
                              {station.connectedRoutes?.length > 2 && (
                                <span className="text-[10px] text-slate-400">
                                  +{station.connectedRoutes.length - 2}
                                </span>
                              )}
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-1" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Default prompt when input is empty & focused */
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Quick Transit Corridors & Popular Stations</span>
              </div>

              {/* Corridor Shortcuts */}
              <div className="flex flex-wrap gap-1.5">
                {routes.slice(0, 4).map((r) => (
                  <button
                    type="button"
                    key={r.routeCode}
                    onClick={() => handleSelect({ type: 'route', data: r })}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-800 transition-colors border border-slate-200"
                  >
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.2 rounded">
                      {r.routeCode}
                    </span>
                    <span>{r.name}</span>
                  </button>
                ))}
              </div>

              {/* Station Shortcuts */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium mb-1.5">
                  Frequently Checked Stations:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularStations.map((stnName) => {
                    const stnObj = stations.find((s) => s.name.toLowerCase() === stnName.toLowerCase()) || {
                      name: stnName
                    };
                    return (
                      <button
                        type="button"
                        key={stnName}
                        onClick={() => handleSelect({ type: 'station', data: stnObj })}
                        className="text-xs text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 px-2 py-1 rounded-md border border-slate-200 transition-colors"
                      >
                        {stnName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
