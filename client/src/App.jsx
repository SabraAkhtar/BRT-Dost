import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DemoBanner from './components/DemoBanner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import StatusPage from './pages/StatusPage';
import ReportPage from './pages/ReportPage';
import RoutesPage from './pages/RoutesPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-4xl font-extrabold text-slate-900">404</h2>
      <p className="text-slate-600 text-sm">Station or page not found on BRT Dost network.</p>
      <Link
        to="/"
        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
          {/* Top disclaimer & principle banner */}
          <DemoBanner />

          {/* Navigation */}
          <Navbar />

          {/* Main View Router */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
