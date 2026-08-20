import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  MapPin,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Opportunity, EligibilityVerdict, VerificationStatus } from '../types';
import { useOpportunities } from '../context/OpportunitiesContext';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect: (opportunity: Opportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onSelect }) => {
  const { isOpportunitySaved, saveOpportunity, removeSaved, getSavedStatus } = useOpportunities();
  const isSaved = isOpportunitySaved(opportunity.id);
  const savedStatus = getSavedStatus(opportunity.id);

  // Compute days left until deadline
  const now = new Date('2026-08-19'); // Consistent reference date
  const deadlineDate = new Date(opportunity.deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 7;

  // Verification status UI
  const getVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Verified Source</span>
          </span>
        );
      case 'Needs Verification':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span>Needs Verification</span>
          </span>
        );
      case 'Low Confidence':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
            <HelpCircle className="h-3 w-3 text-rose-600" />
            <span>Low Confidence</span>
          </span>
        );
    }
  };

  // Eligibility Status UI
  const getEligibilityBadge = (verdict?: EligibilityVerdict) => {
    switch (verdict) {
      case 'Eligible':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Eligible</span>
          </span>
        );
      case 'Possibly Eligible':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-bold">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Possibly Eligible</span>
          </span>
        );
      case 'Not Eligible':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-xs font-bold">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>Not Eligible</span>
          </span>
        );
      case 'Manual Verification Required':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-bold">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>Manual Verification Required</span>
          </span>
        );
    }
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      removeSaved(opportunity.id);
    } else {
      saveOpportunity(opportunity.id, 'Saved');
    }
  };

  const matchScore = opportunity.matchPercentage || 85;

  return (
    <div
      id={`card-opportunity-${opportunity.id}`}
      onClick={() => onSelect(opportunity)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-lg hover:border-blue-300 transition duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top Bar: Category, Badges, Match Score */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
              {opportunity.category}
            </span>
            {getVerificationBadge(opportunity.verificationStatus)}
            {opportunity.isLiveDiscovered && (
              <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                Live Discovered
              </span>
            )}
          </div>

          {/* Match Score Meter */}
          <div className="flex items-center gap-1 shrink-0 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 px-2.5 py-1 text-xs font-extrabold text-blue-800 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>{matchScore}% Match</span>
          </div>
        </div>

        {/* Opportunity Title and Organization */}
        <div className="mb-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
            {opportunity.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-1">
            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{opportunity.organization}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {opportunity.description}
        </p>

        {/* Key Info Pills: Location, Stipend/Prize */}
        <div className="flex flex-wrap gap-2 mb-4 text-[11px] text-slate-600 font-medium">
          {opportunity.location && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-md px-2 py-1">
              <MapPin className="h-3 w-3 text-slate-400" />
              <span className="truncate max-w-[130px]">{opportunity.location}</span>
            </div>
          )}
          {opportunity.stipendOrPrize && (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1 text-emerald-800 font-semibold">
              <span>{opportunity.stipendOrPrize}</span>
            </div>
          )}
          {opportunity.workType && (
            <div className="bg-slate-50 border border-slate-100 rounded-md px-2 py-1 text-slate-600">
              {opportunity.workType}
            </div>
          )}
        </div>

        {/* Tags */}
        {opportunity.tags && opportunity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {opportunity.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Eligibility verdict, Deadline, Action buttons */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Eligibility status */}
          <div>
            {getEligibilityBadge(opportunity.eligibilityAnalysis?.verdict || 'Eligible')}
          </div>

          {/* Deadline Countdown */}
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
              isExpired
                ? 'bg-slate-100 text-slate-500'
                : isUrgent
                ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200 animate-pulse'
                : 'bg-slate-50 text-slate-700'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>
              {isExpired
                ? 'Expired'
                : isUrgent
                ? `${diffDays}d left (Urgent)`
                : `${diffDays} days left`}
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="text-[11px] text-slate-400">
            Source: <span className="font-medium text-slate-600">{opportunity.sourceType}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Bookmark Button */}
            <button
              id={`btn-save-opp-${opportunity.id}`}
              onClick={handleSaveToggle}
              className={`p-2 rounded-xl border transition ${
                isSaved
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
              title={isSaved ? `Saved as ${savedStatus}` : 'Save to Application Tracker'}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 fill-blue-600 text-blue-600" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>

            {/* Apply / Open Source Link */}
            <a
              id={`btn-apply-opp-${opportunity.id}`}
              href={opportunity.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold transition shadow-xs"
            >
              <span>Apply</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
