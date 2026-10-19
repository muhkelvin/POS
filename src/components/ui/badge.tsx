import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'active' | 'inactive' | 'low_stock' | 'out_of_stock' | 'completed' | 'voided';
  label?: string;
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const configs = {
    active: {
      color: 'bg-[var(--success)]',
      defaultLabel: 'Aktif',
    },
    inactive: {
      color: 'bg-[var(--ink-muted)]',
      defaultLabel: 'Nonaktif',
    },
    low_stock: {
      color: 'bg-[var(--warning)]',
      defaultLabel: 'Stok rendah',
    },
    out_of_stock: {
      color: 'bg-[var(--danger)]',
      defaultLabel: 'Habis',
    },
    completed: {
      color: 'bg-[var(--success)]',
      defaultLabel: 'Selesai',
    },
    voided: {
      color: 'bg-[var(--danger)]',
      defaultLabel: 'Batal',
    },
  };

  const current = configs[status] || configs.active;
  const displayLabel = label || current.defaultLabel;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[var(--ink)]',
        className
      )}
      {...props}
    >
      <span className={cn('w-2 h-2 rounded-[1px] shrink-0', current.color)} />
      <span>{displayLabel}</span>
    </div>
  );
}
