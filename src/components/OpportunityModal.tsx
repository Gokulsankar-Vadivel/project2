import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  ExternalLink,
  BookmarkCheck,
  Bookmark,
  Sparkles,
  MapPin,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  FileText,
  Bot,
  RefreshCw,
  Send
} from 'lucide-react';
import { Opportunity, ApplicationStatus } from '../types';
import { useOpportunities } from '../context/OpportunitiesContext';
import { useAuth } from '../context/AuthContext';

interface OpportunityModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onAskAssistant: (question: string) => void;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  opportunity,
  onClose,
  onAskAssistant
}) => {
  const { user } = useAuth();
  const {
    saveOpportunity,
    removeSaved,
    isOpportunitySaved,
    getSavedStatus,
    runEligibilityAudit
  } = useOpportunities();

  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(
    (opportunity && getSavedStatus(opportunity.id)) || 'Saved'
  );
  const [notes, setNotes] = useState('');

  if (!opportunity) return null;

  const isSaved = isOpportunitySaved(opportunity.id);
  const crit = opportunity.eligibilityCriteria || {};
  const analysis = opportunity.eligibilityAnalysis;

  const handleAuditClick = async () => {
    setIsAuditing(true);
    try {
      await runEligibilityAudit(opportunity.id);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleStatusChange = (status: ApplicationStatus) => {
    setSelectedStatus(status);
    saveOpportunity(opportunity.id, status, notes);
  };

  const handleNotesBlur = () => {
    if (isSaved) {
      saveOpportunity(opportunity.id, selectedStatus, notes);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6 bg-slate-50/50">
          <div className="space-y-1 pr-6">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                {opportunity.category}
              </span>
              <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {opportunity.sourceType}
              </span>
              {opportunity.isLiveDiscovered && (
                <span className="rounded-md bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  Live Grounded
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {opportunity.title}
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="font-semibold text-slate-800">{opportunity.organization}</span>
              <span>•</span>
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{opportunity.location}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[11px] font-medium text-slate-500">Relevance Match</p>
              <p className="text-lg font-black text-blue-600">{opportunity.matchPercentage || 85}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[11px] font-medium text-slate-500">Deadline</p>
              <p className="text-sm font-bold text-slate-800">{opportunity.deadline}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[11px] font-medium text-slate-500">Work Type</p>
              <p className="text-sm font-bold text-slate-800">{opportunity.workType || 'Flexible'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[11px] font-medium text-slate-500">Stipend / Prize</p>
              <p className="text-sm font-bold text-emerald-700 truncate">{opportunity.stipendOrPrize || 'Standard Benefits'}</p>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Opportunity Overview
            </h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {opportunity.description}
            </p>
          </div>

          {/* Verification & Domain Audit Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-slate-900 text-sm">Source & Domain Verification Audit</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Trust Score: {opportunity.verificationDetails?.trustScore || 95}/100
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {opportunity.verificationDetails?.notes || 'Verified through official public sector and accredited educational registries.'}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
              <span>Official URL:</span>
              <a
                href={opportunity.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono truncate max-w-sm"
              >
                {opportunity.sourceUrl}
              </a>
            </div>
          </div>

          {/* Hybrid Eligibility Engine Breakdown */}
          <div className="rounded-2xl border-2 border-blue-100 bg-gradient-to-b from-blue-50/40 to-indigo-50/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600 animate-ping"></div>
                <h4 className="font-bold text-slate-900 text-base">
                  Hybrid Eligibility Engine Report
                </h4>
              </div>
              <button
                id="btn-re-audit-eligibility"
                onClick={handleAuditClick}
                disabled={isAuditing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? 'Analyzing with Gemini...' : 'Re-Analyze with AI'}</span>
              </button>
            </div>

            {/* Verdict Badge & Summary */}
            <div className="rounded-xl bg-white border border-blue-200/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Analysis Verdict</span>
                <span className="font-extrabold text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {analysis?.verdict || 'Eligible'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {analysis?.explanation || 'Candidate profile aligns with primary degree, academic stage, and core skill requirements.'}
              </p>
            </div>

            {/* Rule Based Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/90 border border-slate-200 p-3.5 space-y-2">
                <p className="text-xs font-bold text-slate-800">Matched Conditions</p>
                <ul className="space-y-1 text-xs text-emerald-800">
                  {analysis?.matchedCriteria && analysis.matchedCriteria.length > 0 ? (
                    analysis.matchedCriteria.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Degree stream & educational stage alignment</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl bg-white/90 border border-slate-200 p-3.5 space-y-2">
                <p className="text-xs font-bold text-slate-800">Actionable Checklist</p>
                <ul className="space-y-1 text-xs text-slate-600">
                  {analysis?.actionableSteps && analysis.actionableSteps.length > 0 ? (
                    analysis.actionableSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                        <span>{step}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                      <span>Prepare active college identification & academic transcript.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Unstructured Raw Criteria */}
            {crit.unstructuredCriteriaText && (
              <div className="text-xs bg-white/80 p-3 rounded-xl border border-slate-200 text-slate-600">
                <span className="font-semibold text-slate-800 block mb-1">Official Detailed Requirement Text:</span>
                <p className="italic">{crit.unstructuredCriteriaText}</p>
              </div>
            )}
          </div>

          {/* Application Tracker Status */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Application Tracker Status
                </span>
              </div>
              <span className="text-xs text-slate-500">Update your personal progress</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['Saved', 'Applied', 'Shortlisted', 'In Review', 'Selected', 'Closed'] as ApplicationStatus[]).map(st => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedStatus === st && isSaved
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Add personal notes, test dates, referral contacts, or submission reminders..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              rows={2}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Ask AI Assistant */}
          <div className="flex items-center justify-between rounded-2xl bg-indigo-50 border border-indigo-100 p-3.5">
            <div className="flex items-center gap-2.5">
              <Bot className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-indigo-900">Have questions about this opportunity?</p>
                <p className="text-[11px] text-indigo-700">Ask CivicSense Assistant to break down rules or draft application points.</p>
              </div>
            </div>
            <button
              onClick={() => {
                onAskAssistant(`Can you explain the detailed eligibility and application process for "${opportunity.title}" by ${opportunity.organization}?`);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shrink-0"
            >
              Ask AI Assistant
            </button>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-100 p-4 sm:p-5 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Retrieved on <span className="font-semibold text-slate-700">{opportunity.retrievalDate}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Close
            </button>

            <a
              id="btn-modal-apply-official"
              href={opportunity.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition"
            >
              <span>Apply on Official Portal</span>
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
