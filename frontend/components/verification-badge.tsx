import type { VerificationLevel } from '@/lib/types';
import { LEVEL_TEXT } from '@/lib/types';
import { Pill } from './ui';

// Green = ID checked, blue = email only, amber = nothing checked.
const TONE = {
  GOVT_ID: 'good',
  EMAIL: 'brand',
  NONE: 'warn',
} as const;

// A small tick, drawn inline so there is no icon library to install.
function Tick() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
      <path d="M8 1.5 2.5 3.6v3.9c0 3.1 2.3 5.9 5.5 6.9 3.2-1 5.5-3.8 5.5-6.9V3.6L8 1.5Zm2.9 4.9L7.6 9.7a.6.6 0 0 1-.9 0L5.1 8.1a.6.6 0 1 1 .9-.9l1 1 2.9-2.9a.6.6 0 0 1 .9.9Z" />
    </svg>
  );
}

// Shows what has been checked about a person.
export function VerificationBadge({
  level,
  last4,
}: {
  level: VerificationLevel;
  last4?: string | null;
}) {
  return (
    <Pill tone={TONE[level]}>
      {level === 'GOVT_ID' && <Tick />}
      {LEVEL_TEXT[level]}
      {level === 'GOVT_ID' && last4 && (
        <span className="opacity-60">····{last4}</span>
      )}
    </Pill>
  );
}

// Shows what a job requires, written from the employer's side.
export function JobRequirement({ level }: { level: VerificationLevel }) {
  const text = {
    GOVT_ID: 'ID verified applicants only',
    EMAIL: 'Email verified and above',
    NONE: 'Open to everyone',
  };

  return (
    <Pill tone={TONE[level]}>
      {level === 'GOVT_ID' && <Tick />}
      {text[level]}
    </Pill>
  );
}
