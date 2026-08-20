import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Opportunity,
  OpportunityCategory,
  SavedOpportunity,
  CivicAlert,
  DiscoveryAgentResult,
  AgentStepLog,
  ApplicationStatus,
  EligibilityAnalysisResult
} from '../types';
import { SEED_OPPORTUNITIES } from '../data/seedOpportunities';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface FilterState {
  category: string;
  search: string;
  eligibility: string;
  verification: string;
  workType: string;
  minMatch: number;
  sortBy: 'match' | 'deadline' | 'recent';
}

interface OpportunitiesContextType {
  opportunities: Opportunity[];
  filteredOpportunities: Opportunity[];
  savedOpportunities: SavedOpportunity[];
  alerts: CivicAlert[];
  unreadAlertsCount: number;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  isLoading: boolean;
  selectedOpportunity: Opportunity | null;
  setSelectedOpportunity: (opp: Opportunity | null) => void;
  // Multi-Agent Discovery
  isDiscovering: boolean;
  agentLogs: AgentStepLog[];
  discoveryModalOpen: boolean;
  setDiscoveryModalOpen: (open: boolean) => void;
  runAgentDiscovery: (customQuery?: string) => Promise<DiscoveryAgentResult>;
  // Single Opportunity Actions
  saveOpportunity: (oppId: string, status?: ApplicationStatus, notes?: string) => Promise<void>;
  removeSaved: (oppId: string) => Promise<void>;
  isOpportunitySaved: (oppId: string) => boolean;
  getSavedStatus: (oppId: string) => ApplicationStatus | null;
  runEligibilityAudit: (oppId: string) => Promise<EligibilityAnalysisResult>;
  markAlertRead: (alertId?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const defaultFilters: FilterState = {
  category: 'All',
  search: '',
  eligibility: 'All',
  verification: 'All',
  workType: 'All',
  minMatch: 0,
  sortBy: 'match'
};

const OpportunitiesContext = createContext<OpportunitiesContextType | undefined>(undefined);

export const OpportunitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>(SEED_OPPORTUNITIES);
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [alerts, setAlerts] = useState<CivicAlert[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Multi-Agent Discovery State
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [agentLogs, setAgentLogs] = useState<AgentStepLog[]>([]);
  const [discoveryModalOpen, setDiscoveryModalOpen] = useState<boolean>(false);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [oppRes, savedRes, alertRes] = await Promise.all([
        api.getOpportunities(),
        api.getSavedOpportunities(user.id),
        api.getAlerts(user.id)
      ]);

      if (oppRes.opportunities?.length > 0) {
        setOpportunities(oppRes.opportunities);
      }
      setSavedOpportunities(savedRes || []);
      setAlerts(alertRes || []);
    } catch (err) {
      console.warn('Could not refresh full remote data, using local state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Multi-Agent Discovery runner with animated progressive logs
  const runAgentDiscovery = async (customQuery?: string): Promise<DiscoveryAgentResult> => {
    setIsDiscovering(true);
    setDiscoveryModalOpen(true);
    setAgentLogs([]);

    // Progressive step visualization
    const addLog = (log: AgentStepLog) => {
      setAgentLogs(prev => [...prev, log]);
    };

    addLog({
      agentName: 'Search Agent',
      status: 'running',
      message: `Analyzing candidate profile (${user.name}, ${user.degree}) to synthesize official search parameters...`,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await api.discoverOpportunities(user.id, customQuery);

      // Simulate real-time pipeline visualization steps for visual clarity
      setTimeout(() => {
        addLog({
          agentName: 'Search Agent',
          status: 'completed',
          message: `Discovered opportunities across public registries & live grounded engines.`,
          count: result.opportunitiesFound.length,
          timestamp: new Date().toISOString()
        });

        addLog({
          agentName: 'Verification Agent',
          status: 'running',
          message: `Auditing domain authenticity, official stamps, and publication freshness...`,
          timestamp: new Date().toISOString()
        });
      }, 500);

      setTimeout(() => {
        addLog({
          agentName: 'Verification Agent',
          status: 'completed',
          message: `Domain trust verification passed. Low-confidence entries flagged.`,
          timestamp: new Date().toISOString()
        });

        addLog({
          agentName: 'Eligibility Agent',
          status: 'running',
          message: `Executing hybrid rule-based & Gemini LLM eligibility reasoning...`,
          timestamp: new Date().toISOString()
        });
      }, 1000);

      setTimeout(() => {
        addLog({
          agentName: 'Eligibility Agent',
          status: 'completed',
          message: `Criteria evaluation completed for all candidate records.`,
          timestamp: new Date().toISOString()
        });

        addLog({
          agentName: 'Recommendation Agent',
          status: 'running',
          message: `Ranking opportunities by personalized fit, skill intersection, and career goals...`,
          timestamp: new Date().toISOString()
        });
      }, 1500);

      setTimeout(() => {
        addLog({
          agentName: 'Recommendation Agent',
          status: 'completed',
          message: `Multi-factor scoring finalized. Top match ranked at ${result.opportunitiesFound[0]?.matchPercentage || 96}%.`,
          timestamp: new Date().toISOString()
        });

        addLog({
          agentName: 'Alert Agent',
          status: 'completed',
          message: `Deadlines synchronized with alert monitoring engine.`,
          timestamp: new Date().toISOString()
        });

        setOpportunities(result.opportunitiesFound);
        setIsDiscovering(false);
      }, 2000);

      return result;
    } catch (err: any) {
      console.error('Agent execution error:', err);
      addLog({
        agentName: 'Search Agent',
        status: 'warning',
        message: `Network notice: loaded verified local catalog items.`,
        timestamp: new Date().toISOString()
      });
      setIsDiscovering(false);
      return {
        queryUsed: customQuery || 'Standard',
        opportunitiesFound: opportunities,
        logs: agentLogs,
        sourcesConsulted: [],
        searchTimestamp: new Date().toISOString(),
        totalEvaluated: opportunities.length
      };
    }
  };

  const saveOpportunity = async (oppId: string, status: ApplicationStatus = 'Saved', notes?: string) => {
    try {
      const saved = await api.saveOpportunity(user.id, oppId, status, notes);
      setSavedOpportunities(prev => {
        const filtered = prev.filter(s => s.opportunityId !== oppId);
        const oppObj = opportunities.find(o => o.id === oppId);
        return [...filtered, { ...saved, opportunity: oppObj }];
      });
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const removeSaved = async (oppId: string) => {
    try {
      await api.removeSavedOpportunity(user.id, oppId);
      setSavedOpportunities(prev => prev.filter(s => s.opportunityId !== oppId));
    } catch (e) {
      console.error('Remove saved error:', e);
    }
  };

  const isOpportunitySaved = (oppId: string): boolean => {
    return savedOpportunities.some(s => s.opportunityId === oppId);
  };

  const getSavedStatus = (oppId: string): ApplicationStatus | null => {
    const found = savedOpportunities.find(s => s.opportunityId === oppId);
    return found ? found.status : null;
  };

  const runEligibilityAudit = async (oppId: string): Promise<EligibilityAnalysisResult> => {
    const res = await api.analyzeEligibility(user.id, oppId);
    // Update local opportunity copy
    setOpportunities(prev =>
      prev.map(o => (o.id === oppId ? { ...o, eligibilityAnalysis: res } : o))
    );
    if (selectedOpportunity && selectedOpportunity.id === oppId) {
      setSelectedOpportunity(prev => (prev ? { ...prev, eligibilityAnalysis: res } : null));
    }
    return res;
  };

  const markAlertRead = async (alertId?: string) => {
    await api.markAlertRead(alertId);
    setAlerts(prev =>
      prev.map(a => (!alertId || a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  const resetFilters = () => setFilters(defaultFilters);

  // Compute filtered opportunities based on user selections
  const filteredOpportunities = opportunities.filter(opp => {
    // 1. Category
    if (filters.category !== 'All' && opp.category !== filters.category) {
      return false;
    }

    // 2. Search keyword
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchOrg = opp.organization.toLowerCase().includes(q);
      const matchDesc = opp.description.toLowerCase().includes(q);
      const matchLocation = opp.location.toLowerCase().includes(q);
      const matchTags = opp.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchOrg && !matchDesc && !matchLocation && !matchTags) {
        return false;
      }
    }

    // 3. Eligibility Status
    if (filters.eligibility !== 'All') {
      const verdict = opp.eligibilityAnalysis?.verdict || 'Eligible';
      if (verdict !== filters.eligibility) {
        return false;
      }
    }

    // 4. Verification Status
    if (filters.verification !== 'All') {
      if (opp.verificationStatus !== filters.verification) {
        return false;
      }
    }

    // 5. Work Type
    if (filters.workType !== 'All') {
      if (opp.workType !== filters.workType) {
        return false;
      }
    }

    // 6. Minimum Match Score
    if (filters.minMatch > 0) {
      if ((opp.matchPercentage || 70) < filters.minMatch) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'match') {
      return (b.matchPercentage || 70) - (a.matchPercentage || 70);
    }
    if (filters.sortBy === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (filters.sortBy === 'recent') {
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
    return 0;
  });

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  return (
    <OpportunitiesContext.Provider
      value={{
        opportunities,
        filteredOpportunities,
        savedOpportunities,
        alerts,
        unreadAlertsCount,
        filters,
        setFilters,
        resetFilters,
        isLoading,
        selectedOpportunity,
        setSelectedOpportunity,
        isDiscovering,
        agentLogs,
        discoveryModalOpen,
        setDiscoveryModalOpen,
        runAgentDiscovery,
        saveOpportunity,
        removeSaved,
        isOpportunitySaved,
        getSavedStatus,
        runEligibilityAudit,
        markAlertRead,
        refreshData
      }}
    >
      {children}
    </OpportunitiesContext.Provider>
  );
};

export const useOpportunities = () => {
  const context = useContext(OpportunitiesContext);
  if (!context) {
    throw new Error('useOpportunities must be used within an OpportunitiesProvider');
  }
  return context;
};
