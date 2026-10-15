import React from 'react';

/**
 * LoadingSkeleton — Accessible loading skeleton for transit cards, feeds, and details.
 */
export default function LoadingSkeleton({ type = 'cards', count = 3 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'route') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading transit routes">
        {items.map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-7 w-20 bg-slate-200 rounded-md" />
              <div className="h-5 w-24 bg-slate-200 rounded-full" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
            <div className="h-14 bg-slate-100 rounded-lg" />
            <div className="pt-3 border-t border-slate-100 flex justify-between">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading transit updates">
      {items.map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3 animate-pulse shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-28 bg-slate-200 rounded-full" />
              <div className="h-5 w-16 bg-slate-200 rounded" />
            </div>
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-5 w-2/3 bg-slate-200 rounded" />
          <div className="space-y-1.5">
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-4/5 bg-slate-100 rounded" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
