export type OpportunityCategory =
  | 'Jobs'
  | 'Internships'
  | 'Hackathons'
  | 'Scholarships'
  | 'Government schemes'
  | 'Competitions'
  | 'Courses'
  | 'Examination notifications'
  | 'Important deadlines';

export type EligibilityVerdict =
  | 'Eligible'
  | 'Possibly Eligible'
  | 'Not Eligible'
  | 'Manual Verification Required';

export type VerificationStatus =
  | 'Verified'
  | 'Needs Verification'
  | 'Low Confidence';

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Shortlisted'
  | 'In Review'
  | 'Selected'
  | 'Closed';

export type AlertType =
  | 'deadline_7d'
  | 'deadline_3d'
  | 'deadline_tomorrow'
  | 'expired'
  | 'new_match'
  | 'verification_update';

export interface EligibilityCriteria {
  minEducation?: string[];
  degrees?: string[];
  targetYears?: string[];
  requiredSkills?: string[];
  locationScope?: string;
  minCgpa?: number;
  maxAge?: number;
  unstructuredCriteriaText?: string;
}

export interface EligibilityAnalysisResult {
  verdict: EligibilityVerdict;
  score: number; // 0 - 100
  matchedCriteria: string[];
  unmetCriteria: string[];
  unclearCriteria: string[];
  explanation: string;
  actionableSteps: string[];
  ruleBasedPassed: boolean;
  aiAnalyzed: boolean;
  evaluatedAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  organizationLogo?: string;
  category: OpportunityCategory;
  description: string;
  eligibilityCriteria: EligibilityCriteria;
  deadline: string; // ISO format or YYYY-MM-DD
  stipendOrPrize?: string;
  location: string;
  workType?: 'Remote' | 'Onsite' | 'Hybrid';
  sourceUrl: string;
  sourceType: 'Government Portal' | 'Official Ministry' | 'Tech Enterprise' | 'University/Academic' | 'Global Challenge' | 'Accredited NGO';
  verificationStatus: VerificationStatus;
  verificationDetails?: {
    domainVerified: boolean;
    publisherName: string;
    trustScore: number; // 0 - 100
    notes: string;
  };
  isLiveDiscovered?: boolean;
  retrievalDate: string;
  lastUpdated: string;
  matchPercentage?: number;
  eligibilityAnalysis?: EligibilityAnalysisResult;
  tags: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  education: string; // e.g. "Undergraduate", "Postgraduate", "High School", "Diploma", "Doctorate", "Working Professional"
  degree: string; // e.g. "B.Tech Computer Science", "B.Sc Agriculture", "B.Com", "MBA"
  college: string;
  currentYear: string; // e.g. "1st Year", "2nd Year", "3rd Year", "Final Year", "Graduated"
  cgpa?: number;
  age?: number;
  skills: string[];
  location: string; // e.g. "Bengaluru, Karnataka", "Pune, Maharashtra", "New Delhi", "Remote / All India"
  interests: string[];
  careerGoal: string;
  preferredCategories: OpportunityCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedOpportunity {
  savedId: string;
  userId: string;
  opportunityId: string;
  opportunity?: Opportunity;
  status: ApplicationStatus;
  notes?: string;
  appliedDate?: string;
  reminderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CivicAlert {
  id: string;
  userId: string;
  opportunityId?: string;
  opportunityTitle?: string;
  opportunityCategory?: OpportunityCategory;
  message: string;
  alertType: AlertType;
  sentStatus: 'delivered' | 'pending';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface AgentStepLog {
  agentName: 'Search Agent' | 'Verification Agent' | 'Eligibility Agent' | 'Recommendation Agent' | 'Alert Agent';
  status: 'running' | 'completed' | 'warning' | 'error';
  message: string;
  details?: string;
  timestamp: string;
  count?: number;
}

export interface DiscoveryAgentResult {
  queryUsed: string;
  opportunitiesFound: Opportunity[];
  logs: AgentStepLog[];
  sourcesConsulted: { title: string; url: string; domain: string }[];
  searchTimestamp: string;
  totalEvaluated: number;
}

export interface ChatSourceCitation {
  title: string;
  url: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: ChatSourceCitation[];
  recommendedOpportunityIds?: string[];
  isSearchingWeb?: boolean;
}
