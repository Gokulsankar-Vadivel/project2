import React, { useEffect } from 'react';
import {
  Sparkles,
  Search,
  ShieldCheck,
  CheckCircle2,
  ListFilter,
  Bell,
  Clock,
  ExternalLink,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useOpportunities } from '../context/OpportunitiesContext';
import { useAuth } from '../context/AuthContext';

interface DiscoveryModalProps {
  onCompleteViewExplorer: () => void;
}

export const DiscoveryModal: React.FC<DiscoveryModalProps> = ({ onCompleteViewExplorer }) => {
  const { user } = useAuth();
  const {
    isDiscovering,
    agentLogs,
    discoveryModalOpen,
    setDiscoveryModalOpen,
    opportunities
  } = useOpportunities();

  useEffect(() => {
    if (!isDiscovering && discoveryModalOpen && agentLogs.length >= 4) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [isDiscovering, discoveryModalOpen, agentLogs.length]);

  if (!discoveryModalOpen) return null;

  const agentsList = [
    {
      name: 'Search Agent',
      icon: Search,
      desc: 'Retrieves current opportunities matching education, skills & goals via Google Search grounding and official catalogs.'
    },
    {
      name: 'Verification Agent',
      icon: ShieldCheck,
      desc: 'Checks source domain authority (.gov, .edu, registered tech portals) and filters duplicate or outdated notices.'
    },
    {
      name: 'Eligibility Agent',
      icon: CheckCircle2,
      desc: 'Evaluates structured rule conditions (degree, year, CGPA) and unstructured criteria using Gemini LLM reasoning.'
    },
    {
      name: 'Recommendation Agent',
      icon: ListFilter,
      desc: 'Calculates multi-dimensional match percentage (0-100%) and ranks opportunities.'
    },
    {
      name: 'Alert Agent',
      icon: Bell,
      desc: 'Monitors application deadlines and generates priority notifications.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="border-b border-slate-100 p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/30 border border-blue-400/40 text-blue-300">
                <Sparkles className="h-4 w-4 animate-spin-slow" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                Multi-Agent Autonomous Pipeline
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {isDiscovering ? 'Discovering Live Opportunities...' : 'Opportunity Discovery Complete'}
            </h3>
            <p className="text-xs text-slate-300">
              Personalized for <span className="font-semibold text-white">{user.name}</span> ({user.degree})
            </p>
          </div>

          {!isDiscovering && (
            <button
              onClick={() => setDiscoveryModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Pipeline Execution Display */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {agentsList.map((agent, idx) => {
              const Icon = agent.icon;
              const matchingLog = agentLogs.find(l => l.agentName === agent.name);
              const isRunning = matchingLog?.status === 'running';
              const isCompleted = matchingLog?.status === 'completed';
              const isPending = !matchingLog;

              return (
                <div
                  key={agent.name}
                  className={`rounded-2xl border p-4 transition-all duration-300 ${
                    isRunning
                      ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-slate-200 bg-slate-50/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition ${
                        isRunning
                          ? 'bg-blue-600 text-white animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-900">{agent.name}</span>
                        {isRunning && (
                          <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping"></span>
                            Analyzing...
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[11px] text-slate-400">Waiting</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {matchingLog ? matchingLog.message : agent.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            {isDiscovering ? (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
                Processing official feeds & search citations...
              </span>
            ) : (
              <span className="font-semibold text-emerald-800">
                Found {opportunities.length} ranked opportunities ready to explore.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isDiscovering && (
              <button
                id="btn-discovery-view-results"
                onClick={() => {
                  setDiscoveryModalOpen(false);
                  onCompleteViewExplorer();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <span>View Opportunity Explorer</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
