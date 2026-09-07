import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Nav } from '@/components/nav';

// Loaded through next/font so the file is served from our own domain and
// the text does not flicker while a web font downloads.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'WiseHire',
  description:
    'A job board where applicants verify their identity before applying.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        {/* AuthProvider must wrap everything that calls useAuth(). */}
        <AuthProvider>
          <Nav />

          <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>

          <footer className="mx-auto w-full max-w-5xl px-4 pb-10 pt-4">
            <p className="border-t border-line pt-4 text-xs text-muted">
              Demo project. Identity verification is simulated — no real Aadhaar
              data is used or stored.
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
