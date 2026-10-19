import type { Metadata } from 'next';
import { Instrument_Sans, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument-sans',
  subsets: ['latin'],
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NexaPOS — Retail Point of Sale',
  description: 'Sistem Point of Sale retail berbasis web dengan konsep Kertas & Tinta.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${instrumentSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--paper)] text-[var(--ink)] font-sans">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--ink)',
              borderRadius: '4px',
              fontFamily: 'var(--font-sans)',
              boxShadow: 'none',
            },
            className: 'text-sm font-sans',
          }}
        />
      </body>
    </html>
  );
}
