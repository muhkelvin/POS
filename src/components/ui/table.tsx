import * as React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm text-[var(--ink)]', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'sticky top-0 bg-[var(--surface)] text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)] border-b border-[var(--ink)] z-10',
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-[var(--line)] transition-colors hover:bg-[var(--ink)]/[0.04] h-10',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle font-medium text-[var(--ink)] [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, isMono, isNumeric, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { isMono?: boolean; isNumeric?: boolean }) {
  return (
    <td
      className={cn(
        'p-3 px-4 align-middle text-sm text-[var(--ink)] [&:has([role=checkbox])]:pr-0',
        isMono && 'font-mono',
        isNumeric && 'text-right font-mono tabular-nums',
        className
      )}
      {...props}
    />
  );
}
