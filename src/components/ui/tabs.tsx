import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center p-0.5 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] max-w-full overflow-x-auto whitespace-nowrap',
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[2px] font-medium transition-all duration-100 cursor-pointer select-none',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm min-h-[38px]',
              isActive
                ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold shadow-none'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)]/50'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
