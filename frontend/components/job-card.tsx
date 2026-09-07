import Link from 'next/link';
import type { Job, VerificationLevel } from '@/lib/types';
import { isVerifiedEnough, JOB_TYPE_TEXT, WORK_MODE_TEXT } from '@/lib/types';
import { JobRequirement } from './verification-badge';

// Turns 25000 into "25,000" using Indian number grouping.
function money(amount: number) {
  return amount.toLocaleString('en-IN');
}

export function JobCard({
  job,
  myLevel,
}: {
  job: Job;
  // null when nobody is logged in, so we do not show a yes/no answer.
  myLevel: VerificationLevel | null;
}) {
  const canApply = myLevel
    ? isVerifiedEnough(myLevel, job.minVerification)
    : null;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold transition-colors group-hover:text-brand">
            {job.title}
          </h3>
          <p className="mt-0.5 text-sm text-muted">{job.company.name}</p>
        </div>

        {job.salaryMin && (
          <p className="shrink-0 text-sm font-medium tabular-nums">
            ₹{money(job.salaryMin)}
            {job.salaryMax ? ` – ₹${money(job.salaryMax)}` : ''}
          </p>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">
        {JOB_TYPE_TEXT[job.type]} · {WORK_MODE_TEXT[job.workMode]}
        {job.location ? ` · ${job.location}` : ''}
        {job._count ? ` · ${job._count.applications} applied` : ''}
      </p>

      {job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-raised px-2 py-0.5 text-xs text-muted"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <JobRequirement level={job.minVerification} />

        {/* Telling people up front saves them opening a job they cannot apply to. */}
        {canApply === false && (
          <span className="text-xs font-medium text-warn">
            Verify your ID to apply
          </span>
        )}
        {canApply === true && (
          <span className="text-xs font-medium text-good">You can apply</span>
        )}
      </div>
    </Link>
  );
}
