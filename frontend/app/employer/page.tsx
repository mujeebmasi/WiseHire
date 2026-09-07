'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Company, Job } from '@/lib/types';
import { JOB_TYPE_TEXT, WORK_MODE_TEXT } from '@/lib/types';
import { JobRequirement } from '@/components/verification-badge';
import { ErrorText } from '@/components/ui';

// Shared styles, written once so the forms below stay readable.
const inputStyle = 'text-sm';

export default function EmployerPage() {
  const { user, loading: userLoading } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJobForm, setShowJobForm] = useState(false);
  // Changing this number re-runs the effect below, which reloads everything.
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (userLoading || !user) return;

    (async () => {
      try {
        const mine = await api.getMyCompany();
        setCompany(mine);

        // Only ask for jobs once we know there is a company to have them.
        setJobs(mine ? await api.getMyJobs() : []);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [userLoading, user, reload]);

  async function toggleOpen(job: Job) {
    try {
      await api.setJobOpen(job.id, !job.isOpen);
      setReload(reload + 1);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (userLoading || loading) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  if (!user || user.role !== 'EMPLOYER') {
    return (
      <div className="text-center">
        <p>This page is for employer accounts.</p>
        <Link href="/login" className="mt-3 inline-block text-sm text-brand hover:underline">
          Log in as an employer
        </Link>
      </div>
    );
  }

  // A new employer has no company yet, so there is nothing else to show
  // until they add one.
  if (!company) {
    return (
      <CompanyForm
        onCreated={() => {
          setLoading(true);
          setReload(reload + 1);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="mt-1 text-sm text-muted">
            Everyone who applies has already passed the verification level you
            set on the job.
          </p>
        </div>

        <button
          onClick={() => setShowJobForm(!showJobForm)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          {showJobForm ? 'Cancel' : 'Post a job'}
        </button>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {showJobForm && (
        <JobForm
          onPosted={() => {
            setShowJobForm(false);
            setLoading(true);
            setReload(reload + 1);
          }}
        />
      )}

      {jobs.length === 0 ? (
        <p className="text-sm text-muted">
          You have not posted any jobs yet.
        </p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-line bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{job.title}</h2>
                  <p className="text-sm text-muted">
                    {JOB_TYPE_TEXT[job.type]} · {WORK_MODE_TEXT[job.workMode]}
                    {job.location ? ` · ${job.location}` : ''}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    job.isOpen
                      ? 'bg-good-soft text-good'
                      : 'bg-raised text-muted'
                  }`}
                >
                  {job.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>

              <div className="mt-3">
                <JobRequirement level={job.minVerification} />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/employer/jobs/${job.id}`}
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                >
                  {job._count?.applications ?? 0}{' '}
                  {job._count?.applications === 1 ? 'applicant' : 'applicants'}
                </Link>

                <button
                  onClick={() => toggleOpen(job)}
                  className="rounded-lg border border-line bg-raised px-3 py-1.5 text-sm transition-colors hover:border-brand/60"
                >
                  {job.isOpen ? 'Close job' : 'Reopen job'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Shown to an employer who has just signed up.
function CompanyForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api.createCompany({
        name,
        // Send undefined rather than an empty string, so the optional
        // fields are simply left out.
        description: description || undefined,
        website: website || undefined,
      });
      onCreated();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Add your company</h1>
        <p className="mt-1 text-sm text-muted">
          Candidates see this on your job posts. You only do this once.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-xl border border-line bg-surface p-5"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium">Company name</label>
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sanshi Network Tech"
            className={inputStyle}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            What you do <span className="text-muted">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            className={inputStyle}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Website <span className="text-muted">(optional)</span>
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className={inputStyle}
          />
        </div>

        {error && <ErrorText>{error}</ErrorText>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
        >
          {busy ? 'Saving...' : 'Save company'}
        </button>
      </form>
    </div>
  );
}

function JobForm({ onPosted }: { onPosted: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('INTERNSHIP');
  const [workMode, setWorkMode] = useState('REMOTE');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [minVerification, setMinVerification] = useState('GOVT_ID');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api.createJob({
        title,
        description,
        type,
        workMode,
        location: location || undefined,
        // "React, NestJS" becomes ["react", "nestjs"].
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        minVerification,
        // Number inputs arrive as strings, and an empty box must stay empty
        // rather than becoming 0.
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
      });
      onPosted();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-line bg-surface p-5"
    >
      <h2 className="font-semibold">New job</h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Title</label>
        <input
          required
          minLength={3}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Full Stack Developer Intern"
          className={inputStyle}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Description</label>
        <textarea
          required
          minLength={20}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="What the person will actually work on."
          className={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputStyle}
          >
            {Object.entries(JOB_TYPE_TEXT).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Where</label>
          <select
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
            className={inputStyle}
          >
            {Object.entries(WORK_MODE_TEXT).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Location <span className="text-muted">(optional)</span>
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Hyderabad"
          className={inputStyle}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Skills <span className="text-muted">(separated by commas)</span>
        </label>
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="react, typescript, nestjs"
          className={inputStyle}
        />
      </div>

      {/* The point of the whole app: the employer chooses the bar here. */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Who is allowed to apply</label>
        <select
          value={minVerification}
          onChange={(e) => setMinVerification(e.target.value)}
          className={inputStyle}
        >
          <option value="GOVT_ID">Only ID verified candidates</option>
          <option value="EMAIL">Email verified candidates and above</option>
          <option value="NONE">Anyone</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Salary from <span className="text-muted">(optional)</span>
          </label>
          <input
            type="number"
            min={0}
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="15000"
            className={inputStyle}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Salary to <span className="text-muted">(optional)</span>
          </label>
          <input
            type="number"
            min={0}
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="25000"
            className={inputStyle}
          />
        </div>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
      >
        {busy ? 'Posting...' : 'Post job'}
      </button>
    </form>
  );
}
