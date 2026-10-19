'use client';

import * as React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { seedService } from '@/lib/services/seed-service';
import { MobileNavProvider, useMobileNav } from '@/components/layout/mobile-nav-context';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { mobileOpen, closeMobileMenu } = useMobileNav();

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={closeMobileMenu}
      />

      <div className="lg:pl-[232px] flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    seedService.initializeIfNeeded();
  }, []);

  return (
    <MobileNavProvider>
      <DashboardShell>{children}</DashboardShell>
    </MobileNavProvider>
  );
}
