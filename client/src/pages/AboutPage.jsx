import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  GitCompare,
  Layers,
  Server,
  Lock,
  Bus,
  Code
} from 'lucide-react';
import TrustBadge from '../components/TrustBadge';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Civic Technology & Urban Mobility</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About BRT Dost
        </h1>
        <p className="text-base text-slate-600 mt-2 leading-relaxed">
          Peshawar BRT (Zu Peshawar) moves over 250,000 citizens every day across the Khyber Pakhtunkhwa capital. BRT Dost is an innovative civic platform engineered to provide reliable service visibility, timestamp-verified updates, and crowdsourced reporting without spreading unconfirmed rumors or outdated transport claims.
        </p>
      </div>

      {/* The Core Problem */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          The Problem with Transport Information
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Most transit websites present passengers with two dangerous extremes:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1">
            <strong className="block font-bold text-rose-950 text-sm">False Operational Green</strong>
            <p>
              Assuming that "zero reported incidents" means the service is running perfectly. If no administrator has confirmed a line in 6 hours, marking it as "Normal Service" deceives commuters.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
            <strong className="block font-bold text-amber-950 text-sm">Unmoderated Crowd Panic</strong>
            <p>
              Displaying unverified passenger complaints as confirmed disruptions causes unnecessary panic, route abandonment, and miscommunication.
            </p>
          </div>
        </div>
      </section>

      {/* The Signature Innovation */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-teal-500/20 text-teal-300 text-xs font-bold px-2.5 py-1 rounded-full border border-teal-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Core Engineering Principle</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            The Trust & Freshness Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            BRT Dost strictly enforces backend-calculated reliability states. A notice is never automatically refreshed simply because a user visits the page.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">1. Verified State</h4>
              <p className="text-xs text-slate-300">
                Official bulletin published or confirmed by authenticated transit administrators with mandatory source attribution, UTC timestamping, and audit logging.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">2. Unverified Passenger Reports</h4>
              <p className="text-xs text-slate-300">
                Crowdsourced issue submissions remain strictly labeled as "Passenger report — not verified" until reviewed. They are never mixed into official bulletins.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
            <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">3. Timestamp-Driven Stale Detection</h4>
              <p className="text-xs text-slate-300">
                If an advisory is not actively re-confirmed by transit staff within its configured freshness window (e.g. 4 hours), the server automatically evaluates it as <strong>Stale ("Information may be outdated")</strong>, warning riders that conditions may have shifted.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">4. Honest "Status Unknown"</h4>
              <p className="text-xs text-slate-300">
                If no verified report exists within the freshness threshold, the system displays <strong>Status Unknown</strong> instead of falsely assuming normal operations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
            <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">5. Expired State</h4>
              <p className="text-xs text-slate-300">
                Advisories that pass their scheduled expiration timestamp are automatically transitioned to <strong>Expired</strong> at query time. Commuters are never misled by obsolete announcements.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">6. Withdrawn State</h4>
              <p className="text-xs text-slate-300">
                When transit conditions return to normal or an advisory is retracted, administrators formally withdraw it with timestamped audit records.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-purple-500/30">
            <GitCompare className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-purple-200">7. Automated Conflicting Report Analysis</h4>
              <p className="text-xs text-slate-300">
                When passenger reports contradict active announcements or other recent submissions at the same station, the Trust Engine flags them as <strong>"Conflicting reports"</strong> for admin review rather than blindly accepting either as truth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Tech Stack */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Full-Stack System Architecture
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase">
              <Code className="w-4 h-4" />
              <span>Frontend Client</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              React with Vite, Tailwind CSS, React Router, Lucide icons, responsive mobile-first UI with accessible color tokens.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase">
              <Server className="w-4 h-4" />
              <span>Backend API</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Node.js with Express, Trust & Freshness Engine service, express-validator, rate-limiting, and centralized error handling.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase">
              <Lock className="w-4 h-4" />
              <span>Database & Security</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              MongoDB with Mongoose, bcrypt password hashing, JWT Bearer tokens, privacy-isolated public queries, and zero-config in-memory dev mode.
            </p>
          </div>
        </div>
      </section>

      {/* Honest Data & Ethical Declaration */}
      <section className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-2">
        <strong className="block font-bold text-sm text-amber-900">
          Honest Data Handling Policy
        </strong>
        <p className="leading-relaxed">
          BRT Dost is an independent project. We do not invent fake GPS coordinates, artificial live bus locations, or simulated official alerts. If sample data is used for demonstration or bootcamp evaluation, it is visibly labeled as demo data. Public report retrieval strictly strips passenger phone numbers and emails to protect citizen privacy.
        </p>
      </section>
    </div>
  );
}
