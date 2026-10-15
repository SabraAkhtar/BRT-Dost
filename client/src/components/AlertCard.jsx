import React from 'react';
import {
  ShieldCheck,
  Clock,
  MapPin,
  Building,
  AlertTriangle,
  AlertCircle,
  XCircle,
  ShieldOff,
  UserCheck,
  Info
} from 'lucide-react';
import TrustBadge from './TrustBadge';

export default function AlertCard({ alert }) {
  if (!alert) return null;

  const freshness = alert.freshness || {};
  const isStale = freshness.state === 'STALE';
  const isExpired = freshness.state === 'EXPIRED';
  const isWithdrawn = freshness.state === 'WITHDRAWN';

  // Format precise timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Unknown';
      return (
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      );
    } catch {
      return 'Unknown';
    }
  };

  const severityStyles = {
    info: 'border-l-teal-600',
    warning: 'border-l-amber-500',
    disruption: 'border-l-rose-600',
    closure: 'border-l-red-700'
  };

  const cardContainerClass = isWithdrawn
    ? 'bg-slate-50/80 border-slate-300/80 opacity-75 border-l-slate-400'
    : isExpired
    ? 'bg-slate-50/90 border-slate-300 border-l-slate-400 opacity-80'
    : isStale
    ? 'bg-white border-amber-300/90 border-l-amber-500 shadow-xs'
    : `bg-white border-slate-200/90 shadow-xs ${severityStyles[alert.severity] || 'border-l-teal-600'}`;

  const lastConfirmedDate = alert.lastConfirmedAt || alert.updatedAt || alert.createdAt;
  const elapsedText = freshness.elapsedHuman
    ? `Updated ${freshness.elapsedHuman}`
    : 'Time unrecorded';

  return (
    <article
      className={`rounded-xl border border-l-4 p-5 transit-card relative overflow-hidden transition-all ${cardContainerClass}`}
      aria-label={`${alert.title} - ${freshness.label || alert.verificationStatus || 'Service update'}`}
    >
      {/* Header tags */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <TrustBadge
            state={freshness.state || alert.verificationStatus || 'VERIFIED'}
            label={freshness.label}
            size="sm"
          />

          {alert.routeCode && (
            <span className="text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
              {alert.routeCode === 'ALL' ? 'All Lines' : `Route ${alert.routeCode}`}
            </span>
          )}

          {alert.stationName && alert.stationName !== 'Network-wide' && (
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{alert.stationName}</span>
            </span>
          )}

          {alert.isDemoData && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
              Demo Sample
            </span>
          )}
        </div>

        {/* Time elapsed with full tooltip */}
        <span
          className="text-xs text-slate-500 flex items-center gap-1"
          title={`Accurate UTC: ${formatTime(lastConfirmedDate)}`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{elapsedText}</span>
        </span>
      </div>

      {/* Title */}
      <h3
        className={`text-base font-bold mb-1.5 leading-snug ${
          isWithdrawn ? 'line-through text-slate-500' : 'text-slate-900'
        }`}
      >
        {alert.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4">
        {alert.description}
      </p>

      {/* State-specific Banners */}
      {isWithdrawn && (
        <div className="mb-3 p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 flex items-start gap-2">
          <ShieldOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-slate-900">Notice Withdrawn:</strong> This service advisory was formally withdrawn by transit administrators and is no longer an active disruption.
            {alert.withdrawnAt && (
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Withdrawn at: {formatTime(alert.withdrawnAt)}
              </span>
            )}
          </div>
        </div>
      )}

      {isExpired && !isWithdrawn && (
        <div className="mb-3 p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-slate-900">Alert Expired:</strong> This bulletin reached its scheduled expiration and is retained for transparency.
            {alert.expiresAt && (
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Expired: {formatTime(alert.expiresAt)}
              </span>
            )}
          </div>
        </div>
      )}

      {isStale && !isExpired && !isWithdrawn && (
        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200/90 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-950">Information may be outdated:</strong> Advisory was last confirmed {freshness.elapsedHours != null ? `${freshness.elapsedHours}h ago` : 'previously'} (freshness limit: {freshness.freshnessWindowHours || 4}h). Conditions may have changed; awaiting transit staff re-confirmation.
          </div>
        </div>
      )}

      {/* Source Transparency & Metadata Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="font-medium text-slate-700">Source:</span>
            <span className="bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded border border-slate-200">
              {alert.source || 'Authorized Operations Desk'}
            </span>
          </div>

          {alert.verifiedBy && (
            <div className="flex items-center gap-1 text-slate-600">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Verified by {alert.verifiedBy}</span>
            </div>
          )}
        </div>

        {/* Expiry status if active */}
        {alert.expiresAt && !isExpired && !isWithdrawn && (
          <div className="text-slate-500 text-[11px] flex items-center gap-1">
            <span>Valid until:</span>
            <strong className="text-slate-700 font-medium">{formatTime(alert.expiresAt)}</strong>
          </div>
        )}
      </div>
    </article>
  );
}

