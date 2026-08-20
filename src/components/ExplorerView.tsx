import React, { useState } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { OpportunityCategory, EligibilityVerdict, VerificationStatus } from '../types';
import { useOpportunities } from '../context/OpportunitiesContext';
import { OpportunityCard } from './OpportunityCard';

interface ExplorerViewProps {
  onOpenDiscovery: () => void;
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Opportunities', value: 'All' },
  { label: 'Jobs', value: 'Jobs' },
  { label: 'Internships', value: 'Internships' },
  { label: 'Hackathons', value: 'Hackathons' },
  { label: 'Scholarships', value: 'Scholarships' },
  { label: 'Government schemes', value: 'Government schemes' },
  { label: 'Competitions', value: 'Competitions' },
  { label: 'Courses', value: 'Courses' },
  { label: 'Exam notifications', value: 'Examination notifications' },
  { label: 'Deadlines', value: 'Important deadlines' }
];

export const ExplorerView: React.FC<ExplorerViewProps> = ({ onOpenDiscovery }) => {
  const {
    filteredOpportunities,
    filters,
    setFilters,
    resetFilters,
    setSelectedOpportunity
  } = useOpportunities();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleCategoryChange = (cat: string) => {
    setFilters(prev => ({ ...prev, category: cat }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Opportunity Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Discover and verify currently available public & enterprise opportunities
          </p>
        </div>

        <button
          id="btn-explorer-find-opps"
          onClick={onOpenDiscovery}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Find Opportunities (AI Agent)</span>
        </button>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => {
          const isActive = filters.category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Search & Control Toolbar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search Input Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by role, skills, ministry, university, or keyword (e.g. Python, Drone, ISRO, IIT)..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Toggle & View Switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                showAdvancedFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={filters.sortBy}
                onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="bg-transparent font-semibold focus:outline-hidden text-xs text-slate-700 cursor-pointer"
              >
                <option value="match">Sort: Highest Match</option>
                <option value="deadline">Sort: Urgent Deadline</option>
                <option value="recent">Sort: Recently Added</option>
              </select>
            </div>

            {/* Grid / List Mode */}
            <div className="hidden sm:flex items-center rounded-xl border border-slate-200 p-1 bg-slate-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Expanded Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
            
            {/* Eligibility Filter */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Eligibility Status</label>
              <select
                value={filters.eligibility}
                onChange={e => setFilters(prev => ({ ...prev, eligibility: e.target.value }))}
                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="All">All Eligibility Verdicts</option>
                <option value="Eligible">Eligible</option>
                <option value="Possibly Eligible">Possibly Eligible</option>
                <option value="Manual Verification Required">Manual Verification Required</option>
                <option value="Not Eligible">Not Eligible</option>
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Verification Status</label>
              <select
                value={filters.verification}
                onChange={e => setFilters(prev => ({ ...prev, verification: e.target.value }))}
                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="All">All Sources</option>
                <option value="Verified">Verified Only (Gov/Edu/Official)</option>
                <option value="Needs Verification">Needs Verification</option>
                <option value="Low Confidence">Low Confidence</option>
              </select>
            </div>

            {/* Work Type Filter */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Work / Participation</label>
              <select
                value={filters.workType}
                onChange={e => setFilters(prev => ({ ...prev, workType: e.target.value }))}
                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="All">All Locations & Types</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900">{filteredOpportunities.length}</strong> opportunities
          {filters.category !== 'All' && <span> in <strong className="text-slate-900">{filters.category}</strong></span>}
        </span>
        {(filters.search || filters.category !== 'All' || filters.eligibility !== 'All' || filters.verification !== 'All') && (
          <button
            onClick={resetFilters}
            className="text-blue-600 hover:underline font-medium"
          >
            Clear active filters
          </button>
        )}
      </div>

      {/* Opportunities Grid / List */}
      {filteredOpportunities.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No opportunities match your filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms, changing the category, or running the AI Opportunity Finder to discover new live listings.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenDiscovery}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Run AI Opportunity Finder
            </button>
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
          {filteredOpportunities.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onSelect={setSelectedOpportunity}
            />
          ))}
        </div>
      )}

    </div>
  );
};
