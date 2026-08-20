import React from 'react';
import {
  LayoutDashboard,
  Compass,
  BookmarkCheck,
  Bot,
  Bell,
  UserCheck,
  Settings,
  Sparkles,
  Search,
  Award,
  GraduationCap,
  Briefcase,
  HelpCircle
} from 'lucide-react';
import { useOpportunities } from '../context/OpportunitiesContext';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenDiscovery: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onOpenDiscovery
}) => {
  const { unreadAlertsCount, savedOpportunities } = useOpportunities();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'explorer',
      label: 'Opportunity Explorer',
      icon: Compass,
      badge: 'Live'
    },
    {
      id: 'assistant',
      label: 'AI Public Assistant',
      icon: Bot,
      badge: 'Gemini'
    },
    {
      id: 'saved',
      label: 'Application Tracker',
      icon: BookmarkCheck,
      badge: savedOpportunities.length > 0 ? savedOpportunities.length.toString() : null
    },
    {
      id: 'notifications',
      label: 'Deadlines & Alerts',
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount.toString() : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'profile',
      label: 'Profile & Eligibility',
      icon: UserCheck,
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings & Status',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-slate-200 bg-slate-50/50 p-4 justify-between h-[calc(100vh-4rem)] sticky top-16">
      <div className="space-y-6">
        
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Multi-Agent System Card */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/90 to-indigo-50/50 p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Agentic Architecture</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            5 autonomous agents discover, verify domains, audit eligibility, and calculate relevance scores.
          </p>
          <button
            id="sidebar-btn-run-agents"
            onClick={onOpenDiscovery}
            className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3 w-3" />
            <span>Run Agent Scanner</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200/80 px-2 space-y-1 text-slate-500 text-[11px]">
        <div className="flex items-center justify-between">
          <span>CivicSense AI</span>
          <span className="font-medium text-emerald-600">v2.4 Live</span>
        </div>
        <p className="text-[10px] text-slate-400">Grounding via Gemini 3.7 & Official Portals</p>
      </div>
    </aside>
  );
};
