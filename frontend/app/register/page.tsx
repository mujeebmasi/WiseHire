'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, ErrorText, Label } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CANDIDATE' | 'EMPLOYER'>('CANDIDATE');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await register(email, password, name, role);
      // New accounts start unverified and cannot apply to most jobs,
      // so send candidates straight to the verify page.
      router.push(role === 'CANDIDATE' ? '/verify' : '/employer');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-1 text-sm text-muted">Takes less than a minute.</p>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>I am</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['CANDIDATE', 'Looking for a job'],
                  ['EMPLOYER', 'Hiring'],
                ] as const
              ).map(([value, text]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    role === value
                      ? 'border-brand bg-brand text-white'
                      : 'border-line bg-raised text-muted hover:border-brand/60'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Full name</Label>
            <input
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
            />
          </div>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-sm"
            />
            <p className="mt-1 text-xs text-muted">At least 8 characters</p>
          </div>

          {error && <ErrorText>{error}</ErrorText>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Creating…' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-muted">
            Already have one?{' '}
            <Link href="/login" className="text-brand hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
