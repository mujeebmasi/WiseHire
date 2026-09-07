'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, errorMessage } from '@/lib/api';
import type { Application, Job, Stage } from '@/lib/types';
import {
  NEXT_STEP,
  PROGRESS_STAGES,
  STAGE_TEXT,
  isFinalStage,
} from '@/lib/types';
import { VerificationBadge } from '@/components/verification-badge';
import { ErrorText } from '@/components/ui';

export default function ApplicantsPage({
  params,
}: PageProps<'/employer/jobs/[id]'>) {
  const { id } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // Both requests can run at the same time, so we do not wait
        // for the job before starting to load the applicants.
        const [jobData, applicantData] = await Promise.all([
          api.getJob(id),
          api.getApplicants(id),
        ]);
        setJob(jobData);
        setApplicants(applicantData);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, reload]);

  // Split the list so decisions still to be made are not buried under
  // people who have already been hired or turned down.
  const open = applicants.filter((a) => !isFinalStage(a.stage));
  const closed = applicants.filter((a) => isFinalStage(a.stage));

  return (
    <div className="space-y-4">
      <Link href="/employer" className="text-sm text-muted hover:text-body">
        ← My jobs
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{job?.title ?? 'Applicants'}</h1>
        <p className="mt-1 text-sm text-muted">
          {applicants.length}{' '}
          {applicants.length === 1 ? 'person has' : 'people have'} applied. All
          of them met the verification level this job asks for.
        </p>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : applicants.length === 0 ? (
        <p className="text-sm text-muted">Nobody has applied yet.</p>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Still deciding ({open.length})
            </h2>

            {open.length === 0 ? (
              <p className="text-sm text-muted">
                You have made a decision on everyone.
              </p>
            ) : (
              open.map((application) => (
                <ApplicantCard
                  key={application.id}
                  application={application}
                  onChanged={() => setReload(reload + 1)}
                  onError={setError}
                />
              ))
            )}
          </section>

          {closed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Decided ({closed.length})
              </h2>

              {closed.map((application) => (
                <ApplicantCard
                  key={application.id}
                  application={application}
                  onChanged={() => setReload(reload + 1)}
                  onError={setError}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// Shows where this person is in the process, so the employer can see at a
// glance how far along everyone is.
function StageTrail({ stage }: { stage: Stage }) {
  if (stage === 'REJECTED') {
    return (
      <span className="rounded-full bg-bad-soft px-2.5 py-1 text-xs font-medium text-bad">
        Not selected
      </span>
    );
  }

  const reached = PROGRESS_STAGES.indexOf(stage);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {PROGRESS_STAGES.map((step, index) => (
        <span
          key={step}
          className={`rounded px-2 py-0.5 text-xs ${
            index < reached
              ? 'bg-raised text-muted'
              : index === reached
                ? 'bg-brand font-medium text-white'
                : 'text-muted/50'
          }`}
        >
          {STAGE_TEXT[step]}
        </span>
      ))}
    </div>
  );
}

// One applicant. It is its own component so that each card can keep its own
// message box, instead of the page having to track a draft per applicant.
function ApplicantCard({
  application,
  onChanged,
  onError,
}: {
  application: Application;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  // Starts empty on purpose. This box is the note for the decision you are
  // about to make, not a copy of the last one - otherwise hiring someone
  // would resend whatever you told them at the interview stage.
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const firstName = application.user?.name?.split(' ')[0] ?? 'the candidate';
  const nextStep = NEXT_STEP[application.stage];
  const finished = isFinalStage(application.stage);

  // One function behind every button. A decision and the note explaining it
  // are sent together, so the candidate never sees a change with no reason.
  async function decide(stage?: Stage) {
    setBusy(true);

    try {
      await api.updateApplication(application.id, {
        ...(stage ? { stage } : {}),
        // Leave their existing note alone when nothing new was typed.
        ...(message.trim() ? { employerMessage: message } : {}),
      });
      setMessage('');
      onChanged();
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  // The resume is behind a login check, so we cannot just link to it - the
  // browser would not send the token. Instead we fetch the file, turn it
  // into a temporary in-memory URL, and open that.
  async function openResume() {
    try {
      const file = await api.getResumeFile(application.id);
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
      // Free the memory once the new tab has had time to load it.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      onError(errorMessage(e));
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{application.user?.name}</p>
          <p className="text-sm text-muted">
            {application.user?.headline}
            {application.user?.location ? ` · ${application.user.location}` : ''}
          </p>
        </div>

        {application.user && (
          <VerificationBadge
            level={application.user.verification}
            last4={application.user.govIdLast4}
          />
        )}
      </div>

      {application.user && application.user.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {application.user.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-raised px-2 py-0.5 text-xs text-muted"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {application.coverNote && (
        <p className="mt-3 border-l-2 border-line pl-3 text-sm text-muted">
          {application.coverNote}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={openResume}
          className="rounded-lg border border-line bg-raised px-3 py-1.5 text-sm transition-colors hover:border-brand/60"
        >
          View resume
        </button>

        <StageTrail stage={application.stage} />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        {finished ? (
          <FinalState
            stage={application.stage}
            firstName={firstName}
            busy={busy}
            onReopen={() => decide('APPLIED')}
          />
        ) : (
          <>
            {application.employerMessage && (
              <div className="mb-3 rounded-lg border border-line bg-raised p-3">
                <p className="text-xs text-muted">
                  {firstName} currently sees:
                </p>
                <p className="mt-0.5 text-sm">{application.employerMessage}</p>
              </div>
            )}

            <label className="mb-1.5 block text-sm font-medium">
              Note for {firstName}{' '}
              <span className="font-normal text-muted">(optional)</span>
            </label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Nice work on the take-home. Are you free Tuesday for a call?"
              className="text-sm"
            />

            <p className="mt-1 text-xs text-muted">
              Sent with whichever button you press. Leave it blank to keep the
              note they already have.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {nextStep && (
                <button
                  onClick={() => decide(nextStep.stage)}
                  disabled={busy}
                  className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
                >
                  {busy ? 'Saving...' : nextStep.label}
                </button>
              )}

              <button
                onClick={() => decide('REJECTED')}
                disabled={busy}
                className="rounded-lg border border-bad/40 px-3.5 py-1.5 text-sm text-bad transition-colors hover:bg-bad-soft disabled:opacity-40"
              >
                Not selected
              </button>

              {/* Lets you write to someone without moving them along. */}
              <button
                onClick={() => decide()}
                disabled={busy || !message.trim()}
                className="rounded-lg border border-line bg-raised px-3.5 py-1.5 text-sm transition-colors hover:border-brand/60 disabled:opacity-40"
              >
                Send note only
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// What the card shows once a decision has been made.
function FinalState({
  stage,
  firstName,
  busy,
  onReopen,
}: {
  stage: Stage;
  firstName: string;
  busy: boolean;
  onReopen: () => void;
}) {
  const hired = stage === 'HIRED';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p
        className={`text-sm font-medium ${
          hired
            ? 'text-good'
            : 'text-muted'
        }`}
      >
        {hired
          ? `You hired ${firstName}. Nothing more to do here.`
          : `${firstName} was not selected.`}
      </p>

      <button
        onClick={onReopen}
        disabled={busy}
        className="text-sm text-muted underline transition-colors hover:text-body disabled:opacity-40"
      >
        Reopen
      </button>
    </div>
  );
}
