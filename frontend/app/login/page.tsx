'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, ErrorText, Label } from '@/components/ui';

// The accounts created by the seed script, so you can try the app quickly.
const DEMO = [
  { email: 'verified@example.com', label: 'Candidate', note: 'ID verified' },
  { email: 'email-only@example.com', label: 'Candidate', note: 'Email only' },
  { email: 'employer@example.com', label: 'Employer', note: 'Sanshi Network Tech' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const user = await login(email, password);
      // Employers go to their jobs, candidates to the job list.
      router.push(user.role === 'EMPLOYER' ? '/employer' : '/');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Log in to apply or to hire.</p>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <Label>Password</Label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-sm"
            />
          </div>

          {error && <ErrorText>{error}</ErrorText>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Logging in…' : 'Log in'}
          </Button>

          <p className="text-center text-sm text-muted">
            No account?{' '}
            <Link href="/register" className="text-brand hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </Card>

      <Card>
        <p className="text-sm font-medium">Try it without signing up</p>
        <p className="mt-0.5 text-xs text-muted">
          Password for all three: password123
        </p>

        <div className="mt-3 space-y-2">
          {DEMO.map((account) => (
            <button
              key={account.email}
              onClick={() => {
                setEmail(account.email);
                setPassword('password123');
              }}
              className="flex w-full items-center justify-between rounded-lg border border-line bg-raised px-3 py-2 text-left transition-colors hover:border-brand/60"
            >
              <span>
                <span className="block text-sm">{account.label}</span>
                <span className="block text-xs text-muted">{account.email}</span>
              </span>
              <span className="text-xs text-muted">{account.note}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
