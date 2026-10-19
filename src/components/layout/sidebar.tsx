'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Boxes,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const NAVIGATION_ITEMS = [
  { index: '01', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { index: '02', name: 'Kasir', href: '/pos', icon: ShoppingCart },
  { index: '03', name: 'Transaksi', href: '/transactions', icon: Receipt },
  { index: '04', name: 'Produk', href: '/products', icon: Package },
  { index: '05', name: 'Kategori', href: '/categories', icon: Layers },
  { index: '06', name: 'Inventori', href: '/inventory', icon: Boxes },
  { index: '07', name: 'Laporan', href: '/reports', icon: BarChart3 },
  { index: '08', name: 'Pengaturan', href: '/settings', icon: Settings },
];

export interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full w-[240px] sm:w-[232px] bg-[var(--paper)] border-r border-[var(--line)]">
      {/* Brand Header */}
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-[var(--line)]">
        <Link href="/dashboard" onClick={onMobileClose} className="flex items-center gap-2 group">
          <div className="w-6 h-6 bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center font-mono font-bold text-xs rounded-[2px]">
            N
          </div>
          <span className="font-bold text-base tracking-tight text-[var(--ink)] font-mono">
            Nexa<span className="text-[var(--tag)]">POS</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[var(--ink)] text-[var(--paper)] rounded-[2px] tracking-widest uppercase">
            DEMO
          </span>
          {isMobile && (
            <button
              type="button"
              onClick={onMobileClose}
              className="p-1 rounded-[4px] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Ledger Index */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
          Daftar Isi Sistem
        </div>
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'group flex items-center justify-between px-3 py-2.5 rounded-[4px] text-xs transition-colors min-h-[44px]',
                isActive
                  ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                  : 'text-[var(--ink)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className={isActive ? 'text-[var(--tag)]' : 'text-[var(--ink-muted)] group-hover:text-[var(--ink)]'}
                />
                <span className="font-mono text-[11px] opacity-75">{item.index}</span>
                <span className="tracking-tight">{item.name}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-[var(--tag)] rounded-[1px]" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[var(--line)] text-[10px] font-mono text-[var(--ink-muted)] space-y-1">
        <div className="flex justify-between">
          <span>Versi:</span>
          <span>1.1 — MVP Demo</span>
        </div>
        <div className="flex justify-between">
          <span>Penyimpanan:</span>
          <span>localStorage</span>
        </div>
        <Link
          href="/design"
          onClick={onMobileClose}
          className="inline-block mt-2 text-[10px] underline text-[var(--ink)] hover:text-[var(--tag)] font-mono"
        >
          &rarr; Panduan Desain (/design)
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30 w-[232px]">
        {renderContent(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#1B1A17]/40 backdrop-blur-[1px] transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col h-full bg-[var(--paper)] shadow-2xl animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
