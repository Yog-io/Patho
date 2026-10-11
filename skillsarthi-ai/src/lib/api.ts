/** Pathora AI — typed client for the Patho MSDE backend (Express :5001). */

export const API_BASE: string =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_URL ?? '';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${path}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export interface HealthStats {
  status: string;
  service: string;
  database: string;
  stats: { activeSessions: number; storedQAPairs: number; signedAccords: number };
}

export interface SessionCreated {
  sessionId: string;
  studentName: string;
  district: string;
  state: string;
  createdAt: string;
}

export interface IntakeTurn {
  sessionId: string;
  stepNumber: number;
  counselorMessage: string;
  questionId: string;
  questionType: 'mcq' | 'scenario' | 'text';
  options: string[];
  traitVector?: Record<string, number>;
  isIntakeComplete: boolean;
  summaryMessage?: string;
}

export interface RoleSource {
  title: string;
  url: string;
}

export interface CareerRole {
  id: string;
  title: string;
  nsqfLevel: number;
  sector: string;
  qpCode: string;
  description: string;
  dayToDay: string;
  workEnvironment: string;
  academicPrerequisite: string;
  entryStipend: number;
  firstYearSalary: number;
  threeYearSalary: number;
  fiveYearSalary: number;
  ncrfCreditBridge: string;
  accreditedTrades: string[];
  hiringPartners: string[];
  topClusters: string[];
  badge: string;
  matchScore?: number;
  aiPitch?: string;
  sources?: RoleSource[];
}

export interface MediationTurn {
  speaker: string;
  stage: string;
  title: string;
  message: string;
  vernacularSummary?: string;
  workEnvironment?: string;
  hiringPartners?: string[];
  comparisonData?: unknown;
  boosterOffered?: {
    title: string;
    wageBoost: string;
    stipendDuringTraining: string;
    projectedYear1Wage: string;
    explanation: string;
  };
  ncrfCredits?: string;
  readyForAccord?: boolean;
}

export interface AccordMilestone {
  period: string;
  goal: string;
  financialCommitment: string;
  parentWhy?: string;
  evidence?: string;
  tuitionFees?: string;
  corporatePartners?: string;
  higherEdDegree?: string;
}

export interface DegreeOption {
  title: string;
  provider: string;
  mode: string;
  duration: string;
  entryRoute: string;
}

export interface CourseOption {
  title: string;
  provider: string;
  duration: string;
  detail: string;
}

export interface AccordSigned {
  success: boolean;
  accordCode: string;
  personalized?: boolean;
  grounded?: boolean;
  accord: {
    accordCode: string;
    studentName: string;
    parentName: string;
    careerTitle: string;
    nsqfLevel: number;
    instituteSelected: string;
    napsStipendCommitted: number;
    targetYr1Salary: number;
    workEnvironment: string;
    ncrfBridge: string;
    milestones: AccordMilestone[];
    degreeOptions: DegreeOption[];
    courses: CourseOption[];
    sources?: RoleSource[];
    signedDate: string;
  };
}

export type Phase = 'intake' | 'careers' | 'parent' | 'mediation' | 'accord';

export interface ConsultationSummary {
  sessionId: string;
  studentName: string;
  district: string;
  state: string;
  updatedAt: string;
  answered: number;
  hasPending: boolean;
  hasLock: boolean;
  lockedTitle: string | null;
  hasParent: boolean;
  mediationTurns: number;
  hasAccord: boolean;
  accordCode: string | null;
  resumePhase: Phase;
}

export interface QaRow {
  id: number;
  session_id: string;
  step_number: number;
  question_id: string;
  question_text: string;
  question_type: string;
  options_json: string;
  user_response: string;
  extracted_traits_json: string | null;
  status: 'asked' | 'answered';
}

