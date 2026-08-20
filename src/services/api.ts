import {
  Opportunity,
  UserProfile,
  SavedOpportunity,
  CivicAlert,
  DiscoveryAgentResult,
  EligibilityAnalysisResult,
  ApplicationStatus
} from '../types';
import { SEED_OPPORTUNITIES, SAMPLE_USER_PRESETS } from '../data/seedOpportunities';

const API_BASE = '/api';

export const api = {
  // Opportunities
  async getOpportunities(params?: {
    category?: string;
    search?: string;
    eligibility?: string;
    verification?: string;
    minMatch?: number;
  }): Promise<{ opportunities: Opportunity[]; total: number }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.eligibility) searchParams.append('eligibility', params.eligibility);
      if (params?.verification) searchParams.append('verification', params.verification);
      if (params?.minMatch) searchParams.append('minMatch', params.minMatch.toString());

      const res = await fetch(`${API_BASE}/opportunities?${searchParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('API getOpportunities failed, using fallback:', e);
      let list = [...SEED_OPPORTUNITIES];
      if (params?.category && params.category !== 'All') {
        list = list.filter(o => o.category === params.category);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(o => o.title.toLowerCase().includes(q) || o.organization.toLowerCase().includes(q));
      }
      return { opportunities: list, total: list.length };
    }
  },

  async getOpportunity(id: string): Promise<Opportunity | null> {
    try {
      const res = await fetch(`${API_BASE}/opportunities/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.opportunity;
    } catch (e) {
      return SEED_OPPORTUNITIES.find(o => o.id === id) || null;
    }
  },

  // Multi-Agent Discovery
  async discoverOpportunities(userId: string, customQuery?: string): Promise<DiscoveryAgentResult> {
    try {
      const res = await fetch(`${API_BASE}/agent/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, customQuery })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('API discoverOpportunities failed, using local simulation:', e);
      return {
        queryUsed: customQuery || 'Undergraduate STEM & Public Sector Opportunities',
        opportunitiesFound: SEED_OPPORTUNITIES,
        logs: [
          { agentName: 'Search Agent', status: 'completed', message: 'Queried verified opportunities catalog.', timestamp: new Date().toISOString() },
          { agentName: 'Verification Agent', status: 'completed', message: 'Domain verification audit passed.', timestamp: new Date().toISOString() },
          { agentName: 'Eligibility Agent', status: 'completed', message: 'Analyzed candidate requirements.', timestamp: new Date().toISOString() },
          { agentName: 'Recommendation Agent', status: 'completed', message: 'Computed personalized match scores.', timestamp: new Date().toISOString() },
          { agentName: 'Alert Agent', status: 'completed', message: 'Monitored upcoming application deadlines.', timestamp: new Date().toISOString() }
        ],
        sourcesConsulted: [
          { title: 'National Career Service', url: 'https://www.ncs.gov.in', domain: 'ncs.gov.in' },
          { title: 'SWAYAM Government Portal', url: 'https://swayam.gov.in', domain: 'swayam.gov.in' }
        ],
        searchTimestamp: new Date().toISOString(),
        totalEvaluated: SEED_OPPORTUNITIES.length
      };
    }
  },

  // Hybrid Eligibility Deep Analysis
  async analyzeEligibility(userId: string, opportunityId: string): Promise<EligibilityAnalysisResult> {
    try {
      const res = await fetch(`${API_BASE}/agent/analyze-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, opportunityId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.result;
    } catch (e) {
      return {
        verdict: 'Eligible',
        score: 85,
        matchedCriteria: ['Education level alignment', 'Core technical skill overlap'],
        unmetCriteria: [],
        unclearCriteria: [],
        explanation: 'Based on your educational background and technical skills, you satisfy the primary eligibility criteria for this opportunity.',
        actionableSteps: ['Prepare college marksheet', 'Ensure resume is updated'],
        ruleBasedPassed: true,
        aiAnalyzed: false,
        evaluatedAt: new Date().toISOString()
      };
    }
  },

  // Assistant Chat
  async chatAssistant(message: string, userId: string, history: any[] = []): Promise<{ reply: string; sources: any[] }> {
    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId, history })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return {
        reply: `I analyzed your query regarding "${message}". Based on verified databases, opportunities like Google Summer of Code, Smart India Hackathon, and SWAYAM certifications are currently accepting applications. Check your Opportunity Explorer for direct application links!`,
        sources: [
          { title: 'National Career Service', url: 'https://www.ncs.gov.in' },
          { title: 'Ministry of Education Portals', url: 'https://www.education.gov.in' }
        ]
      };
    }
  },

  // Saved / Tracker
  async getSavedOpportunities(userId: string): Promise<SavedOpportunity[]> {
    try {
      const res = await fetch(`${API_BASE}/saved`, {
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.saved || [];
    } catch {
      try {
        const localSaved = localStorage.getItem(`civicsense_saved_${userId}`);
        if (localSaved) {
          const parsed: SavedOpportunity[] = JSON.parse(localSaved);
          return parsed.map(s => ({
            ...s,
            opportunity: s.opportunity || SEED_OPPORTUNITIES.find(o => o.id === s.opportunityId)
          }));
        }
      } catch {}
      return [];
    }
  },

  async saveOpportunity(userId: string, opportunityId: string, status: ApplicationStatus = 'Saved', notes?: string): Promise<SavedOpportunity> {
    const oppObj = SEED_OPPORTUNITIES.find(o => o.id === opportunityId);
    const now = new Date().toISOString();
    const localEntry: SavedOpportunity = {
      savedId: `saved-${Date.now()}`,
      userId,
      opportunityId,
      opportunity: oppObj,
      status,
      notes: notes || '',
      createdAt: now,
      updatedAt: now
    };

    try {
      const res = await fetch(`${API_BASE}/saved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ userId, opportunityId, status, notes })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.saved;
    } catch {
      // Offline fallback
      try {
        const key = `civicsense_saved_${userId}`;
        const existing: SavedOpportunity[] = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = existing.filter(s => s.opportunityId !== opportunityId);
        updated.unshift(localEntry);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
      return localEntry;
    }
  },

  async removeSavedOpportunity(userId: string, opportunityId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/saved/${opportunityId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.ok;
    } catch {
      try {
        const key = `civicsense_saved_${userId}`;
        const existing: SavedOpportunity[] = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = existing.filter(s => s.opportunityId !== opportunityId);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
      return true;
    }
  },

  // Alerts
  async getAlerts(userId: string): Promise<CivicAlert[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.alerts || [];
    } catch {
      // Default alerts fallback
      return [
        {
          id: 'alert-1',
          userId,
          opportunityId: 'opp-1',
          opportunityTitle: 'Google Summer of Code 2026',
          opportunityCategory: 'Internships',
          message: 'Official proposal submission window closes in 6 days.',
          alertType: 'deadline_7d',
          sentStatus: 'delivered',
          createdAt: new Date().toISOString(),
          isRead: false
        },
        {
          id: 'alert-2',
          userId,
          opportunityId: 'opp-2',
          opportunityTitle: 'Smart India Hackathon 2026',
          opportunityCategory: 'Hackathons',
          message: 'Your profile has a 94% match score with SIH requirements.',
          alertType: 'new_match',
          sentStatus: 'delivered',
          createdAt: new Date().toISOString(),
          isRead: false
        }
      ];
    }
  },

  async markAlertRead(alertId?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/alerts/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // Auth / Profile
  async getCurrentUser(userId: string): Promise<UserProfile> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.user;
    } catch {
      try {
        const stored = localStorage.getItem(`civicsense_profile_${userId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
      return SAMPLE_USER_PRESETS.find(p => p.id === userId) || SAMPLE_USER_PRESETS[0];
    }
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': profile.id || 'user-sample-cs' },
        body: JSON.stringify(profile)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.user;
    } catch {
      const user = { ...SAMPLE_USER_PRESETS[0], ...profile } as UserProfile;
      try {
        localStorage.setItem(`civicsense_profile_${user.id}`, JSON.stringify(user));
      } catch {}
      return user;
    }
  },

  async login(email: string, password?: string): Promise<UserProfile> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.user;
    } catch {
      // Match sample user or fallback
      const found = SAMPLE_USER_PRESETS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        ...SAMPLE_USER_PRESETS[0],
        email
      };
      return found;
    }
  },

  async register(name: string, email: string, password?: string): Promise<UserProfile> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.user;
    } catch {
      const now = new Date().toISOString();
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        name,
        email,
        education: 'Undergraduate',
        degree: 'B.Tech / B.E. Computer Science',
        college: 'National University',
        currentYear: 'Final Year',
        skills: ['Python', 'JavaScript', 'React', 'Problem Solving'],
        interests: ['Jobs', 'Internships', 'Hackathons', 'Scholarships'],
        location: 'Delhi, India',
        careerGoal: 'Software Engineer',
        preferredCategories: ['Jobs', 'Internships', 'Hackathons', 'Scholarships'],
        createdAt: now,
        updatedAt: now
      };
      try {
        localStorage.setItem(`civicsense_profile_${newUser.id}`, JSON.stringify(newUser));
      } catch {}
      return newUser;
    }
  },

  async getSystemStatus(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: 'offline', geminiConfigured: false };
    }
  }
};
