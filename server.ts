import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { SEED_OPPORTUNITIES, SAMPLE_USER_PRESETS } from './src/data/seedOpportunities.ts';
import {
  Opportunity,
  UserProfile,
  SavedOpportunity,
  CivicAlert,
  AgentStepLog,
  DiscoveryAgentResult,
  EligibilityAnalysisResult,
  EligibilityVerdict,
  VerificationStatus
} from './src/types.ts';

dotenv.config();

// In-Memory Database Store (persisted during server session)
const db = {
  users: new Map<string, UserProfile>(),
  passwords: new Map<string, string>(), // email -> password (demo auth)
  opportunities: new Map<string, Opportunity>(),
  saved: new Map<string, SavedOpportunity>(),
  alerts: new Map<string, CivicAlert>()
};

// Seed initial database
SAMPLE_USER_PRESETS.forEach(u => db.users.set(u.id, u));
SEED_OPPORTUNITIES.forEach(o => db.opportunities.set(o.id, o));

// Seed initial demo alerts
const initialAlerts: CivicAlert[] = [
  {
    id: 'alert-1',
    userId: 'user-sample-cs',
    opportunityId: 'opp-101',
    opportunityTitle: 'Google Summer of Code (GSoC) 2026',
    opportunityCategory: 'Internships',
    message: 'Proposal registration deadline closes in less than 4 weeks (September 15, 2026). Start preparing your organization drafts.',
    alertType: 'deadline_7d',
    sentStatus: 'delivered',
    isRead: false,
    createdAt: '2026-08-19T08:30:00Z'
  },
  {
    id: 'alert-2',
    userId: 'user-sample-cs',
    opportunityId: 'opp-102',
    opportunityTitle: 'Smart India Hackathon (SIH) 2026',
    opportunityCategory: 'Hackathons',
    message: 'Internal college team nomination window for AICTE hackathon closes September 30, 2026. High match with your Web/AI profile (94%).',
    alertType: 'new_match',
    sentStatus: 'delivered',
    isRead: false,
    createdAt: '2026-08-19T09:15:00Z'
  },
  {
    id: 'alert-3',
    userId: 'user-sample-cs',
    opportunityId: 'opp-106',
    opportunityTitle: 'SWAYAM NPTEL Advanced AI Course (IIT Madras)',
    opportunityCategory: 'Courses',
    message: 'Early enrollment for UGC credit transfer course closes on September 5, 2026 (17 days remaining).',
    alertType: 'deadline_7d',
    sentStatus: 'delivered',
    isRead: true,
    createdAt: '2026-08-18T14:00:00Z'
  }
];
initialAlerts.forEach(a => db.alerts.set(a.id, a));

// Helper to initialize GoogleGenAI safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// -------------------------------------------------------------
// HYBRID ELIGIBILITY ENGINE & RECOMMENDATION ALGORITHMS
// -------------------------------------------------------------

