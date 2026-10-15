import React from 'react';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Tag,
  GitCompare,
  User,
  ShieldCheck,
  UserCheck,
  HelpCircle
} from 'lucide-react';
import TrustBadge from './TrustBadge';

export default function ReportCard({ report }) {
  if (!report) return null;

  const trust = report.trust || {};
  const isConflict =
    trust.state === 'CONFLICT_FLAGGED' ||
    report.isConflict ||
    report.moderationStatus === 'conflict_flagged';
  const isVerified = trust.state === 'VERIFIED' || report.moderationStatus === 'verified';

  const derivedState = isConflict
    ? 'CONFLICT_FLAGGED'
    : isVerified
    ? 'VERIFIED'
    : 'UNVERIFIED';

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Recently';
      return (
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      );
    } catch {
      return 'Recently';
    }
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m ago`;
    return `${Math.max(1, mins)}m ago`;
  };

  const elapsedText = trust.elapsedHuman
    ? `Reported ${trust.elapsedHuman}`
    : `Reported ${getRelativeTime(report.createdAt)}`;

  const borderClass = isConflict
    ? 'border-purple-300 bg-purple-50/15'
    : isVerified
    ? 'border-emerald-200 bg-white'
    : 'border-amber-200/80 bg-white';

  return (
    <article
      className={`rounded-xl border ${borderClass} shadow-xs p-5 transit-card space-y-3 transition-all`}
      aria-label={`Passenger report at ${report.stationName || 'station'} - ${trust.label || 'Passenger report'}`}
    >
      {/* Top badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <TrustBadge
            state={derivedState}
            label={trust.label}
            size="sm"
          />

          {report.routeCode && (
            <span className="text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
              {report.routeCode}
            </span>
          )}

          {report.category && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{report.category}</span>
            </span>
          )}
        </div>

        <span
          className="text-xs text-slate-500 flex items-center gap-1"
          title={`Accurate UTC: ${formatTime(report.createdAt)}`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{elapsedText}</span>
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-700 leading-relaxed">
        {report.description}
      </p>

      {/* Conflict Warning if flagged */}
      {isConflict && (
        <div className="p-3 bg-purple-50 border border-purple-200/90 rounded-lg text-xs text-purple-950 flex items-start gap-2.5">
          <GitCompare className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-semibold block text-purple-900">
              Conflicting reports — Under Admin Review:
            </strong>
            <p className="text-purple-800 leading-relaxed">
              {report.conflictReason ||
                trust.description ||
                'Our Trust Engine detected differing passenger submissions or an announcement mismatch for this station. Awaiting official verification.'}
            </p>
          </div>
        </div>
      )}

      {/* Unverified Commuter Notice */}
      {!isConflict && !isVerified && (
        <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Passenger report — not verified:</span> Crowd submission awaiting staff review. Displayed for commuter situational awareness.
          </div>
        </div>
      )}

      {/* Verified Audit Notice */}
      {isVerified && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs text-emerald-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Confirmed by transit administrator</span>
          </div>
          {trust.reviewedAt && (
            <span className="text-[11px] text-emerald-700 font-mono">
              {formatTime(trust.reviewedAt)}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">{report.stationName}</span>
          {report.routeName && <span className="text-slate-400">({report.routeName})</span>}
        </div>

        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>Source: Passenger Crowdsource</span>
        </span>
      </div>
    </article>
  );
}

