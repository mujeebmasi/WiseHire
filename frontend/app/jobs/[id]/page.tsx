'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Job } from '@/lib/types';
import {
  isVerifiedEnough,
  JOB_TYPE_TEXT,
  LEVEL_TEXT,
  WORK_MODE_TEXT,
} from '@/lib/types';
import { JobRequirement } from '@/components/verification-badge';
import { Button, Card, ErrorText, Label } from '@/components/ui';

function money(amount: number) {
  return amount.toLocaleString('en-IN');
}

export default function JobPage({ params }: PageProps<'/jobs/[id]'>) {
  // In this version of Next.js the route params arrive as a promise,
  // and use() unwraps it.
  const { id } = use(params);
  const { user, loading: userLoading } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getJob(id)
      .then(setJob)
      .catch((e: unknown) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <ErrorText>{error}</ErrorText>;

  if (!job) {
    return <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />;
  }

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-muted hover:text-body">
        ← All jobs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
          <p className="mt-1 text-muted">{job.company.name}</p>
          <p className="mt-2 text-sm text-muted">
            {JOB_TYPE_TEXT[job.type]} · {WORK_MODE_TEXT[job.workMode]}
            {job.location ? ` · ${job.location}` : ''}
          </p>
        </div>

        {job.salaryMin && (
          <p className="text-lg font-semibold tabular-nums">
            ₹{money(job.salaryMin)}
            {job.salaryMax ? ` – ₹${money(job.salaryMax)}` : ''}
          </p>
        )}
      </div>

      <JobRequirement level={job.minVerification} />

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          About this role
        </h2>
        <p className="whitespace-pre-wrap leading-relaxed">{job.description}</p>

        {job.skills.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-raised px-2.5 py-1 text-xs text-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </Card>

      {userLoading ? null : !user ? (
        <SignInPrompt level={job.minVerification} />
      ) : user.role !== 'CANDIDATE' ? (
        <Card>
          <p className="text-sm text-muted">
            You are signed in as an employer, so you cannot apply to roles.
          </p>
        </Card>
      ) : !isVerifiedEnough(user.verification, job.minVerification) ? (
        <NeedsVerification job={job} />
      ) : (
        <ApplyForm jobId={job.id} companyName={job.company.name} />
      )}
    </div>
  );
}

function SignInPrompt({ level }: { level: Job['minVerification'] }) {
  return (
    <Card>
      <p className="text-sm">
        Log in to apply. This role is open to {LEVEL_TEXT[level]} candidates.
      </p>
      <Link href="/login" className="mt-4 inline-block">
        <Button>Log in</Button>
      </Link>
    </Card>
  );
}

// Shown instead of the form when the account is below what the job asks for.
// The API refuses these applications anyway; this just says so earlier.
function NeedsVerification({ job }: { job: Job }) {
  return (
    <div className="rounded-xl border border-warn/40 bg-warn-soft p-5">
      <p className="font-medium text-warn">
        You need to verify your identity first
      </p>
      <p className="mt-1 text-sm text-warn/80">
        This role only accepts applicants who are{' '}
        {LEVEL_TEXT[job.minVerification]}. It takes about 30 seconds.
      </p>
      <Link href="/verify" className="mt-4 inline-block">
        <Button>Verify my ID</Button>
      </Link>
    </div>
  );
}

function ApplyForm({
  jobId,
  companyName,
}: {
  jobId: string;
  companyName: string;
}) {
  const [resume, setResume] = useState<File | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!resume) return;

    setSending(true);
    setError('');

    try {
      await api.apply(jobId, resume, coverNote);
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not apply');
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-good/40 bg-good-soft p-5">
        <p className="font-medium text-good">Application sent</p>
        <p className="mt-1 text-sm text-good/80">
          {companyName} can now see your verified profile and CV.
        </p>
        <Link
          href="/applications"
          className="mt-3 inline-block text-sm text-brand hover:underline"
        >
          Track my applications →
        </Link>
      </div>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-semibold">Apply for this role</h2>

        <div>
          <Label>Résumé (PDF)</Label>
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>

        <div>
          <Label>
            Cover note <span className="font-normal text-muted">(optional)</span>
          </Label>
          <textarea
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Why this role, in a couple of sentences."
            className="text-sm"
          />
        </div>

        {error && <ErrorText>{error}</ErrorText>}

        <Button type="submit" disabled={sending || !resume}>
          {sending ? 'Sending…' : 'Send application'}
        </Button>
      </form>
    </Card>
  );
}