export interface SessionDetail {
  session: Record<string, unknown> & { student_name: string; district: string; state: string; intake_summary: string | null };
  qaInteractions: QaRow[];
  lockedGoal: Record<string, unknown> | null;
  parentProfile: Record<string, unknown> | null;
  mediationTurns: Record<string, unknown>[];
  accord: (Record<string, unknown> & {
    accord_code: string; student_name: string; parent_name: string;
    career_title: string; milestones: AccordMilestone[];
    degreeOptions: DegreeOption[]; courses: CourseOption[]; sources: RoleSource[];
  }) | null;
  match: { roles: CareerRole[]; grounded: boolean } | null;
  intakeSummary: string | null;
  resumePhase: Phase;
}

export interface ItiInstitute {
  id: string;
  name: string;
  code: string;
  rating: number;
  schemesAvailable: string[];
  tradesOffered: string[];
  feesPerYear: string;
  address: string;
  phone: string;
}

export interface ItiDistrict {
  district: string;
  state: string;
  industrialCorridors: {
    name: string;
    distanceKm: number;
    majorCompanies: string[];
    napsStipendBenchmark?: number;
    averageBusTransport?: string;
  }[];
  accreditedInstitutes: ItiInstitute[];
}

export interface AiConfig {
  apiBaseUrl: string;
  modelName: string;
  useCustomApi: boolean;
  hasApiKey: boolean;
}

export const api = {
  health: () => req<HealthStats>('/api/health'),
  getAiConfig: () => req<AiConfig>('/api/config/ai'),
  createSession: (body: { studentName: string; district: string; state: string }) =>
    req<SessionCreated>('/api/sessions', { method: 'POST', body: JSON.stringify(body) }),
  studentIntake: (body: {
    sessionId: string;
    lang?: string;
    userResponse?: string;
    questionId?: string;
  }) => req<IntakeTurn>('/api/chat/student-intake', { method: 'POST', body: JSON.stringify(body) }),
  matchRoles: (sessionId: string, force = false) =>
    req<{ roles: CareerRole[]; personalized: boolean; grounded: boolean; cached?: boolean }>(
      '/api/careers/match',
      { method: 'POST', body: JSON.stringify({ sessionId, force }) },
    ),
  lockCareer: (body: { sessionId: string; role: CareerRole }) =>
    req<{ success: boolean; lockedGoal: CareerRole }>('/api/careers/lock', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  parentIntake: (body: {
    sessionId: string;
    parentName: string;
    relation: string;
    language: string;
    minSalaryMonthly: number;
    maxCommuteKm: number;
    stigmaConcerns: string[];
    safetyConcerns: string[];
    rawVoiceTranscript: string;
  }) => req<{ success: boolean }>('/api/parent/intake', { method: 'POST', body: JSON.stringify(body) }),
  mediationTurn: (body: { sessionId: string; turnNumber: number; parentDoubts?: string }) =>
    req<MediationTurn>('/api/mediation/turn', { method: 'POST', body: JSON.stringify(body) }),
  signAccord: (body: { sessionId: string; instituteSelected: string }) =>
    req<AccordSigned>('/api/accord/sign', { method: 'POST', body: JSON.stringify(body) }),
  itis: () => req<ItiDistrict[]>('/api/datasets/itis'),
  wages: () => req<Record<string, unknown>>('/api/datasets/wages'),
  inspector: () =>
    req<{
      sessions: Record<string, unknown>[];
      qaInteractions: Record<string, unknown>[];
      lockedGoals: Record<string, unknown>[];
      parentProfiles: Record<string, unknown>[];
      mediationSessions: Record<string, unknown>[];
      familyAccords: Record<string, unknown>[];
    }>('/api/db/inspector'),
  consultations: () => req<{ sessions: ConsultationSummary[] }>('/api/sessions'),
  sessionDetail: (id: string) => req<SessionDetail>(`/api/sessions/${encodeURIComponent(id)}`),
  loadRahul: () => req<{
    success: boolean;
    sessionId: string;
    roles: CareerRole[];
    lockedRoleId: string;
    grounded: boolean;
    personaNote: string;
  }>('/api/demo/load-rahul', { method: 'POST' }),
};

export function inr(n: number): string {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}
