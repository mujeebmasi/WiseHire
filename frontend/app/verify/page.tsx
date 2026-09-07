'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, ErrorText, Label } from '@/components/ui';

export default function VerifyPage() {
  const { user, loading, refresh } = useAuth();

  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <div className="mx-auto h-64 max-w-sm animate-pulse rounded-xl border border-line bg-surface" />;
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-sm text-center">
        <p>Log in first to verify your identity.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Log in</Button>
        </Link>
      </Card>
    );
  }

  if (user.verification === 'GOVT_ID') {
    return (
      <div className="mx-auto max-w-sm rounded-xl border border-good/40 bg-good-soft p-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-good/15">
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-6 text-good">
            <path d="M8 1.5 2.5 3.6v3.9c0 3.1 2.3 5.9 5.5 6.9 3.2-1 5.5-3.8 5.5-6.9V3.6L8 1.5Zm2.9 4.9L7.6 9.7a.6.6 0 0 1-.9 0L5.1 8.1a.6.6 0 1 1 .9-.9l1 1 2.9-2.9a.6.6 0 0 1 .9.9Z" />
          </svg>
        </div>

        <p className="mt-3 font-medium text-good">Your identity is verified</p>
        <p className="mt-1 text-sm text-good/80">
          You can now apply to every role on the board.
        </p>

        <Link href="/" className="mt-4 inline-block">
          <Button>Browse jobs</Button>
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api.verify({ aadhaarNumber: aadhaar, otp });
      // Reload the user so the badge in the nav bar updates straight away.
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Verify your identity
        </h1>
        <p className="mt-1 text-sm text-muted">
          One check unlocks every role on the board.
        </p>
      </div>

      {/* Being clear about this matters: nobody should type a real Aadhaar
          number into a practice project. */}
      <div className="rounded-xl border border-warn/40 bg-warn-soft p-4">
        <p className="text-sm font-medium text-warn">This is a simulation</p>
        <p className="mt-1 text-sm text-warn/80">
          There is no real connection to Aadhaar or DigiLocker. Type any 12
          digits — do not use a real Aadhaar number. The OTP is{' '}
          <span className="font-mono font-semibold">123456</span>.
        </p>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Aadhaar number</Label>
            <input
              inputMode="numeric"
              placeholder="1234 1234 1234"
              value={aadhaar}
              // Keep only digits, maximum 12.
              onChange={(e) =>
                setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))
              }
              className="font-mono tracking-widest"
            />
            <p className="mt-1 text-xs text-muted">
              Only the last 4 digits are saved.
            </p>
          </div>

          <div>
            <Label>OTP</Label>
            <input
              inputMode="numeric"
              placeholder="123456"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              className="text-center font-mono text-lg tracking-[0.4em]"
            />
          </div>

          {error && <ErrorText>{error}</ErrorText>}

          <Button
            type="submit"
            disabled={busy || aadhaar.length !== 12 || otp.length !== 6}
            className="w-full"
          >
            {busy ? 'Checking…' : 'Verify'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
