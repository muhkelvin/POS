import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'tag' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-100 cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none rounded-[4px] active:scale-[0.98]';

    const variants = {
      // Primary: solid ink with paper text
      primary: 'bg-[var(--ink)] text-[var(--paper)] hover:bg-black/90 active:bg-black',
      // Secondary: surface with ink border
      secondary: 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--ink)]',
      // Outline: transparent with line border
      outline: 'bg-transparent text-[var(--ink)] border border-[var(--line)] hover:border-[var(--ink)] hover:bg-[var(--surface)]',
      // Tag: yellow accent with ink text
      tag: 'bg-[var(--tag)] text-[var(--ink)] hover:brightness-95 active:brightness-90 font-semibold',
      // Danger: red for destructive actions
      danger: 'bg-[var(--danger)] text-white hover:brightness-90 active:brightness-75',
      // Ghost: text only
      ghost: 'bg-transparent text-[var(--ink)] hover:bg-[var(--surface)] hover:text-[var(--ink)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm min-h-[44px] min-w-[44px]', // 44px touch target
      lg: 'h-12 px-6 text-base font-semibold min-h-[48px]',
      icon: 'h-10 w-10 min-h-[44px] min-w-[44px] p-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
