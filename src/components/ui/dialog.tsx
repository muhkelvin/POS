'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = 'md',
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* 40% ink overlay per Section 5A.3 */}
      <div
        className="fixed inset-0 bg-[#1B1A17]/40 transition-opacity backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog card: 6px radius, --surface background, 1px --line border */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full rounded-[6px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-6 z-10 shadow-lg text-[var(--ink)] animate-in fade-in-0 zoom-in-95 duration-150 max-h-[92vh] flex flex-col',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        <div className="flex items-start justify-between pb-3 border-b border-dashed border-[var(--line-dashed)]">
          <div>
            {title && <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--ink)]">{title}</h2>}
            {description && <p className="text-xs text-[var(--ink-muted)] mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-[4px] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Tutup dialog"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
