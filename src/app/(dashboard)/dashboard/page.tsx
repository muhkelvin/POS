'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Header } from '@/components/layout/header';
import { SegmentedControl } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { reportService, PeriodFilter, ReportSummary, DailySalesData, CategorySalesData, TopProductData } from '@/lib/services/report-service';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { CHART_THEME } from '@/lib/charts/theme';
import { Transaction } from '@/types/transaction';
import { Product } from '@/types/product';
import { ArrowUpRight, ArrowRight, AlertTriangle, Receipt } from 'lucide-react';

export default function DashboardPage() {
  const [period, setPeriod] = React.useState<PeriodFilter>('30days');
  const [customStart, setCustomStart] = React.useState<string>('');
  const [customEnd, setCustomEnd] = React.useState<string>('');

  const [summary, setSummary] = React.useState<ReportSummary | null>(null);
  const [dailySales, setDailySales] = React.useState<DailySalesData[]>([]);
  const [categorySales, setCategorySales] = React.useState<CategorySalesData[]>([]);
  const [topProducts, setTopProducts] = React.useState<TopProductData[]>([]);
  const [lowStockProducts, setLowStockProducts] = React.useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = React.useState<Transaction[]>([]);

  const loadData = React.useCallback(() => {
    const allTransactions = transactionRepository.getAll();
    const allProducts = productRepository.getAll();

    // Low stock items
    const lowStock = allProducts.filter((p) => p.status === 'active' && p.stock <= p.minStock);
    setLowStockProducts(lowStock);

    // Date range
    const { start, end, prevStart, prevEnd } = reportService.getDateRange(period, customStart, customEnd);

    // Filter current and previous transactions
    const filteredTx = reportService.filterTransactions(allTransactions, start, end);
    const prevFilteredTx = reportService.filterTransactions(allTransactions, prevStart, prevEnd);

    // Summary KPIs
    const sum = reportService.calculateSummary(filteredTx, prevFilteredTx, lowStock.length);
    setSummary(sum);

    // Visualizations
    const daily = reportService.getDailySales(filteredTx, start, end);
    setDailySales(daily);

    const cats = reportService.getCategorySales(filteredTx);
    setCategorySales(cats);

    const top = reportService.getTopProducts(filteredTx, 5);
    setTopProducts(top);

    // Recent 5 transactions
    setRecentTransactions(allTransactions.slice(0, 5));
  }, [period, customStart, customEnd]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Delta badge component
  const DeltaText = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-[var(--ink-muted)] font-mono text-[11px]">— 0%</span>;
    const isPos = value > 0;
    return (
      <span
        className={`font-mono text-[11px] font-medium flex items-center gap-0.5 ${
          isPos ? 'text-[var(--success)]' : 'text-[var(--danger)]'
        }`}
      >
        {isPos ? '▲' : '▼'} {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Dashboard"
        description="Ringkasan kinerja operasional retail NexaPOS"
        actions={
          <div className="flex items-center gap-2">
            <SegmentedControl
              options={[
                { value: 'today', label: 'Hari ini' },
                { value: '7days', label: '7 hari' },
                { value: '30days', label: '30 hari' },
                { value: 'custom', label: 'Kustom' },
              ]}
              value={period}
              onChange={setPeriod}
              size="sm"
            />
            {period === 'custom' && (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-8 px-2 border border-[var(--line)] rounded-[2px] bg-[var(--surface)] text-[var(--ink)]"
                />
                <span>-</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-8 px-2 border border-[var(--line)] rounded-[2px] bg-[var(--surface)] text-[var(--ink)]"
                />
              </div>
            )}
          </div>
        }
      />

      <main className="px-4 sm:px-6 py-6 space-y-6">
        {/* Strip Ledger KPI per PRD 5A.5: Hero 40px revenue + 5 inline metrics */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Total Revenue Hero (40px mono) */}
            <div className="lg:col-span-4 flex flex-col justify-between pr-0 lg:pr-6 lg:border-r border-[var(--line)]">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)]">
                  Total Pendapatan (Omzet)
                </span>
                <div className="text-3xl sm:text-[40px] font-bold font-mono text-[var(--ink)] tracking-tight tabular-nums mt-1 leading-none">
                  {summary ? formatCurrency(summary.revenue) : 'Rp 0'}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <DeltaText value={summary?.revenueDeltaPercent || 0} />
                <span className="text-[11px] text-[var(--ink-muted)]">dibanding periode sebelumnya</span>
              </div>
            </div>

            {/* 5 Inline Metrics separated by hairline vertical borders */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Transactions */}
              <div className="flex flex-col justify-between sm:border-r border-[var(--line)] sm:pr-3">
                <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Transaksi</span>
                <div className="text-xl font-bold font-mono text-[var(--ink)] tabular-nums my-1">
                  {summary?.transactionsCount || 0}
                </div>
                <DeltaText value={summary?.transactionsDeltaPercent || 0} />
              </div>

              {/* Products Sold */}
              <div className="flex flex-col justify-between sm:border-r border-[var(--line)] sm:pr-3">
                <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Unit Terjual</span>
                <div className="text-xl font-bold font-mono text-[var(--ink)] tabular-nums my-1">
                  {summary?.productsSold || 0}
                </div>
                <DeltaText value={summary?.productsSoldDeltaPercent || 0} />
              </div>

              {/* Average Transaction Value */}
              <div className="flex flex-col justify-between lg:border-r border-[var(--line)] lg:pr-3">
                <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Rata-rata (ATV)</span>
                <div className="text-lg font-bold font-mono text-[var(--ink)] tabular-nums my-1">
                  {summary ? formatCurrency(summary.averageTransactionValue) : 'Rp 0'}
                </div>
                <DeltaText value={summary?.atvDeltaPercent || 0} />
              </div>

              {/* Estimated Gross Profit */}
              <div className="flex flex-col justify-between sm:border-r border-[var(--line)] sm:pr-3">
                <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Laba Kotor</span>
                <div className="text-lg font-bold font-mono text-[var(--success)] tabular-nums my-1">
                  {summary ? formatCurrency(summary.grossProfit) : 'Rp 0'}
                </div>
                <DeltaText value={summary?.grossProfitDeltaPercent || 0} />
              </div>

              {/* Low Stock Warning */}
              <div className="flex flex-col justify-between">
                <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Stok Rendah</span>
                <div className="text-xl font-bold font-mono text-[var(--warning)] tabular-nums my-1">
                  {summary?.lowStockCount || 0}
                </div>
                <Link
                  href="/inventory"
                  className="text-[11px] font-mono text-[var(--ink)] underline hover:text-[var(--warning)]"
                >
                  Periksa &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Sales Bar Chart (PRD 5A.5: Flat bar chart, today is --tag, horizontal dashed gridline, receipt tooltip) */}
          <div className="lg:col-span-8 bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
            <div className="flex items-center justify-between pb-4 border-b border-dashed border-[var(--line-dashed)] mb-4">
              <div>
                <h3 className="font-semibold text-sm text-[var(--ink)]">Grafik Penjualan Harian</h3>
                <p className="text-xs text-[var(--ink-muted)]">Tren omzet transaksi per tanggal (WIB)</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[var(--tag)] rounded-[1px]" />
                  <span>Hari Ini</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[var(--ink)] opacity-80 rounded-[1px]" />
                  <span>Hari Lain</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              {dailySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      tick={CHART_THEME.axis.tick}
                      stroke={CHART_THEME.axis.stroke}
                      tickLine={false}
                    />
                    <YAxis
                      tick={CHART_THEME.axis.tick}
                      stroke={CHART_THEME.axis.stroke}
                      tickLine={false}
                      tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as DailySalesData;
                          return (
                            <div style={CHART_THEME.tooltipStyle} className="space-y-1">
                              <div className="font-bold border-b border-dashed border-[var(--line-dashed)] pb-1 mb-1">
                                {data.displayDate} {data.isToday ? '(Hari ini)' : ''}
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Omzet:</span>
                                <span className="font-bold">{formatCurrency(data.revenue)}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-[11px] text-[var(--ink-muted)]">
                                <span>Transaksi:</span>
                                <span>{data.transactions} kali</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
                      {dailySales.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isToday ? CHART_THEME.colors.tag : CHART_THEME.colors.ink}
                          opacity={entry.isToday ? 1 : 0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-mono text-[var(--ink-muted)]">
                  Tidak ada data penjualan pada rentang waktu ini.
                </div>
              )}
            </div>
          </div>

          {/* Category Sales Distribution (Horizontal bar list per PRD 5A.5) */}
          <div className="lg:col-span-4 bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-[var(--line-dashed)] mb-4">
                <h3 className="font-semibold text-sm text-[var(--ink)]">Penjualan per Kategori</h3>
                <span className="text-[11px] font-mono text-[var(--ink-muted)]">Kontribusi</span>
              </div>

              <div className="space-y-4">
                {categorySales.map((cat) => (
                  <div key={cat.categoryId} className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-medium text-[var(--ink)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: cat.color }} />
                        {cat.categoryName}
                      </span>
                      <span className="font-mono text-[var(--ink-muted)] tabular-nums">
                        {formatCurrency(cat.revenue)} ({cat.percentage}%)
                      </span>
                    </div>
                    {/* Flat bar */}
                    <div className="w-full bg-[var(--paper)] h-2 rounded-[1px] overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--line)] mt-4">
              <Link
                href="/categories"
                className="text-xs font-mono text-[var(--ink)] hover:text-[var(--tag)] flex items-center justify-between group"
              >
                <span>Kelola Kategori Produk</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Lower Tables Row: Top Products & Low Stock Alert */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Products Table */}
          <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-[var(--line-dashed)] mb-3">
              <div>
                <h3 className="font-semibold text-sm text-[var(--ink)]">Produk Terlaris</h3>
                <p className="text-xs text-[var(--ink-muted)]">Paling banyak dibeli dalam periode ini</p>
              </div>
              <Link
                href="/reports"
                className="text-xs font-mono text-[var(--ink)] underline hover:text-[var(--tag)]"
              >
                Laporan Lengkap &rarr;
              </Link>
            </div>

            {/* Mobile View: Top Products List */}
            <div className="md:hidden divide-y divide-[var(--line)]">
              {topProducts.map((prod) => (
                <div key={prod.productId} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--ink)] truncate">{prod.productName}</span>
                    <span className="font-mono font-bold text-[var(--ink)] shrink-0">{formatCurrency(prod.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
                    <span>{prod.sku} · {prod.categoryName} · {prod.unitsSold} unit</span>
                    <span className="text-[var(--success)] font-medium">+{formatCurrency(prod.grossProfit)}</span>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="py-6 text-center text-xs font-mono text-[var(--ink-muted)]">
                  Belum ada produk terjual pada periode ini.
                </div>
              )}
            </div>

            {/* Desktop View: Top Products Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Terjual</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                    <TableHead className="text-right">Laba</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((prod) => (
                    <TableRow key={prod.productId}>
                      <TableCell>
                        <div className="font-medium text-[var(--ink)]">{prod.productName}</div>
                        <div className="text-[11px] font-mono text-[var(--ink-muted)]">{prod.sku}</div>
                      </TableCell>
                      <TableCell className="text-xs">{prod.categoryName}</TableCell>
                      <TableCell isNumeric>{prod.unitsSold} unit</TableCell>
                      <TableCell isNumeric>{formatCurrency(prod.revenue)}</TableCell>
                      <TableCell isNumeric className="text-[var(--success)] font-medium">
                        {formatCurrency(prod.grossProfit)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {topProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-xs font-mono text-[var(--ink-muted)]">
                        Belum ada produk terjual pada periode ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Low Stock Alert Table */}
          <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-[var(--line-dashed)] mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[var(--warning)]" />
                <h3 className="font-semibold text-sm text-[var(--ink)]">Peringatan Stok Rendah</h3>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-mono text-[var(--ink)] underline hover:text-[var(--warning)]"
              >
                Inventori &rarr;
              </Link>
            </div>

            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-[4px] bg-[var(--paper)]/60 border border-[var(--line)]"
                >
                  <div>
                    <div className="font-medium text-xs text-[var(--ink)] line-clamp-1">{p.name}</div>
                    <div className="text-[11px] font-mono text-[var(--ink-muted)]">{p.sku}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-semibold text-[var(--warning)]">
                      sisa {p.stock} / min {p.minStock}
                    </span>
                    <div className="text-[10px] text-[var(--ink-muted)] font-mono">{p.unit}</div>
                  </div>
                </div>
              ))}

              {lowStockProducts.length === 0 && (
                <div className="text-center py-8 text-xs font-mono text-[var(--success)] flex items-center justify-center gap-1.5">
                  <span>■</span> Semua persediaan produk berada di atas batas minimum.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recent Transactions Strip */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-[var(--line-dashed)] mb-3">
            <div className="flex items-center gap-2">
              <Receipt size={16} strokeWidth={1.5} />
              <h3 className="font-semibold text-sm text-[var(--ink)]">Transaksi Kasir Terbaru</h3>
            </div>
            <Link
              href="/transactions"
              className="text-xs font-mono text-[var(--ink)] underline hover:text-[var(--tag)]"
            >
              Lihat Semua Transaksi &rarr;
            </Link>
          </div>

          {/* Mobile View: Recent Transactions List */}
          <div className="md:hidden divide-y divide-[var(--line)]">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Link href={`/transactions?highlight=${tx.id}`} className="font-mono font-bold hover:underline">
                      {tx.transactionNumber}
                    </Link>
                    <StatusBadge status={tx.status} />
                  </div>
                  <span className="font-mono font-bold">{formatCurrency(tx.total)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
                  <span>{formatDateTime(tx.createdAt)}</span>
                  <span className="uppercase">{tx.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Recent Transactions Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Transaksi</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell isMono className="font-semibold">
                      <Link href={`/transactions?highlight=${tx.id}`} className="hover:underline">
                        {tx.transactionNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{formatDateTime(tx.createdAt)}</TableCell>
                    <TableCell className="text-xs uppercase font-mono">{tx.paymentMethod}</TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell isNumeric className="font-bold">
                      {formatCurrency(tx.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
    </div>
  );
}
