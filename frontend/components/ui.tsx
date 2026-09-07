// Small building blocks used across the pages, so a card or a button looks
// the same everywhere and the pages stay readable.

import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface p-5 ${className}`}
    >
      {children}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  // primary = the main action, quiet = secondary, danger = rejecting someone.
  variant?: 'primary' | 'quiet' | 'danger';
  className?: string;
};

const BUTTON_STYLES = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  quiet: 'border border-line bg-raised text-body hover:border-brand',
  danger: 'border border-bad/40 text-bad hover:bg-bad-soft',
};

export function Button({
  children,
  onClick,
  type = 'button',
  disabled,
  variant = 'primary',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_STYLES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// A small rounded label. `tone` picks the colour.
export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'good' | 'warn' | 'bad';
}) {
  const tones = {
    neutral: 'bg-raised text-muted',
    brand: 'bg-brand-soft text-brand',
    good: 'bg-good-soft text-good',
    warn: 'bg-warn-soft text-warn',
    bad: 'bg-bad-soft text-bad',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-body">
      {children}
    </span>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-bad/40 bg-bad-soft px-3 py-2 text-sm text-bad">
      {children}
    </p>
  );
}
