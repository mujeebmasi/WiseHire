// These match what the API sends back.

export type VerificationLevel = 'NONE' | 'EMAIL' | 'GOVT_ID';
export type UserRole = 'CANDIDATE' | 'EMPLOYER';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';
export type WorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type Stage =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  headline?: string | null;
  location?: string | null;
  skills: string[];
  role: UserRole;
  verification: VerificationLevel;
  govIdLast4?: string | null;
}

export interface Company {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  type: JobType;
  workMode: WorkMode;
  location?: string | null;
  skills: string[];
  minVerification: VerificationLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  isOpen: boolean;
  createdAt: string;
  company: { id: string; name: string; description?: string | null };
  _count?: { applications: number };
}

export interface Application {
  id: string;
  jobId: string;
  resumeName: string;
  coverNote?: string | null;
  stage: Stage;
  // A note written back by the employer. Null until they send one.
  employerMessage?: string | null;
  createdAt: string;
  // Present when the candidate lists their own applications.
  job?: Job;
  // Present when an employer lists applicants for a job.
  user?: {
    id: string;
    name: string;
    headline?: string | null;
    location?: string | null;
    skills: string[];
    verification: VerificationLevel;
    govIdLast4?: string | null;
  };
}

// The same order as LEVEL_VALUE in the API's verification.ts.
// Used to show whether you can apply before you click into a job.
const LEVEL_ORDER: VerificationLevel[] = ['NONE', 'EMAIL', 'GOVT_ID'];

export function isVerifiedEnough(
  userLevel: VerificationLevel,
  required: VerificationLevel,
) {
  return LEVEL_ORDER.indexOf(userLevel) >= LEVEL_ORDER.indexOf(required);
}

export const LEVEL_TEXT: Record<VerificationLevel, string> = {
  NONE: 'Not verified',
  EMAIL: 'Email verified',
  GOVT_ID: 'ID verified',
};

export const JOB_TYPE_TEXT: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
};

export const WORK_MODE_TEXT: Record<WorkMode, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

export const STAGE_TEXT: Record<Stage, string> = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Not selected',
};

export const ALL_STAGES: Stage[] = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
];

// The normal path an application travels, in order. REJECTED is not here
// because it can happen at any point and ends things early.
export const PROGRESS_STAGES: Stage[] = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
];

// What the employer's main button offers at each stage. Written as a plain
// object so the whole hiring flow can be read in one glance - and changed by
// editing one line.
export const NEXT_STEP: Partial<Record<Stage, { stage: Stage; label: string }>> =
  {
    APPLIED: { stage: 'SHORTLISTED', label: 'Shortlist' },
    SHORTLISTED: { stage: 'INTERVIEW', label: 'Invite to interview' },
    INTERVIEW: { stage: 'OFFER', label: 'Make an offer' },
    OFFER: { stage: 'HIRED', label: 'Hire' },
  };

// Hired or rejected means the process is over, so we stop offering buttons
// that move it along.
export function isFinalStage(stage: Stage) {
  return stage === 'HIRED' || stage === 'REJECTED';
}
