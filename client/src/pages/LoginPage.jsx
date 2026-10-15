import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, KeyRound, AlertCircle, Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated, redirect
  if (isAuthenticated) {
    navigate('/admin', { replace: true });
  }

  const handleAutofillDemo = () => {
    setUsername('admin');
    setPassword('AdminBRT2026!');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.message || 'Invalid administrator credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-slate-900 text-teal-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-950/10">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Protected dashboard for report moderation and service announcement control
          </p>
        </div>

        {/* Demo Credentials Quickfill Box for Evaluators */}
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[10px] text-teal-800">
              Bootcamp Evaluator Quick Access
            </span>
            <button
              type="button"
              onClick={handleAutofillDemo}
              className="font-bold underline text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              Autofill Credentials
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-600 bg-white/70 p-2 rounded border border-teal-100 flex items-center justify-between">
            <span>user: <strong>admin</strong></span>
            <span>pass: <strong>AdminBRT2026!</strong></span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="admin or admin@brtdost.pk"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-teal-400" />
                  <span>Log in to Admin Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              &larr; Return to public homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
