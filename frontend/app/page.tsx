'use client';

import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Job } from '@/lib/types';
import { JOB_TYPE_TEXT } from '@/lib/types';
import { JobCard } from '@/components/job-card';
import { ErrorText } from '@/components/ui';

const TYPES = ['INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT'] as const;

export default function JobsPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait 300ms after the last keystroke before asking the API, so typing
    // "react" sends one request instead of five.
    const timer = setTimeout(async () => {
      try {
        const data = await api.getJobs({ search, type });
        setJobs(data);
        setError('');
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    }, 300);

    // Runs before the next effect, cancelling the request we no longer need.
    return () => clearTimeout(timer);
  }, [search, type]);

  return (
    <div className="space-y-8">
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-good" />
          Every applicant is identity checked
        </span>

        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Hire people who are
          <br />
          <span className="text-brand italic">actually who they say</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-muted">
          Each job sets the level of proof it wants. Applications from anyone
          below that line are turned away before they reach the employer.
        </p>
      </section>

      <section className="space-y-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or skill — try “react”"
          className="text-sm"
        />

        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              // Clicking the active filter again clears it.
              onClick={() => setType(type === t ? '' : t)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                type === t
                  ? 'border-brand bg-brand text-white'
                  : 'border-line bg-surface text-muted hover:border-brand/60 hover:text-body'
              }`}
            >
              {JOB_TYPE_TEXT[t]}
            </button>
          ))}
        </div>
      </section>

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        // Grey blocks the same shape as the cards, so the page does not jump
        // around once the real ones arrive.
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-line bg-surface"
            />
          ))}
        </div>
      ) : jobs.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center">
          <p className="font-medium">No jobs match that search</p>
          <p className="mt-1 text-sm text-muted">
            Try a shorter word, or clear the filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {jobs.length} {jobs.length === 1 ? 'role' : 'roles'}
          </p>

          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              myLevel={user ? user.verification : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
