import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  ShieldAlert,
  GitCompare,
  XCircle,
  ShieldOff
} from 'lucide-react';

/**
 * TrustBadge — Accessible trust state chip.
 *
 * Distinguishes states with BOTH text labels AND icons — never color alone.
 * Labels match the STATE_LABELS from trustConfig.js on the backend.
 *
 * Supported states (alert):
 *   VERIFIED, OFFICIAL_VERIFIED, STALE, EXPIRED, WITHDRAWN, UNKNOWN
 * Supported states (report):
 *   UNVERIFIED, VERIFIED, CONFLICT_FLAGGED, REJECTED
 * Supported states (route):
 *   CONFIRMED_OPERATIONAL, DISRUPTION, WARNING, UNVERIFIED_ACTIVITY, UNKNOWN
 */
export default function TrustBadge({
  state,
  label: overrideLabel,  // optional: override with backend STATE_LABELS value
  size = 'md',
  showDescription = false,
  description = ''
}) {
  const normState = (state || 'UNKNOWN').toUpperCase();

  // ── State → visual config mapping ─────────────────────────────────────────
  let config = {
    label: 'No confirmed current information',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    iconColor: 'text-slate-500',
    Icon: HelpCircle,
    ariaLabel: 'Status: No confirmed current information'
  };

  if (normState === 'OFFICIAL_VERIFIED') {
    config = {
      label: 'Official Transit Announcement',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconColor: 'text-emerald-600',
      Icon: CheckCircle2,
      ariaLabel: 'Status: Official transit announcement — verified by TransPeshawar'
    };
  } else if (normState === 'VERIFIED' || normState === 'CONFIRMED_OPERATIONAL') {
    config = {
      label: normState === 'CONFIRMED_OPERATIONAL' ? 'Confirmed operational' : 'Verified update',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconColor: 'text-emerald-600',
      Icon: CheckCircle2,
      ariaLabel: 'Status: Verified — confirmed by administrator'
    };
  } else if (normState === 'UNVERIFIED' || normState === 'PENDING' || normState === 'UNVERIFIED_ACTIVITY') {
    config = {
      label: 'Passenger report — not verified',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      iconColor: 'text-amber-600',
      Icon: AlertTriangle,
      ariaLabel: 'Status: Passenger report — not verified by admin'
    };
  } else if (normState === 'STALE') {
    config = {
      label: 'Information may be outdated',
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      iconColor: 'text-orange-500',
      Icon: Clock,
      ariaLabel: 'Status: Information may be outdated — freshness window elapsed'
    };
  } else if (normState === 'EXPIRED') {
    config = {
      label: 'Alert expired',
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      iconColor: 'text-slate-400',
      Icon: XCircle,
      ariaLabel: 'Status: Alert expired — past scheduled end time'
    };
  } else if (normState === 'WITHDRAWN') {
    config = {
      label: 'Alert withdrawn',
      bg: 'bg-slate-50 text-slate-500 border-slate-200',
      iconColor: 'text-slate-400',
      Icon: ShieldOff,
      ariaLabel: 'Status: Alert withdrawn by administrator'
    };
  } else if (normState === 'DISRUPTION') {
    config = {
      label: 'Service disruption',
      bg: 'bg-red-50 text-red-800 border-red-200',
      iconColor: 'text-red-600',
      Icon: ShieldAlert,
      ariaLabel: 'Status: Service disruption — confirmed by admin'
    };
  } else if (normState === 'WARNING') {
    config = {
      label: 'Service advisory',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      iconColor: 'text-amber-600',
      Icon: AlertTriangle,
      ariaLabel: 'Status: Service advisory — conditions may affect travel'
    };
  } else if (normState === 'CONFLICT' || normState === 'CONFLICT_FLAGGED') {
    config = {
      label: 'Conflicting reports — under review',
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      iconColor: 'text-purple-600',
      Icon: GitCompare,
      ariaLabel: 'Status: Conflicting reports — administrator review in progress'
    };
  } else if (normState === 'REJECTED') {
    config = {
      label: 'Report rejected',
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      iconColor: 'text-slate-400',
      Icon: XCircle,
      ariaLabel: 'Status: Report rejected by administrator'
    };
  }

  // Use backend label override if provided
  const displayLabel = overrideLabel || config.label;
  const { Icon } = config;
  const isSmall = size === 'sm';

  return (
    <div className="inline-flex flex-col">
      <span
        role="status"
        aria-label={config.ariaLabel}
        className={`inline-flex items-center gap-1.5 font-semibold border rounded-full ${config.bg} ${
          isSmall ? 'text-[11px] px-2 py-0.5' : 'text-xs px-3 py-1'
        }`}
      >
        <Icon
          className={`shrink-0 ${config.iconColor} ${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`}
          aria-hidden="true"
        />
        <span>{displayLabel}</span>
      </span>

      {showDescription && description && (
        <span className="text-xs text-slate-500 mt-1 pl-1 max-w-xs leading-snug">
          {description}
        </span>
      )}
    </div>
  );
}
