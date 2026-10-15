import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, ArrowRight, Clock, MapPin, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import TrustBadge from './TrustBadge';

export default function RouteCard({ route }) {
  if (!route) return null;

  const trust = route.trustStatus || {};

  const typeStyles = {
    'Main Line': 'bg-teal-50 text-teal-800 border-teal-200',
    'Express': 'bg-rose-50 text-rose-800 border-rose-200',
    'Feeder': 'bg-amber-50 text-amber-800 border-amber-200'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 transit-card flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base px-2.5 py-1 rounded-md bg-slate-900 text-white">
              {route.routeCode}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${typeStyles[route.type] || 'bg-slate-100 text-slate-700'}`}>
              {route.type}
            </span>
          </div>

          <TrustBadge
            state={trust.code}
            label={trust.label || trust.badge}
            size="sm"
          />
        </div>

        {/* Route Name */}
        <h3 className="text-base font-bold text-slate-900 mb-1">
          {route.name}
        </h3>

        {/* Terminals */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{route.startPoint}</span>
          <span className="text-slate-400">&rarr;</span>
          <span className="truncate">{route.endPoint}</span>
        </div>

        {/* Trust summary explanation */}
        <div className={`p-3 rounded-lg text-xs mb-4 border ${
          trust.code === 'CONFIRMED_OPERATIONAL'
            ? 'bg-teal-50/70 border-teal-200 text-teal-900'
            : trust.code === 'DISRUPTION'
            ? 'bg-red-50 border-red-200 text-red-900'
            : trust.code === 'STALE'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="font-semibold flex items-center gap-1.5 mb-0.5">
            {trust.code === 'CONFIRMED_OPERATIONAL' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
            {trust.code === 'DISRUPTION' && <AlertCircle className="w-3.5 h-3.5 text-red-700 shrink-0" />}
            {trust.code === 'UNKNOWN' && <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            <span>{trust.badge || 'Status Unknown'}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            {trust.description || 'No recent verification. Cannot confirm operational state.'}
          </p>
        </div>
      </div>

      {/* Footer details & Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Peak: {route.schedule?.peakFrequency || '3-5m'}</span>
        </div>

        <Link
          to={`/status?route=${route.routeCode}`}
          className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 group"
        >
          <span>View Alerts</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
