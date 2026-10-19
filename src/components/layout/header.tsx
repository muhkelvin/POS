'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { formatHeaderDate, formatTimeJakarta } from '@/lib/formatters';
import { useMobileNav } from './mobile-nav-context';

export interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onOpenMobileMenu?: () => void;
}

export function Header({ title, description, actions, onOpenMobileMenu }: HeaderProps) {
  const [currentTime, setCurrentTime] = React.useState<string>('');
  const [currentDate, setCurrentDate] = React.useState<string>('');
  const mobileNav = useMobileNav();

  const handleMenuClick = onOpenMobileMenu || mobileNav.openMobileMenu;

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(formatTimeJakarta(now));
      setCurrentDate(formatHeaderDate(now));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[var(--paper)]">
      <div className="px-3 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleMenuClick}
            className="lg:hidden p-2 text-[var(--ink)] hover:bg-[var(--surface)] active:bg-[var(--line)] rounded-[4px] border border-[var(--line)] min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-[28px] font-semibold tracking-tight text-[var(--ink)] leading-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-[var(--ink-muted)] mt-0.5 line-clamp-1 sm:line-clamp-none">{description}</p>
            )}
          </div>
        </div>

        {/* Right: Actions and Live Asia/Jakarta Clock */}
        <div className="flex items-center gap-3 justify-between md:justify-end w-full md:w-auto">
          {actions && <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">{actions}</div>}

          {/* Time & Date in Asia/Jakarta */}
          <div className="hidden sm:flex flex-col items-end border-l border-[var(--line)] pl-3 font-mono text-xs shrink-0">
            <span className="font-semibold text-[var(--ink)] tabular-nums">{currentTime || '...'}</span>
            <span className="text-[10px] text-[var(--ink-muted)]">{currentDate || '...'}</span>
          </div>
        </div>
      </div>

      {/* Dashed line divider underneath header per PRD 5A.5 */}
      <div className="border-b border-dashed border-[var(--line-dashed)] w-full" />
    </header>
  );
}
