import React from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

/**
 * ErrorState — Graceful error and network disconnection handler.
 * Provides clear explanations and an accessible retry button.
 */
export default function ErrorState({
  title = 'Unable to Load Transit Information',
  message = 'We encountered a connection issue fetching data from the BRT server. Please verify your connection or try again.',
  onRetry,
  compact = false
}) {
  const isNetworkIssue =
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('connect') ||
    message.toLowerCase().includes('offline');

  const Icon = isNetworkIssue ? WifiOff : AlertCircle;

  if (compact) {
    return (
      <div
        role="alert"
        className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 font-semibold rounded-md flex items-center gap-1 transition-colors shrink-0 shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="p-8 text-center bg-white rounded-2xl border border-rose-200/90 shadow-sm max-w-lg mx-auto space-y-4 my-6"
    >
      <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}
