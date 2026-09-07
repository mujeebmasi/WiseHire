'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { VerificationBadge } from './verification-badge';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  // Highlight the section you are in. "/" would match everything, so it is
  // compared exactly while other links match their sub-pages too.
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active ? 'bg-raised text-body' : 'text-muted hover:text-body'
      }`}
    >
      {children}
    </Link>
  );
}

export function Nav() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-page/80 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3">
        <Link href="/" className="mr-3 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
            W
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            WiseHire
          </span>
        </Link>

        <NavLink href="/">Jobs</NavLink>
        {user?.role === 'CANDIDATE' && (
          <NavLink href="/applications">My applications</NavLink>
        )}
        {user?.role === 'EMPLOYER' && <NavLink href="/employer">Hiring</NavLink>}

        <div className="ml-auto flex items-center gap-3">
          {loading ? null : user ? (
            <>
              {/* Keep nudging until they verify, since most jobs need it. */}
              {user.verification !== 'GOVT_ID' && (
                <Link
                  href="/verify"
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                >
                  Verify ID
                </Link>
              )}

              <span className="hidden sm:block">
                <VerificationBadge
                  level={user.verification}
                  last4={user.govIdLast4}
                />
              </span>

              <span className="hidden text-sm text-muted md:block">
                {user.name}
              </span>

              <button
                onClick={logout}
                className="text-sm text-muted transition-colors hover:text-body"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted transition-colors hover:text-body"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
