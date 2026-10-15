import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Send,
  ArrowRight,
  Eye,
  Info
} from 'lucide-react';
import { getRoutes, getStations, submitReport } from '../services/api';
import TrustBadge from '../components/TrustBadge';

const CATEGORIES = [
  'Delay',
  'Overcrowding',
  'AC / Climate Control',
  'Safety & Security',
  'Ticketing / Zu Card',
  'Station Infrastructure',
  'Bus Breakdown',
  'Other'
];

export default function ReportPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [routeCode, setRouteCode] = useState('ML-01');
  const [stationName, setStationName] = useState('');
  const [category, setCategory] = useState('Delay');
  const [description, setDescription] = useState('');
  const [passengerContact, setPassengerContact] = useState('');

  // Status & validation states
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [routesRes, stationsRes] = await Promise.all([getRoutes(), getStations()]);
        if (routesRes.success) {
          setRoutes(routesRes.data);
          if (routesRes.data.length > 0) {
            setRouteCode(routesRes.data[0].routeCode);
          }
        }
        if (stationsRes.success) {
          setStations(stationsRes.data);
          if (stationsRes.data.length > 0) {
            setStationName(stationsRes.data[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load routes/stations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInit();
  }, []);

  // Filter stations based on selected route
  const availableStations = stations.filter((s) => {
    if (!routeCode || routeCode === 'ALL') return true;
    return s.connectedRoutes?.includes(routeCode);
  });

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};
    if (!routeCode) newErrors.routeCode = 'Please select a BRT route';
    if (!stationName) newErrors.stationName = 'Please select or enter the station name';
    if (!category) newErrors.category = 'Please pick an issue category';
    if (!description || description.trim().length < 10) {
      newErrors.description = 'Please describe the issue in at least 10 characters';
    } else if (description.trim().length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Prevent duplicate submissions
    setServerMessage(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        routeCode,
        stationName,
        category,
        description: description.trim(),
        passengerContact: passengerContact.trim()
      };

      const res = await submitReport(payload);
      if (res.success) {
        setSubmissionSuccess(true);
        setSubmittedData(res.data);
        setServerMessage(res.message || 'Report logged successfully and sent to moderation queue.');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      const apiMsg =
        err.response?.data?.message ||
        'Failed to connect to the BRT server. Please check your network connection and try again.';
      setServerMessage(apiMsg);
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
          <AlertCircle className="w-4 h-4 text-teal-600" />
          <span>Passenger Reporting Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Transit Issue
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Report bus delays, AC malfunctions, card kiosk failures, or safety concerns on Peshawar BRT. Submissions enter the moderation queue as <strong className="text-amber-800 font-semibold">Unverified</strong> until reviewed by authorized administrators.
        </p>
      </div>

      {/* Success View */}
      {submissionSuccess ? (
        <div
          role="status"
          aria-live="polite"
          className="bg-white rounded-2xl border border-emerald-200 shadow-md p-8 text-center space-y-5 animate-fadeIn"
        >
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900">
              Report Submitted Successfully
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {serverMessage}
            </p>
          </div>

          {/* Critical Explanation: Submission does not equal verification */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-lg mx-auto text-xs text-amber-950 text-left space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Verification Notice</span>
            </div>
            <p className="leading-relaxed">
              <strong>Submission does not mean this report is verified.</strong> In accordance with BRT Dost policy, crowdsourced submissions are displayed as <span className="font-semibold underline">Unverified</span> until reviewed and confirmed by authorized transit staff.
            </p>
          </div>

          {/* Submission summary badge */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-lg mx-auto text-left space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                {submittedData?.routeCode ? `Route ${submittedData.routeCode}` : 'BRT Network'}
              </span>
              <TrustBadge state="UNVERIFIED" size="sm" />
            </div>
            <div className="text-slate-600">
              <strong>Station:</strong> {submittedData?.stationName} • <strong>Category:</strong> {submittedData?.category}
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded text-slate-700 italic">
              "{submittedData?.description}"
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setSubmissionSuccess(false);
                setDescription('');
                setPassengerContact('');
                setServerMessage(null);
                setErrors({});
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              Submit Another Report
            </button>
            <Link
              to="/status"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              View Public Status Feed &rarr;
            </Link>
          </div>
        </div>
      ) : (
        /* Form View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            {serverMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{serverMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Route Selection */}
              <div>
                <label htmlFor="report-route-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Peshawar BRT Route *
                </label>
                <select
                  id="report-route-select"
                  disabled={submitting}
                  value={routeCode}
                  onChange={(e) => {
                    setRouteCode(e.target.value);
                    const matching = stations.find((s) => s.connectedRoutes?.includes(e.target.value));
                    if (matching) setStationName(matching.name);
                  }}
                  className="w-full text-sm font-medium rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  {routes.map((r) => (
                    <option key={r.routeCode} value={r.routeCode}>
                      {r.routeCode} — {r.name}
                    </option>
                  ))}
                </select>
                {errors.routeCode && <p className="text-xs text-rose-600 mt-1" role="alert">{errors.routeCode}</p>}
              </div>

              {/* Station Selection */}
              <div>
                <label htmlFor="report-station-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Station / Location *
                </label>
                <select
                  id="report-station-select"
                  disabled={submitting}
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full text-sm font-medium rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Station...</option>
                  {availableStations.map((stn) => (
                    <option key={stn.code} value={stn.name}>
                      {stn.name} ({stn.nameUrdu || stn.code})
                    </option>
                  ))}
                  <option value="In-Transit (Between Stations)">In-Transit (Onboard bus between stations)</option>
                  <option value="Terminal Depot">Chamkani or Karkhano Depot</option>
                </select>
                {errors.stationName && <p className="text-xs text-rose-600 mt-1" role="alert">{errors.stationName}</p>}
              </div>

              {/* Issue Category */}
              <div>
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  3. Issue Category *
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Issue category selector">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      disabled={submitting}
                      onClick={() => setCategory(cat)}
                      className={`text-xs font-semibold p-2.5 rounded-xl border text-center transition-all disabled:opacity-50 ${
                        category === cat
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm ring-2 ring-amber-400'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-xs text-rose-600 mt-1" role="alert">{errors.category}</p>}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="report-description-textarea" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    4. Description of Experience *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {description.length}/1000 characters
                  </span>
                </div>
                <textarea
                  id="report-description-textarea"
                  rows={4}
                  disabled={submitting}
                  aria-required="true"
                  aria-invalid={!!errors.description}
                  placeholder="Please describe what occurred (e.g. Bus waited 15 mins at station, ticket machine not printing tokens, AC fan stopped)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full text-sm rounded-xl border p-3.5 focus:ring-2 focus:ring-teal-500 bg-white placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    errors.description ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'
                  }`}
                />
                {errors.description && <p className="text-xs text-rose-600 mt-1" role="alert">{errors.description}</p>}
              </div>

              {/* Optional Contact */}
              <div>
                <label htmlFor="report-contact-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  5. Contact Information (Optional)
                </label>
                <input
                  id="report-contact-input"
                  type="text"
                  disabled={submitting}
                  placeholder="Phone number or email (Optional — Strictly confidential)"
                  value={passengerContact}
                  onChange={(e) => setPassengerContact(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-teal-500 bg-white placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Private to administrators only. Never published in the public feed.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span>Submitting to Moderation Desk...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>Submit Passenger Report</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Trust Preview & Explanations */}
          <div className="space-y-6">
            {/* Live Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                <Eye className="w-4 h-4 text-teal-600" />
                <span>Public Preview (Trust Simulation)</span>
              </div>

              <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <TrustBadge state="UNVERIFIED" size="sm" />
                  <span className="text-[11px] text-slate-400 font-mono">Just Now</span>
                </div>

                <div className="text-xs font-bold text-slate-900">
                  {category || 'Issue Category'} at {stationName || 'Selected Station'}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic">
                  {description.trim() || 'Your description will appear here as an unverified passenger report...'}
                </p>

                <div className="pt-2 border-t border-amber-100 text-[10px] text-slate-500 flex justify-between">
                  <span>Line: {routeCode}</span>
                  <span className="text-amber-800 font-medium">Status: Pending Verification</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                By marking crowdsourced submissions as <strong className="text-slate-800">Unverified</strong>, BRT Dost prevents unconfirmed rumors or outdated passenger complaints from being mistaken for official transit operational disruptions.
              </p>
            </div>

            {/* Moderation Guide */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Moderation Policy</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                <li>Reports are reviewed by authorized BRT administrators.</li>
                <li>Validated reports can be promoted to verified public alerts.</li>
                <li>Contradictory reports are flagged as conflicts for on-ground inspection.</li>
                <li>Hate speech or abusive language will result in immediate rejection.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
