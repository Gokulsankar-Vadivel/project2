import React, { useState } from 'react';
import {
  Sparkles,
  Bell,
  Search,
  User,
  ShieldCheck,
  Zap,
  LogOut,
  ChevronDown,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOpportunities } from '../context/OpportunitiesContext';
import { SAMPLE_USER_PRESETS } from '../data/seedOpportunities';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenDiscovery: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenDiscovery
}) => {
  const { user, switchUserPreset, setAuthModalOpen, setAuthModalMode, isAuthenticated, logout } = useAuth();
  const { alerts, unreadAlertsCount, markAlertRead, setSelectedOpportunity, opportunities } = useOpportunities();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand & Live Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2.5 text-left group transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900">CivicSense</span>
                <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">AI</span>
              </div>
              <p className="hidden sm:block text-[11px] font-medium text-slate-500">Public Opportunity & Eligibility Engine</p>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1.5 ml-3 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Multi-Agent Live</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          
          {/* Main Agent Button: "Find Opportunities" */}
          <button
            id="btn-find-opportunities-navbar"
            onClick={onOpenDiscovery}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-sky-200 animate-spin-slow" />
            <span>Find Opportunities</span>
          </button>

          {/* Alerts Notification Bell with Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications-bell"
              onClick={() => {
                setAlertsDropdownOpen(!alertsDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              title="Notifications and Deadlines"
            >
              <Bell className="h-5 w-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-bounce">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Panel */}
            {alertsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-sm text-slate-900">Deadline & System Alerts</span>
                  </div>
                  {unreadAlertsCount > 0 && (
                    <button
                      onClick={() => markAlertRead()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                      No active alerts
                    </div>
                  ) : (
                    alerts.slice(0, 5).map(alert => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          markAlertRead(alert.id);
                          if (alert.opportunityId) {
                            const opp = opportunities.find(o => o.id === alert.opportunityId);
                            if (opp) setSelectedOpportunity(opp);
                          }
                          setAlertsDropdownOpen(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 transition cursor-pointer ${
                          !alert.isRead ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                              alert.alertType.includes('deadline')
                                ? 'bg-amber-500'
                                : alert.alertType === 'new_match'
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <div className="flex-1">
                            {alert.opportunityTitle && (
                              <p className="text-xs font-semibold text-slate-900 mb-0.5 line-clamp-1">
                                {alert.opportunityTitle}
                              </p>
                            )}
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {alert.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(alert.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setCurrentView('notifications');
                      setAlertsDropdownOpen(false);
                    }}
                    className="w-full py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All Notifications & Calendar →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Selector & Account */}
          <div className="relative">
            <button
              id="btn-user-profile-menu"
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setAlertsDropdownOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 sm:px-3 sm:py-1.5 hover:bg-slate-100 transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left max-w-[120px]">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.education}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Menu Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <div className="mt-2 flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{user.degree} • {user.currentYear}</span>
                  </div>
                </div>

                {/* Preset Switcher for Fast Demonstration */}
                <div className="px-4 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Switch Test Persona
                  </p>
                  <div className="space-y-1">
                    {SAMPLE_USER_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          switchUserPreset(preset.id);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                          user.id === preset.id
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{preset.name} ({preset.degree.split(' ')[0]})</span>
                        {user.id === preset.id && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={() => {
                      setCurrentView('profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Edit User Profile & Skills</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span>Diagnostics & API Status</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setAuthModalOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4 text-slate-400" />
                    <span>Switch Account / Sign In</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
