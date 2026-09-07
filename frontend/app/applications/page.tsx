'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Application, Stage } from '@/lib/types';
import { PROGRESS_STAGES, STAGE_TEXT } from '@/lib/types';
import { Button, Card, ErrorText } from '@/components/ui';

export default function MyApplicationsPage() {
  const { user, loading: userLoading } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userLoading || !user) return;

    // Written as an async function inside the effect because an effect
    // itself is not allowed to be async.
    (async () => {
      try {
        const data = await api.getMyApplications();
        setApplications(data);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [userLoading, user]);

  if (userLoading) {
    return <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />;
  }

  // Checked before `loading`, which stays true for signed-out visitors because
  // no fetch is ever started for them.
  if (!user) {
    return (
      <Card className="text-center">
        <p>Log in to see your applications.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Log in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My applications</h1>
        <p className="mt-1 text-sm text-muted">
          {applications.length}{' '}
          {applications.length === 1 ? 'application' : 'applications'}
        </p>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl border border-line bg-surface" />
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center">
          <p className="font-medium">Nothing yet</p>
          <p className="mt-1 text-sm text-muted">
            Applications you send will show up here.
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Browse jobs</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const company = application.job?.company.name;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/jobs/${application.jobId}`}
            className="font-semibold hover:text-brand"
          >
            {application.job?.title}
          </Link>
          <p className="mt-0.5 text-sm text-muted">{company}</p>
        </div>
      </div>

      <div className="mt-5">
        <Outcome stage={application.stage} company={company} />
      </div>

      {/* Anything the employer wrote back. Null until they send one. */}
      {application.employerMessage && (
        <div className="mt-5 rounded-lg border border-brand/30 bg-brand-soft p-3">
          <p className="text-xs font-medium text-brand">
            Message from {company}
          </p>
          <p className="mt-1 text-sm">{application.employerMessage}</p>
        </div>
      )}

      <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
        Applied {new Date(application.createdAt).toLocaleDateString()} ·{' '}
        {application.resumeName}
      </p>
    </Card>
  );
}

// Either the progress bar, or a clear ending if there is one.
function Outcome({ stage, company }: { stage: Stage; company?: string }) {
  if (stage === 'REJECTED') {
    return (
      <div className="rounded-lg border border-line bg-raised p-4">
        <p className="text-sm font-medium">Not selected this time</p>
        <p className="mt-1 text-sm text-muted">
          {company} has closed your application. There are plenty of other roles
          on the board.
        </p>
      </div>
    );
  }

  if (stage === 'HIRED') {
    return (
      <div className="rounded-lg border border-good/40 bg-good-soft p-4">
        <p className="text-sm font-medium text-good">You got the job</p>
        <p className="mt-1 text-sm text-good/80">
          {company} has hired you. They will be in touch with the details.
        </p>
      </div>
    );
  }

  return <Progress stage={stage} />;
}

// A bar per step, filled up to wherever the application has reached, so
// "what happens next" is obvious without reading anything.
function Progress({ stage }: { stage: Stage }) {
  const reached = PROGRESS_STAGES.indexOf(stage);

  return (
    <div className="flex gap-1.5">
      {PROGRESS_STAGES.map((step, index) => (
        <div key={step} className="flex-1">
          <div
            className={`h-1 rounded-full ${
              index <= reached ? 'bg-brand' : 'bg-line'
            }`}
          />
          <p
            className={`mt-1.5 text-xs ${
              index === reached ? 'font-medium text-brand' : 'text-muted'
            }`}
          >
            {STAGE_TEXT[step]}
          </p>
        </div>
      ))}
    </div>
  );
}
