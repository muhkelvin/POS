import * as React from 'react';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types/transaction';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { Stamp } from './stamp';

export interface ReceiptPaperProps extends React.HTMLAttributes<HTMLDivElement> {
  transaction: Transaction;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  showStamp?: boolean;
}

export function ReceiptPaper({
  transaction,
  storeName = 'TOKO KELONTONG & RETAIL NEXA',
  storeAddress = 'Jl. Merdeka No. 45, Jakarta Selatan',
  storePhone = '(021) 7289-4501',
  showStamp = true,
  className,
  ...props
}: ReceiptPaperProps) {
  return (
    <div className={cn('relative w-full max-w-sm mx-auto font-mono text-xs text-[var(--ink)]', className)} {...props}>
      {/* Top jagged cut edge SVG */}
      <div className="w-full h-3 overflow-hidden leading-none">
        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="w-full h-full fill-[var(--surface)]">
          <polygon points="0,8 5,0 10,8 15,0 20,8 25,0 30,8 35,0 40,8 45,0 50,8 55,0 60,8 65,0 70,8 75,0 80,8 85,0 90,8 95,0 100,8" />
        </svg>
      </div>

      {/* Main receipt body */}
      <div className="bg-[var(--surface)] px-5 py-4 border-x border-[var(--line)] shadow-sm relative">
        {/* Stamp overlay if requested */}
        {showStamp && (
          <div className="absolute right-4 top-14 pointer-events-none z-10">
            <Stamp status={transaction.status} size="lg" />
          </div>
        )}

        {/* Store Header */}
        <div className="text-center pb-3">
          <h2 className="font-bold text-sm tracking-wide uppercase">{storeName}</h2>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">{storeAddress}</p>
          <p className="text-[11px] text-[var(--ink-muted)]">Telp: {storePhone}</p>
        </div>

        {/* Dashed line */}
        <div className="border-b border-dashed border-[var(--line-dashed)] my-2" />

        {/* Meta Info */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">No:</span>
            <span className="font-semibold">{transaction.transactionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">Waktu:</span>
            <span>{formatDateTime(transaction.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">Kasir:</span>
            <span>{transaction.cashierName}</span>
          </div>
          {transaction.voidedAt && (
            <div className="flex justify-between text-[var(--danger)]">
              <span>Dibatalkan:</span>
              <span>{formatDateTime(transaction.voidedAt)}</span>
            </div>
          )}
        </div>

        {/* Dashed line */}
        <div className="border-b border-dashed border-[var(--line-dashed)] my-3" />

        {/* Items List */}
        <div className="space-y-2 mb-3">
          {transaction.items.map((item) => (
            <div key={item.id} className="text-[11px]">
              <div className="font-medium text-[var(--ink)] line-clamp-1">{item.productName}</div>
              <div className="flex justify-between text-[var(--ink-muted)] mt-0.5">
                <span>
                  {item.quantity} x {formatCurrency(item.unitPriceSnapshot)}
                </span>
                <span className="font-mono text-[var(--ink)] tabular-nums">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Dashed line */}
        <div className="border-b border-dashed border-[var(--line-dashed)] my-3" />

        {/* Financial Summary */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">Subtotal</span>
            <span className="font-mono tabular-nums">{formatCurrency(transaction.subtotal)}</span>
          </div>

          {transaction.discount > 0 && (
            <div className="flex justify-between text-[var(--danger)]">
              <span>Diskon</span>
              <span className="font-mono tabular-nums">-{formatCurrency(transaction.discount)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-sm pt-1 border-t border-[var(--line)]">
            <span>TOTAL</span>
            <span className="font-mono tabular-nums bg-[var(--tag)] px-1.5 py-0.5 text-[var(--ink)]">
              {formatCurrency(transaction.total)}
            </span>
          </div>

          <div className="flex justify-between pt-1 text-[11px]">
            <span className="text-[var(--ink-muted)] uppercase">Bayar ({transaction.paymentMethod})</span>
            <span className="font-mono tabular-nums">{formatCurrency(transaction.amountPaid)}</span>
          </div>

          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--ink-muted)]">Kembalian</span>
            <span className="font-mono tabular-nums font-semibold">{formatCurrency(transaction.change)}</span>
          </div>
        </div>

        {/* Dashed line */}
        <div className="border-b border-dashed border-[var(--line-dashed)] my-3" />

        {/* Receipt Footer */}
        <div className="text-center text-[10px] text-[var(--ink-muted)] space-y-1 pt-1">
          <p>Terima kasih atas kunjungan Anda!</p>
          <p>Barang yang sudah dibeli tidak dapat ditukar</p>
          <p className="font-mono text-[9px] text-[var(--line-dashed)] pt-1">*** NEXAPOS SYSTEM DEMO ***</p>
        </div>
      </div>

      {/* Bottom jagged cut edge SVG */}
      <div className="w-full h-3 overflow-hidden leading-none rotate-180">
        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="w-full h-full fill-[var(--surface)]">
          <polygon points="0,8 5,0 10,8 15,0 20,8 25,0 30,8 35,0 40,8 45,0 50,8 55,0 60,8 65,0 70,8 75,0 80,8 85,0 90,8 95,0 100,8" />
        </svg>
      </div>
    </div>
  );
}
