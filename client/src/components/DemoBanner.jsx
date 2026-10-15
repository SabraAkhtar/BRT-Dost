import React, { useState } from 'react';
import { ShieldCheck, Info, X } from 'lucide-react';

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex items-center justify-center bg-teal-500/20 text-teal-400 p-1 rounded-full shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </span>
          <p className="truncate text-slate-200">
            <strong className="text-white font-semibold">BRT Dost Integrity Rule:</strong> Unverified crowd reports and expired notices are never displayed as live operational facts. Routes without fresh confirmation default to <span className="text-amber-300 font-semibold">Status Unknown</span>.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors shrink-0"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
