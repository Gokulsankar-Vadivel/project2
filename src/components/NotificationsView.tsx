import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Trash2,
  Layers,
  Filter
} from 'lucide-react';
import { useOpportunities } from '../context/OpportunitiesContext';
import { CivicAlert } from '../types';

export const NotificationsView: React.FC = () => {
  const { alerts, markAlertRead, setSelectedOpportunity, opportunities } = useOpportunities();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'unread') return !a.isRead;
    if (filterType === 'deadlines') return a.alertType.includes('deadline');
    if (filterType === 'matches') return a.alertType === 'new_match';
    return true;
  });

  const getAlertIcon = (type: string) => {
    if (type.includes('deadline')) return Clock;
    if (type === 'new_match') return Sparkles;
    return ShieldCheck;
  };

  const getAlertStyle = (type: string) => {
    if (type.includes('deadline')) {
      return {
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        iconBg: 'bg-amber-500 text-white'
      };
    }
    if (type === 'new_match') {
      return {
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        iconBg: 'bg-blue-600 text-white'
      };
    }
    return {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white'
    };
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Deadlines & System Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated Alert Agent monitors application milestones, approaching cutoffs, and new verified matches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => markAlertRead()}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: 'Unread Only' },
          { id: 'deadlines', label: 'Deadline Warnings' },
          { id: 'matches', label: 'New AI Matches' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setFilterType(item.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterType === item.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No alerts in this category</p>
            <p className="text-xs text-slate-500">
              Alert Agent will notify you when deadlines approach within 7, 3, or 1 days.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const Icon = getAlertIcon(alert.alertType);
            const style = getAlertStyle(alert.alertType);

            return (
              <div
                key={alert.id}
                onClick={() => {
                  markAlertRead(alert.id);
                  if (alert.opportunityId) {
                    const opp = opportunities.find(o => o.id === alert.opportunityId);
                    if (opp) setSelectedOpportunity(opp);
                  }
                }}
                className={`group rounded-2xl border p-4 sm:p-5 transition flex items-start gap-4 cursor-pointer ${
                  !alert.isRead
                    ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 ${style.iconBg} shadow-xs`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {alert.opportunityTitle ? (
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate max-w-md">
                          {alert.opportunityTitle}
                        </h4>
                      ) : (
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">System Notification</h4>
                      )}
                      {!alert.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(alert.createdAt).toLocaleDateString()} at{' '}
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    {alert.opportunityCategory && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.badge}`}>
                        {alert.opportunityCategory}
                      </span>
                    )}

                    <div className="text-xs font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
                      <span>Inspect Opportunity Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
