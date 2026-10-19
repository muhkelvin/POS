import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StampProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'completed' | 'voided' | 'LUNAS' | 'BATAL';
  size?: 'sm' | 'md' | 'lg';
}

export function Stamp({ status, size = 'md', className, ...props }: StampProps) {
  const isLunas = status === 'completed' || status === 'LUNAS';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 border',
    md: 'text-sm px-3 py-1 border-2',
    lg: 'text-lg px-4 py-1.5 border-2',
  };

  return (
    <div
      className={cn(
        isLunas ? 'stamp-lunas' : 'stamp-batal',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {isLunas ? 'LUNAS' : 'BATAL'}
    </div>
  );
}
