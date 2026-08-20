import React from 'react';
import {
  Sparkles,
  Compass,
  BookmarkCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Bot
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { useOpportunities } from '../context/OpportunitiesContext';
import { useAuth } from '../context/AuthContext';
import { OpportunityCard } from './OpportunityCard';

interface DashboardViewProps {
  onNavigateToExplorer: () => void;
  onNavigateToAssistant: () => void;
  onNavigateToSaved: () => void;
  onNavigateToNotifications: () => void;
  onOpenDiscovery: () => void;
}

const CATEGORY_COLORS = [
  '#2563eb', // blue
  '#7c3aed', // purple
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#0891b2', // cyan
  '#4f46e5', // indigo
  '#ea580c'  // orange
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToExplorer,
  onNavigateToAssistant,
  onNavigateToSaved,
  onNavigateToNotifications,
  onOpenDiscovery
}) => {
  const { user } = useAuth();
  const {
    opportunities,
    savedOpportunities,
    alerts,
    setSelectedOpportunity
  } = useOpportunities();

  // Metrics computations
  const totalOpps = opportunities.length;
  const eligibleCount = opportunities.filter(
    o => o.eligibilityAnalysis?.verdict === 'Eligible' || (o.matchPercentage || 0) >= 80
  ).length;
  const savedCount = savedOpportunities.length;
  const verifiedCount = opportunities.filter(o => o.verificationStatus === 'Verified').length;

  // Upcoming deadlines (within 20 days)
  const now = new Date('2026-08-19');
  const upcomingDeadlines = opportunities
    .filter(o => {
      const diff = Math.ceil((new Date(o.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 25;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Category Distribution Data for Recharts
  const categoryCountMap: { [cat: string]: number } = {};
  opportunities.forEach(o => {
    categoryCountMap[o.category] = (categoryCountMap[o.category] || 0) + 1;
  });
  const categoryChartData = Object.entries(categoryCountMap).map(([name, value]) => ({
    name: name.length > 14 ? `${name.substring(0, 12)}...` : name,
    fullName: name,
    value
  }));

  // Application Pipeline Status Data
  const statusCounts = {
    Saved: 0,
    Applied: 0,
    Shortlisted: 0,
    'In Review': 0,
    Selected: 0
  };
  savedOpportunities.forEach(s => {
    if (s.status in statusCounts) {
      statusCounts[s.status as keyof typeof statusCounts]++;
    } else {
      statusCounts.Saved++;
    }
  });
  const applicationStatusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }));

  // Top 4 Recommended Opportunities
  const topRecommendations = [...opportunities]
    .sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
    .slice(0, 4);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Agentic Discovery Active • Welcome, {user.name}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Personalized Public Information & Opportunity Intelligence
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Finding verified jobs, internships, hackathons, scholarships, and government schemes matching your{' '}
            <span className="font-semibold text-white">{user.degree}</span> profile.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              id="btn-dashboard-find-opps"
              onClick={onOpenDiscovery}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Run AI Opportunity Finder</span>
            </button>
            <button
              onClick={onNavigateToAssistant}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition"
            >
              <Bot className="h-4 w-4" />
              <span>Ask CivicSense AI</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Recommendations */}
        <div
          onClick={onNavigateToExplorer}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Discovered</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Compass className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalOpps}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span className="text-emerald-600 font-bold">+{verifiedCount}</span> verified public portals
          </p>
        </div>

        {/* Eligible Matches */}
        <div
          onClick={onNavigateToExplorer}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eligible Matches</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{eligibleCount}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Satisfies degree & year criteria
          </p>
        </div>

        {/* Saved Applications */}
        <div
          onClick={onNavigateToSaved}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saved Tracker</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookmarkCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600">{savedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Active in your application funnel
          </p>
        </div>

        {/* Upcoming Deadlines */}
        <div
          onClick={onNavigateToNotifications}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Deadlines</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{upcomingDeadlines.length}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Closing within next 25 days
          </p>
        </div>

      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Distribution Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Opportunities by Category</h3>
              <p className="text-xs text-slate-500">Live breakdown across public schemas and listings</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              {categoryChartData.length} Categories
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [`${value} opportunities`, item.payload.fullName]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
            {categoryChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                />
                <span className="truncate text-slate-600 font-medium">{entry.fullName} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Application Status Funnel Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Application Pipeline Status</h3>
              <p className="text-xs text-slate-500">Track saved, submitted and shortlisted opportunities</p>
            </div>
            <button
              onClick={onNavigateToSaved}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Open Tracker →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationStatusData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total in Tracker: <strong className="text-slate-800">{savedCount}</strong></span>
            <span>Applied: <strong className="text-emerald-700">{statusCounts.Applied}</strong></span>
            <span>Shortlisted: <strong className="text-indigo-700">{statusCounts.Shortlisted}</strong></span>
          </div>
        </div>

      </div>

      {/* Urgent Deadlines Feed */}
      {upcomingDeadlines.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50/70 to-orange-50/50 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Priority Application Deadlines</h3>
                <p className="text-xs text-slate-600">Opportunities with upcoming closing dates</p>
              </div>
            </div>
            <button
              onClick={onNavigateToNotifications}
              className="text-xs font-bold text-amber-800 hover:underline"
            >
              View Calendar Feed
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingDeadlines.slice(0, 3).map(opp => (
              <div
                key={opp.id}
                onClick={() => setSelectedOpportunity(opp)}
                className="rounded-2xl border border-amber-200/80 bg-white p-4 hover:shadow-md transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {opp.category}
                  </span>
                  <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {opp.deadline}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{opp.title}</h4>
                <p className="text-[11px] text-slate-500 truncate">{opp.organization}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Top Recommended Opportunities</h2>
            <p className="text-xs text-slate-500">
              Ranked by Recommendation Agent based on your profile & skills
            </p>
          </div>
          <button
            onClick={onNavigateToExplorer}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Explore All ({totalOpps})</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {topRecommendations.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onSelect={setSelectedOpportunity}
            />
          ))}
        </div>
      </div>

    </div>
  );
};