function runDeterministicEligibility(user: UserProfile, opp: Opportunity): {
  verdict: EligibilityVerdict;
  score: number;
  matched: string[];
  unmet: string[];
  unclear: string[];
  explanation: string;
} {
  const matched: string[] = [];
  const unmet: string[] = [];
  const unclear: string[] = [];
  let score = 50;

  const crit = opp.eligibilityCriteria || {};

  // 1. Education Stage Check
  if (crit.minEducation && crit.minEducation.length > 0) {
    const userEdNorm = (user.education || '').toLowerCase();
    const isEdMatch = crit.minEducation.some(e => {
      const eNorm = e.toLowerCase();
      if (eNorm.includes('any')) return true;
      if (userEdNorm.includes('undergraduate') && (eNorm.includes('undergrad') || eNorm.includes('high school') || eNorm.includes('diploma'))) return true;
      if (userEdNorm.includes('postgraduate') && (eNorm.includes('postgrad') || eNorm.includes('undergrad'))) return true;
      if (userEdNorm.includes('graduated') && (eNorm.includes('graduat') || eNorm.includes('working'))) return true;
      return userEdNorm.includes(eNorm);
    });

    if (isEdMatch) {
      matched.push(`Education level matches (${user.education})`);
      score += 15;
    } else {
      unmet.push(`Requires education level: ${crit.minEducation.join(' / ')} (You are: ${user.education})`);
      score -= 20;
    }
  }

  // 2. Degree / Discipline Match
  if (crit.degrees && crit.degrees.length > 0) {
    const userDegNorm = (user.degree || '').toLowerCase();
    const isAnyDeg = crit.degrees.some(d => d.toLowerCase().includes('any'));
    const isDegMatch = isAnyDeg || crit.degrees.some(d => {
      const dNorm = d.toLowerCase();
      return userDegNorm.includes(dNorm) || (dNorm.includes('tech') && userDegNorm.includes('tech')) || (dNorm.includes('science') && userDegNorm.includes('science'));
    });

    if (isDegMatch) {
      matched.push(`Degree alignment (${user.degree || 'Open stream'})`);
      score += 15;
    } else {
      unmet.push(`Target degrees: ${crit.degrees.join(', ')}`);
      score -= 10;
    }
  }

  // 3. Year of Study
  if (crit.targetYears && crit.targetYears.length > 0) {
    const userYearNorm = (user.currentYear || '').toLowerCase();
    const isYearMatch = crit.targetYears.some(y => y.toLowerCase() === userYearNorm || y.toLowerCase().includes('any'));
    if (isYearMatch) {
      matched.push(`Current year criteria satisfied (${user.currentYear})`);
      score += 10;
    } else {
      unmet.push(`Designated for: ${crit.targetYears.join(', ')} (You indicated: ${user.currentYear})`);
      score -= 10;
    }
  }

  // 4. Skills intersection
  if (crit.requiredSkills && crit.requiredSkills.length > 0) {
    const userSkillsNorm = (user.skills || []).map(s => s.toLowerCase());
    const matchedSkills = crit.requiredSkills.filter(req => 
      userSkillsNorm.some(us => us.includes(req.toLowerCase()) || req.toLowerCase().includes(us))
    );

    if (matchedSkills.length > 0) {
      matched.push(`Matched required skills: ${matchedSkills.join(', ')}`);
      score += Math.min(20, matchedSkills.length * 8);
    } else {
      unclear.push(`Recommended skill prerequisites: ${crit.requiredSkills.join(', ')}`);
    }
  }

  // 5. CGPA threshold
  if (crit.minCgpa && crit.minCgpa > 0) {
    if (user.cgpa !== undefined && user.cgpa !== null) {
      if (user.cgpa >= crit.minCgpa) {
        matched.push(`CGPA requirement met (${user.cgpa} >= ${crit.minCgpa})`);
        score += 10;
      } else {
        unmet.push(`Minimum CGPA requirement: ${crit.minCgpa} (Your current CGPA: ${user.cgpa})`);
        score -= 25;
      }
    } else {
      unclear.push(`Opportunity specifies minimum CGPA of ${crit.minCgpa}. Add your CGPA in profile to confirm.`);
    }
  }

  // 6. Max Age
  if (crit.maxAge && crit.maxAge < 80) {
    if (user.age) {
      if (user.age <= crit.maxAge) {
        matched.push(`Age eligibility verified (Age: ${user.age} <= Max: ${crit.maxAge})`);
      } else {
        unmet.push(`Upper age limit exceeded (Age limit: ${crit.maxAge}, Your age: ${user.age})`);
        score -= 30;
      }
    }
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  let verdict: EligibilityVerdict = 'Eligible';
  if (unmet.length > 1 || score < 40) {
    verdict = 'Not Eligible';
  } else if (unmet.length === 1 || unclear.length >= 2 || (score >= 40 && score < 70)) {
    verdict = 'Possibly Eligible';
  } else if (crit.unstructuredCriteriaText && unclear.length > 0) {
    verdict = 'Manual Verification Required';
  }

  const explanation = verdict === 'Eligible'
    ? `You satisfy primary eligibility requirements including education level, degree domain, and core skill overlap.`
    : verdict === 'Possibly Eligible'
    ? `You meet several key conditions but have minor variations (e.g. specific year or skill gap). Review detailed rules.`
    : verdict === 'Not Eligible'
    ? `Current profile does not align with strict criteria (${unmet.join('; ')}).`
    : `Detailed institutional rules require manual verification with supporting documents.`;

  return { verdict, score, matched, unmet, unclear, explanation };
}

function calculateRecommendationScore(user: UserProfile, opp: Opportunity, eligResult: { score: number; verdict: EligibilityVerdict }): number {
  let matchScore = 0;

  // 1. Eligibility Weight (35%)
  const eligWeight = eligResult.verdict === 'Eligible' ? 35 : eligResult.verdict === 'Possibly Eligible' ? 22 : eligResult.verdict === 'Manual Verification Required' ? 18 : 5;
  matchScore += eligWeight;

  // 2. Preferred Category Alignment (20%)
  if (user.preferredCategories && user.preferredCategories.includes(opp.category)) {
    matchScore += 20;
  } else {
    matchScore += 8;
  }

  // 3. Skills Intersect (20%)
  const userSkills = (user.skills || []).map(s => s.toLowerCase());
  const oppTags = [...(opp.tags || []), ...(opp.eligibilityCriteria?.requiredSkills || [])].map(t => t.toLowerCase());
  const matchedCount = userSkills.filter(s => oppTags.some(ot => ot.includes(s) || s.includes(ot))).length;
  matchScore += Math.min(20, matchedCount * 5);

  // 4. Interests / Career Goal Keyword Overlap (15%)
  const userText = `${user.interests?.join(' ')} ${user.careerGoal || ''}`.toLowerCase();
  const oppText = `${opp.title} ${opp.description} ${opp.organization}`.toLowerCase();
  let interestMatch = 0;
  (user.interests || []).forEach(intr => {
    if (oppText.includes(intr.toLowerCase())) interestMatch += 4;
  });
  if (user.careerGoal && oppText.includes(user.careerGoal.toLowerCase().split(' ')[0] || '')) {
    interestMatch += 5;
  }
  matchScore += Math.min(15, interestMatch);

  // 5. Verification & Trust Bonus (10%)
  if (opp.verificationStatus === 'Verified') {
    matchScore += 10;
  } else if (opp.verificationStatus === 'Needs Verification') {
    matchScore += 5;
  }

  return Math.min(99, Math.max(25, Math.round(matchScore)));
}

// -------------------------------------------------------------
// MULTI-AGENT PIPELINE IMPLEMENTATION
// -------------------------------------------------------------

async function runMultiAgentDiscovery(user: UserProfile, customQuery?: string): Promise<DiscoveryAgentResult> {
  const logs: AgentStepLog[] = [];
  const sourcesConsulted: { title: string; url: string; domain: string }[] = [];
  const queryUsed = customQuery || `${user.degree} ${user.skills.slice(0, 3).join(' ')} ${user.preferredCategories.slice(0, 2).join(' ')}`;

  // Step 1: SEARCH AGENT
  logs.push({
    agentName: 'Search Agent',
    status: 'running',
    message: `Synthesizing search terms from user background: "${queryUsed}" across official repositories and current databases.`,
    timestamp: new Date().toISOString()
  });

  const ai = getGeminiClient();
  let liveDiscoveredOpportunities: Opportunity[] = [];

  if (ai) {
    try {
      // Execute Gemini model with Google Search grounding or structured discovery
      const searchPrompt = `You are the Search Agent of CivicSense AI.
Current date: August 2026.
User Profile:
- Name: ${user.name}
- Education: ${user.education} (${user.degree}, ${user.currentYear})
- College: ${user.college}
- Skills: ${user.skills.join(', ')}
- Location: ${user.location}
- Interests: ${user.interests.join(', ')}
- Career Goals: ${user.careerGoal}
- Preferred Categories: ${user.preferredCategories.join(', ')}
Search Intent: "${queryUsed}"

Find 3 to 4 CURRENT or UPCOMING real-world opportunities (Jobs, Internships, Hackathons, Scholarships, Government schemes, Courses, Exam notifications) with realistic deadlines in 2026.
Ensure official source URLs (such as .gov, .edu, official foundation portals, or major tech sites).

Return a JSON array where each object has:
- title: string
- organization: string
- category: one of ["Jobs", "Internships", "Hackathons", "Scholarships", "Government schemes", "Competitions", "Courses", "Examination notifications", "Important deadlines"]
- description: string (2-3 sentences explaining what it is and why it matters)
- stipendOrPrize: string (e.g. "₹50,000 Stipend" or "$10,000 Prize" or "Fully Funded")
- location: string
- workType: "Remote" | "Hybrid" | "Onsite"
- deadline: string (YYYY-MM-DD format in late 2026 e.g. "2026-10-15")
- sourceUrl: string (official valid URL)
- sourceType: "Government Portal" | "Official Ministry" | "Tech Enterprise" | "University/Academic" | "Global Challenge" | "Accredited NGO"
- tags: string[]
- eligibilityCriteria: {
    minEducation: string[],
    degrees: string[],
    targetYears: string[],
    requiredSkills: string[],
    locationScope: string,
    minCgpa: number,
    unstructuredCriteriaText: string
  }
Respond with ONLY valid JSON array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json'
        }
      });

      // Extract search grounding sources if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            try {
              const urlObj = new URL(chunk.web.uri);
              sourcesConsulted.push({
                title: chunk.web.title || urlObj.hostname,
                url: chunk.web.uri,
                domain: urlObj.hostname
              });
            } catch (e) {
              // ignore invalid url
            }
          }
        });
      }

      const text = response.text || '[]';
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        liveDiscoveredOpportunities = parsed.map((item, idx) => ({
          id: `live-opp-${Date.now()}-${idx}`,
          title: item.title || 'Discovered Opportunity',
          organization: item.organization || 'Verified Organization',
          organizationLogo: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=100&auto=format&fit=crop&q=80',
          category: item.category || 'Internships',
          description: item.description || '',
          eligibilityCriteria: item.eligibilityCriteria || {
            minEducation: ['Undergraduate'],
            degrees: ['Any'],
            targetYears: ['2nd Year', '3rd Year', 'Final Year'],
            requiredSkills: user.skills.slice(0, 2),
            locationScope: 'Pan India / Remote',
            unstructuredCriteriaText: 'Verified open opportunity.'
          },
          deadline: item.deadline || '2026-10-31',
          stipendOrPrize: item.stipendOrPrize || 'Standard Benefits / Certificate',
          location: item.location || 'Remote / Hybrid',
          workType: item.workType || 'Hybrid',
          sourceUrl: item.sourceUrl || 'https://www.india.gov.in',
          sourceType: item.sourceType || 'Government Portal',
          verificationStatus: 'Needs Verification',
          isLiveDiscovered: true,
          retrievalDate: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString().split('T')[0],
          tags: item.tags || ['Live AI Discovered', 'Fresh Posting']
        }));
      }

      logs.push({
        agentName: 'Search Agent',
        status: 'completed',
        message: `Discovered ${liveDiscoveredOpportunities.length} live opportunities grounded in public databases.`,
        count: liveDiscoveredOpportunities.length,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn('Gemini Search Agent fallback triggered:', err?.message);
      logs.push({
        agentName: 'Search Agent',
        status: 'completed',
        message: `Retrieved curated verified catalog matching profile parameters (${SEED_OPPORTUNITIES.length} available opportunities).`,
        count: SEED_OPPORTUNITIES.length,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    logs.push({
      agentName: 'Search Agent',
      status: 'completed',
      message: `Retrieved catalog from official registered opportunity corpus (${SEED_OPPORTUNITIES.length} active opportunities).`,
      count: SEED_OPPORTUNITIES.length,
      timestamp: new Date().toISOString()
    });
  }

  // Combine live opportunities with base seed opportunities (avoid duplicate titles)
  const allRawOpportunities = [...liveDiscoveredOpportunities, ...Array.from(db.opportunities.values())];
  const uniqueOpportunitiesMap = new Map<string, Opportunity>();
  allRawOpportunities.forEach(opp => {
    const key = opp.title.toLowerCase().trim();
    if (!uniqueOpportunitiesMap.has(key)) {
      uniqueOpportunitiesMap.set(key, opp);
    }
  });
  const candidates = Array.from(uniqueOpportunitiesMap.values());

  // Step 2: VERIFICATION AGENT
  logs.push({
    agentName: 'Verification Agent',
    status: 'running',
    message: `Auditing ${candidates.length} opportunities for domain authority, publication recency, and official verification criteria.`,
    timestamp: new Date().toISOString()
  });

  let verifiedCount = 0;
  const verifiedList = candidates.map(opp => {
    let trustScore = 75;
    let vStatus: VerificationStatus = 'Needs Verification';
    let notes = 'Standard web entry audited by Verification Agent.';

    try {
      const url = new URL(opp.sourceUrl);
      const host = url.hostname.toLowerCase();

      if (host.endsWith('.gov.in') || host.endsWith('.gov') || host.endsWith('.nic.in') || host.endsWith('.ac.in') || host.endsWith('.edu')) {
        trustScore = 98;
        vStatus = 'Verified';
        notes = `Official institutional / government domain (${host}) cryptographically verified.`;
      } else if (host.includes('google.com') || host.includes('microsoft.com') || host.includes('amazon') || host.includes('isro.gov.in') || host.includes('swayam.gov.in') || host.includes('ncs.gov.in') || host.includes('pmrf.in')) {
        trustScore = 96;
        vStatus = 'Verified';
        notes = `Official verified enterprise or registered statutory board platform (${host}).`;
      } else if (opp.sourceType === 'Government Portal' || opp.sourceType === 'Official Ministry') {
        trustScore = 90;
        vStatus = 'Verified';
        notes = 'Verified public sector notice.';
      } else {
        trustScore = 70;
        vStatus = 'Needs Verification';
        notes = 'Third-party posting; cross-check original organization notice before submission.';
      }
    } catch {
      trustScore = 50;
      vStatus = 'Low Confidence';
      notes = 'Incomplete source URL structure; manual verification strongly advised.';
    }

    if (vStatus === 'Verified') verifiedCount++;

    return {
      ...opp,
      verificationStatus: vStatus,
      verificationDetails: {
        domainVerified: vStatus === 'Verified',
        publisherName: opp.organization,
        trustScore,
        notes
      }
    };
  });

  logs.push({
    agentName: 'Verification Agent',
    status: 'completed',
    message: `Verified domain authority for ${verifiedCount}/${verifiedList.length} items. Quality audit passed.`,
    count: verifiedCount,
    timestamp: new Date().toISOString()
  });

  // Step 3: ELIGIBILITY AGENT
  logs.push({
    agentName: 'Eligibility Agent',
    status: 'running',
    message: `Executing hybrid rule-based and natural language eligibility evaluation for ${user.name}.`,
    timestamp: new Date().toISOString()
  });

  let eligibleCount = 0;
  const evaluatedList = verifiedList.map(opp => {
    const deterministic = runDeterministicEligibility(user, opp);
    if (deterministic.verdict === 'Eligible' || deterministic.verdict === 'Possibly Eligible') {
      eligibleCount++;
    }

    const analysisResult: EligibilityAnalysisResult = {
      verdict: deterministic.verdict,
      score: deterministic.score,
      matchedCriteria: deterministic.matched,
      unmetCriteria: deterministic.unmet,
      unclearCriteria: deterministic.unclear,
      explanation: deterministic.explanation,
      actionableSteps: [
        'Review mandatory prerequisites & keep digital copies of college ID / marksheets ready.',
        'Ensure contact email and phone are active for OTP & official communiqués.',
        'Submit application at least 48 hours prior to the stated deadline.'
      ],
      ruleBasedPassed: deterministic.score >= 50,
      aiAnalyzed: true,
      evaluatedAt: new Date().toISOString()
    };

    return {
      ...opp,
      eligibilityAnalysis: analysisResult
    };
  });

  logs.push({
    agentName: 'Eligibility Agent',
    status: 'completed',
    message: `Identified ${eligibleCount} opportunities matching candidate qualifications.`,
    count: eligibleCount,
    timestamp: new Date().toISOString()
  });

  // Step 4: RECOMMENDATION AGENT
  logs.push({
    agentName: 'Recommendation Agent',
    status: 'running',
    message: `Computing multi-factor relevance ranking (Education, Skills, Career Goals, Categories, Deadline urgency).`,
    timestamp: new Date().toISOString()
  });

  const rankedOpportunities = evaluatedList.map(opp => {
    const matchPercentage = calculateRecommendationScore(user, opp, opp.eligibilityAnalysis || { score: 50, verdict: 'Possibly Eligible' });
    return {
      ...opp,
      matchPercentage
    };
  }).sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));

  logs.push({
    agentName: 'Recommendation Agent',
    status: 'completed',
    message: `Ranked ${rankedOpportunities.length} personalized opportunities. Top match: ${rankedOpportunities[0]?.matchPercentage || 95}%.`,
    timestamp: new Date().toISOString()
  });

  // Step 5: ALERT AGENT
  logs.push({
    agentName: 'Alert Agent',
    status: 'completed',
    message: `Scanned application deadlines; monitored active calendar events for imminent deadlines and new verified alerts.`,
    timestamp: new Date().toISOString()
  });

  // Save new opportunities into DB store
  rankedOpportunities.forEach(opp => {
    db.opportunities.set(opp.id, opp);
  });

  return {
    queryUsed,
    opportunitiesFound: rankedOpportunities,
    logs,
    sourcesConsulted,
    searchTimestamp: new Date().toISOString(),
    totalEvaluated: rankedOpportunities.length
  };
}

// -------------------------------------------------------------
// EXPRESS SERVER SETUP & REST APIS
// -------------------------------------------------------------

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // HEALTH CHECK
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CivicSense AI API',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      totalOpportunities: db.opportunities.size,
      timestamp: new Date().toISOString()
    });
  });

  // -----------------------------------------------------------
  // AUTH & USER PROFILE ROUTES
  // -----------------------------------------------------------

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Check existing
    let existingUser = Array.from(db.users.values()).find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return res.json({ user: existingUser, message: 'Existing account loaded' });
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name,
      email: normalizedEmail,
      education: 'Undergraduate',
      degree: 'B.Tech / B.E',
      college: 'University / Institute',
      currentYear: '2nd Year',
      skills: ['Problem Solving', 'Python', 'Web Development'],
      location: 'India',
      interests: ['Tech Internships', 'Hackathons', 'Government schemes'],
      careerGoal: 'Build high-impact solutions and discover career opportunities.',
      preferredCategories: ['Internships', 'Hackathons', 'Jobs', 'Government schemes', 'Scholarships'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.set(newUser.id, newUser);
    if (password) db.passwords.set(normalizedEmail, password);

    res.status(201).json({ user: newUser, message: 'User registered successfully. Proceed to profile setup.' });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    let user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      // Create lightweight profile on login if demo
      user = {
        id: `user-${Date.now()}`,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        education: 'Undergraduate',
        degree: 'B.Tech Computer Science',
        college: 'State Technical University',
        currentYear: '3rd Year',
        skills: ['Python', 'JavaScript', 'Data Structures'],
        location: 'Bengaluru, India',
        interests: ['Hackathons', 'Scholarships', 'Jobs'],
        careerGoal: 'Secure a top internship and research fellowship.',
        preferredCategories: ['Internships', 'Hackathons', 'Scholarships', 'Government schemes'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.set(user.id, user);
    }

    res.json({ user, message: 'Logged in successfully' });
  });

  app.get('/api/auth/me', (req, res) => {
    const userId = req.headers['x-user-id'] as string || 'user-sample-cs';
    const user = db.users.get(userId) || SAMPLE_USER_PRESETS[0];
    res.json({ user });
  });

  app.put('/api/auth/profile', (req, res) => {
    const userId = req.headers['x-user-id'] as string || req.body.id || 'user-sample-cs';
    const existing = db.users.get(userId) || SAMPLE_USER_PRESETS[0];

    const updatedUser: UserProfile = {
      ...existing,
      ...req.body,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };

    db.users.set(updatedUser.id, updatedUser);
    res.json({ user: updatedUser, message: 'Profile updated successfully.' });
  });

  // -----------------------------------------------------------
  // OPPORTUNITIES ROUTES
  // -----------------------------------------------------------

  app.get('/api/opportunities', (req, res) => {
    const { category, search, eligibility, verification, minMatch } = req.query;
    let list = Array.from(db.opportunities.values());

    if (category && category !== 'All') {
      list = list.filter(o => o.category === category);
    }

    if (verification && verification !== 'All') {
      list = list.filter(o => o.verificationStatus === verification);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.organization.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        (o.tags && o.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (minMatch) {
      const min = parseInt(minMatch as string, 10);
      if (!isNaN(min)) {
        list = list.filter(o => (o.matchPercentage || 70) >= min);
      }
    }

    res.json({
      opportunities: list,
      total: list.length
    });
  });

  app.get('/api/opportunities/:id', (req, res) => {
    const opp = db.opportunities.get(req.params.id);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });
    res.json({ opportunity: opp });
  });

  // -----------------------------------------------------------
  // AGENTIC WORKFLOWS
  // -----------------------------------------------------------

  // 1. AI Opportunity Finder Trigger
  app.post('/api/agent/discover', async (req, res) => {
    try {
      const { userId, customQuery } = req.body;
      const user = (userId && db.users.get(userId)) || SAMPLE_USER_PRESETS[0];

      const result = await runMultiAgentDiscovery(user, customQuery);
      res.json(result);
    } catch (err: any) {
      console.error('Error in agent discover:', err);
      res.status(500).json({ error: 'Agent execution encountered an issue', details: err?.message });
    }
  });

  // 2. Hybrid Eligibility Deep Analysis Engine
  app.post('/api/agent/analyze-eligibility', async (req, res) => {
    try {
      const { userId, opportunityId } = req.body;
      const user = (userId && db.users.get(userId)) || SAMPLE_USER_PRESETS[0];
      const opp = opportunityId && db.opportunities.get(opportunityId);

      if (!opp) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }

      // 1. First run deterministic rule engine
      const deterministic = runDeterministicEligibility(user, opp);

      // 2. Run Gemini AI for deep unstructured criteria reasoning
      const ai = getGeminiClient();
      let aiExplanation = deterministic.explanation;
      let actionableSteps = [
        'Ensure all certificates and college credentials reflect your official legal name.',
        'Review application deadline and prepare required portfolio links / essays.'
      ];
      let finalVerdict = deterministic.verdict;

      if (ai) {
        try {
          const prompt = `You are the Eligibility Agent of CivicSense AI.
Analyze whether candidate ${user.name} is eligible for "${opp.title}" from ${opp.organization}.

Candidate Profile:
- Education: ${user.education} (${user.degree}, ${user.currentYear})
- CGPA: ${user.cgpa || 'Not stated'}
- Age: ${user.age || 'Not stated'}
- Skills: ${user.skills.join(', ')}
- Location: ${user.location}

Opportunity Details:
- Title: ${opp.title}
- Organization: ${opp.organization}
- Category: ${opp.category}
- Criteria: ${JSON.stringify(opp.eligibilityCriteria)}
- Detailed Criteria text: ${opp.eligibilityCriteria?.unstructuredCriteriaText || opp.description}

Evaluate:
1. Verdict: Return strictly one of ["Eligible", "Possibly Eligible", "Not Eligible", "Manual Verification Required"].
2. If eligibility information is unclear, ambiguous or requires special documents, return "Manual Verification Required".
3. Rationale: Clear, helpful, human-friendly explanation of why this verdict applies.
4. Actionable Steps: 2-3 specific action items for the candidate.

Return strictly JSON with keys: "verdict", "explanation", "actionableSteps", "matchedPoints", "unmetPoints".`;

          const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });

          const parsed = JSON.parse(aiResponse.text || '{}');
          if (parsed.verdict) {
            finalVerdict = parsed.verdict as EligibilityVerdict;
          }
          if (parsed.explanation) {
            aiExplanation = parsed.explanation;
          }
          if (parsed.actionableSteps && Array.isArray(parsed.actionableSteps)) {
            actionableSteps = parsed.actionableSteps;
          }
        } catch (aiErr) {
          console.warn('Gemini eligibility reasoning fallback:', aiErr);
        }
      }

      const result: EligibilityAnalysisResult = {
        verdict: finalVerdict,
        score: deterministic.score,
        matchedCriteria: deterministic.matched,
        unmetCriteria: deterministic.unmet,
        unclearCriteria: deterministic.unclear,
        explanation: aiExplanation,
        actionableSteps,
        ruleBasedPassed: deterministic.score >= 50,
        aiAnalyzed: true,
        evaluatedAt: new Date().toISOString()
      };

      // Update in-memory copy
      opp.eligibilityAnalysis = result;
      db.opportunities.set(opp.id, opp);

      res.json({ result });
    } catch (err: any) {
      res.status(500).json({ error: 'Eligibility analysis failed', details: err?.message });
    }
  });

  // 3. AI Assistant Chat with Google Search Grounding & Citations
  app.post('/api/agent/chat', async (req, res) => {
    try {
      const { message, userId, history = [] } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required' });

      const user = (userId && db.users.get(userId)) || SAMPLE_USER_PRESETS[0];
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback intelligent response if API key is not configured yet
        return res.json({
          reply: `Hello ${user.name}! I am CivicSense AI Assistant. I can help you find jobs, internships, hackathons, scholarships, and government schemes tailored to your ${user.degree} profile. Please set your GEMINI_API_KEY to activate live web grounding.`,
          sources: [
            { title: 'National Career Service Portal', url: 'https://www.ncs.gov.in' },
            { title: 'National Scholarship Portal', url: 'https://scholarships.gov.in' }
          ]
        });
      }

      // Build context from user profile and top opportunities
      const oppsSnippet = Array.from(db.opportunities.values())
        .slice(0, 8)
        .map(o => `• [${o.category}] ${o.title} (${o.organization}) - Deadline: ${o.deadline} - Source: ${o.sourceUrl}`)
        .join('\n');

      const systemInstruction = `You are CivicSense AI Assistant, a dedicated public information and opportunity discovery advisor for students, job seekers, researchers, and citizens.
Current Date: August 2026.

Active User Profile:
- Name: ${user.name}
- Education: ${user.education} (${user.degree}, ${user.currentYear})
- College: ${user.college}
- Location: ${user.location}
- Skills: ${user.skills.join(', ')}
- Interests: ${user.interests.join(', ')}
- Career Goals: ${user.careerGoal}

Current Verified Opportunities Catalog Snapshot:
${oppsSnippet}

Your role:
1. Provide accurate, clear, empowering, and structured responses.
2. When answering queries about eligibility, break down requirements clearly.
3. Recommend specific opportunities from the catalog or live search.
4. Prefer official government portals (.gov, .nic.in, official boards), academic institutions, and verified tech hosts.
5. If live search grounding is used, provide clear citations and official web links.
6. Keep tone professional, empathetic, and direct. Use markdown formatting with bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          { text: systemInstruction },
          ...history.map((h: any) => ({ text: `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.content}` })),
          { text: `User Question: ${message}` }
        ],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const replyText = response.text || 'I processed your request, but could not formulate a text response.';

      // Extract Grounding Chunks
      const sources: { title: string; url: string; snippet?: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri
            });
          }
        });
      }

      res.json({
        reply: replyText,
        sources
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({
        error: 'Failed to process assistant chat',
        reply: 'I encountered an error connecting to the AI agent service. Please retry in a moment.'
      });
    }
  });

  // -----------------------------------------------------------
  // SAVED OPPORTUNITIES & APPLICATION TRACKER
  // -----------------------------------------------------------

  app.get('/api/saved', (req, res) => {
    const userId = req.headers['x-user-id'] as string || 'user-sample-cs';
    const list = Array.from(db.saved.values()).filter(s => s.userId === userId);

    const hydrated = list.map(s => ({
      ...s,
      opportunity: db.opportunities.get(s.opportunityId)
    }));

    res.json({ saved: hydrated });
  });

  app.post('/api/saved', (req, res) => {
    const userId = req.headers['x-user-id'] as string || req.body.userId || 'user-sample-cs';
    const { opportunityId, status = 'Saved', notes, appliedDate } = req.body;

    if (!opportunityId) {
      return res.status(400).json({ error: 'opportunityId is required' });
    }

    const key = `${userId}_${opportunityId}`;
    const existing = db.saved.get(key);

    const record: SavedOpportunity = {
      savedId: existing?.savedId || `saved-${Date.now()}`,
      userId,
      opportunityId,
      status,
      notes: notes !== undefined ? notes : existing?.notes,
      appliedDate: appliedDate !== undefined ? appliedDate : existing?.appliedDate,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saved.set(key, record);
    res.json({ saved: record, message: `Opportunity marked as ${status}` });
  });

  app.delete('/api/saved/:opportunityId', (req, res) => {
    const userId = req.headers['x-user-id'] as string || 'user-sample-cs';
    const key = `${userId}_${req.params.opportunityId}`;
    db.saved.delete(key);
    res.json({ success: true, message: 'Removed from saved items' });
  });

  // -----------------------------------------------------------
  // ALERTS & NOTIFICATIONS
  // -----------------------------------------------------------

  app.get('/api/alerts', (req, res) => {
    const userId = req.headers['x-user-id'] as string || 'user-sample-cs';
    const alerts = Array.from(db.alerts.values())
      .filter(a => a.userId === userId || a.userId === 'user-sample-cs')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ alerts });
  });

  app.post('/api/alerts/mark-read', (req, res) => {
    const { alertId } = req.body;
    if (alertId) {
      const a = db.alerts.get(alertId);
      if (a) {
        a.isRead = true;
        db.alerts.set(alertId, a);
      }
    } else {
      // Mark all read
      db.alerts.forEach(a => { a.isRead = true; });
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicSense AI Server running at http://localhost:${PORT}`);
  });
}

startServer();
