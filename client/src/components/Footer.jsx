import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, ShieldCheck, Heart, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Bus className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                BRT Dost <span className="text-teal-400 font-light">| Peshawar</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm max-w-md leading-relaxed">
              Check Before You Leave. A civic-technology platform dedicated to transparent transport information, passenger report verification, and timestamp-based freshness tracking for the Peshawar Bus Rapid Transit (Zu Peshawar) system.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Core Principle: Never present unverified or outdated data as confirmed live status.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-teal-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/status" className="hover:text-teal-400 transition-colors">Check Route Status</Link>
              </li>
              <li>
                <Link to="/routes" className="hover:text-teal-400 transition-colors">Peshawar BRT Stations</Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-teal-400 transition-colors">Submit Passenger Report</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-teal-400 transition-colors">About & Trust Engine</Link>
              </li>
            </ul>
          </div>

          {/* Transparency & Disclaimer */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Honesty & Disclaimer</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              BRT Dost is an independent project. In the absence of an authorized official real-time API feed, status is determined solely through verified administrator announcements and moderated passenger reports. Unconfirmed routes are honestly labeled as <strong>Status Unknown</strong>.
            </p>
            <div className="mt-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                <span>Transit Administrator Access &rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>&copy; {new Date().getFullYear()} BRT Dost — Peshawar Bus Rapid Transit Trust Platform.</p>
          <p className="flex items-center gap-1">
            Built for civic mobility & transparency in Peshawar
          </p>
        </div>
      </div>
    </footer>
  );
}
