import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bus, ShieldAlert, AlertCircle, Menu, X, Shield, Lock, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Check Status', path: '/status' },
    { label: 'Routes & Stations', path: '/routes' },
    { label: 'About', path: '/about' }
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-teal-800 flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform">
              <Bus className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  BRT <span className="text-teal-700">Dost</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200/60 px-1.5 py-0.2 rounded">
                  Peshawar
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-none">
                Check Before You Leave
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-teal-800 bg-teal-50/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all active:scale-95"
            >
              <AlertCircle className="w-4 h-4 text-slate-950" />
              <span>Report Issue</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-teal-400" />
                  <span>Admin Hub</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-rose-600 px-2 py-2"
                  title="Log out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-medium px-2.5 py-2 rounded-md hover:bg-slate-100 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/report"
              className="bg-amber-500 text-slate-950 font-semibold text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Report</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1 shadow-lg animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-base font-medium ${
                isActive(link.path)
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-amber-500 text-slate-950 font-semibold py-2.5 rounded-lg"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Report an Issue</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center justify-between pt-1">
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-teal-800"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Dashboard ({user?.username})</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1 text-sm text-slate-600 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
