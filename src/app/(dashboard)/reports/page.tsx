'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { reportService, PeriodFilter, ReportSummary, DailySalesData, CategorySalesData, TopProductData, PaymentMethodBreakdown } from '@/lib/services/report-service';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CHART_THEME } from '@/lib/charts/theme';

export default function ReportsPage() {
  const [period, setPeriod] = React.useState<PeriodFilter>('30days');
  const [customStart, setCustomStart] = React.useState('');
  const [customEnd, setCustomEnd] = React.useState('');

  const [summary, setSummary] = React.useState<ReportSummary | null>(null);
  const [dailySales, setDailySales] = React.useState<DailySalesData[]>([]);
  const [categorySales, setCategorySales] = React.useState<CategorySalesData[]>([]);
  const [topProducts, setTopProducts] = React.useState<TopProductData[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = React.useState<PaymentMethodBreakdown[]>([]);

  const loadReport = React.useCallback(() => {
    const allTx = transactionRepository.getAll();
    const { start, end, prevStart, prevEnd } = reportService.getDateRange(period, customStart, customEnd);

    const activeTx = reportService.filterTransactions(allTx, start, end);
    const prevTx = reportService.filterTransactions(allTx, prevStart, prevEnd);

    const sum = reportService.calculateSummary(activeTx, prevTx, 0);
    setSummary(sum);

    setDailySales(reportService.getDailySales(activeTx, start, end));
    setCategorySales(reportService.getCategorySales(activeTx));
    setTopProducts(reportService.getTopProducts(activeTx, 10));
    setPaymentBreakdown(reportService.getPaymentBreakdown(activeTx));
  }, [period, customStart, customEnd]);

  React.useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Export CSV
  const handleExportCSV = () => {
    const allTx = transactionRepository.getAll();
    const { start, end } = reportService.getDateRange(period, customStart, customEnd);
    const activeTx = reportService.filterTransactions(allTx, start, end);

    if (activeTx.length === 0) {
      toast.warning('Tidak ada data transaksi untuk diekspor pada periode ini.');
      return;
    }

    const csvContent = reportService.generateCSV(activeTx);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan-penjualan-nexapos-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Berhasil mengekspor ${activeTx.length} baris data ke file CSV.`);
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Laporan"
        description="Analisis omzet, profitabilitas kotor, kinerja kategori, dan unduh data transaksi"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 font-mono text-xs font-bold"
            >
              <Download size={15} />
              <span>Ekspor CSV</span>
            </Button>
          </div>
        }
      />

      <main className="px-4 sm:px-6 py-6 space-y-6">
        {/* Filter Bar */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--ink-muted)] uppercase">Periode Laporan:</span>
            <SegmentedControl
              size="sm"
              options={[
                { value: 'today', label: 'Hari Ini' },
                { value: '7days', label: '7 Hari Terakhir' },
                { value: '30days', label: '30 Hari Terakhir' },
                { value: 'custom', label: 'Rentang Kustom' },
              ]}
              value={period}
              onChange={setPeriod}
            />
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 px-2 border border-[var(--line)] rounded-[2px] bg-[var(--surface)]"
              />
              <span>s/d</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 px-2 border border-[var(--line)] rounded-[2px] bg-[var(--surface)]"
              />
            </div>
          )}
        </div>

        {/* Ledger Strip Summary */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="md:border-r border-[var(--line)] md:pr-4">
              <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Total Omzet</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--ink)] tabular-nums mt-1">
                {summary ? formatCurrency(summary.revenue) : 'Rp 0'}
              </div>
            </div>

            <div className="md:border-r border-[var(--line)] md:pr-4">
              <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Laba Kotor (Estimasi)</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--success)] tabular-nums mt-1">
                {summary ? formatCurrency(summary.grossProfit) : 'Rp 0'}
              </div>
            </div>

            <div className="md:border-r border-[var(--line)] md:pr-4">
              <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Total Transaksi</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--ink)] tabular-nums mt-1">
                {summary?.transactionsCount || 0}
              </div>
            </div>

            <div className="md:border-r border-[var(--line)] md:pr-4">
              <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Unit Terjual</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--ink)] tabular-nums mt-1">
                {summary?.productsSold || 0}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase">Rata-rata (ATV)</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--ink)] tabular-nums mt-1">
                {summary ? formatCurrency(summary.averageTransactionValue) : 'Rp 0'}
              </div>
            </div>
          </div>
        </section>

        {/* Recharts Daily Bar Trend */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
          <div className="pb-3 border-b border-dashed border-[var(--line-dashed)] mb-4">
            <h3 className="font-semibold text-sm text-[var(--ink)]">Performa Penjualan Harian</h3>
            <p className="text-xs text-[var(--ink-muted)]">Perbandingan omzet harian pada periode terpilih</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid.stroke} vertical={false} />
                <XAxis dataKey="displayDate" tick={CHART_THEME.axis.tick} stroke={CHART_THEME.axis.stroke} tickLine={false} />
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
                            {data.displayDate}
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
                <Bar dataKey="revenue" fill={CHART_THEME.colors.ink} radius={[2, 2, 0, 0]}>
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
          </div>
        </section>

        {/* Lower Grid: Category Breakdown & Payment Breakdown */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Category Sales Table */}
          <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
            <div className="pb-3 border-b border-dashed border-[var(--line-dashed)] mb-3">
              <h3 className="font-semibold text-sm text-[var(--ink)]">Penjualan Berdasarkan Kategori</h3>
            </div>
            {/* Mobile View: Category Sales */}
            <div className="md:hidden divide-y divide-[var(--line)]">
              {categorySales.map((cat) => (
                <div key={cat.categoryId} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: cat.color }} />
                      {cat.categoryName}
                    </span>
                    <span className="font-mono font-bold">{formatCurrency(cat.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
                    <span>{cat.unitsSold} unit terjual</span>
                    <span>{cat.percentage}% kontribusi</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Category Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Unit Terjual</TableHead>
                    <TableHead className="text-right">Total Nilai</TableHead>
                    <TableHead className="text-right">Kontribusi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorySales.map((cat) => (
                    <TableRow key={cat.categoryId}>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 font-medium">
                          <span className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: cat.color }} />
                          {cat.categoryName}
                        </span>
                      </TableCell>
                      <TableCell isNumeric>{cat.unitsSold} unit</TableCell>
                      <TableCell isNumeric className="font-bold">
                        {formatCurrency(cat.revenue)}
                      </TableCell>
                      <TableCell isNumeric>{cat.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
            <div className="pb-3 border-b border-dashed border-[var(--line-dashed)] mb-3">
              <h3 className="font-semibold text-sm text-[var(--ink)]">Distribusi Metode Pembayaran</h3>
            </div>
            <div className="space-y-4 pt-1">
              {paymentBreakdown.map((pm) => (
                <div key={pm.method} className="space-y-1.5 p-3 rounded-[4px] bg-[var(--paper)]/50 border border-[var(--line)]">
                  <div className="flex justify-between text-xs font-mono font-medium">
                    <span>{pm.label} ({pm.count}x)</span>
                    <span className="font-bold">{formatCurrency(pm.total)} ({pm.percentage}%)</span>
                  </div>
                  <div className="w-full bg-[var(--line)] h-2 rounded-[1px] overflow-hidden">
                    <div
                      className="h-full bg-[var(--ink)]"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top 10 Products Table */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-5">
          <div className="pb-3 border-b border-dashed border-[var(--line-dashed)] mb-3">
            <h3 className="font-semibold text-sm text-[var(--ink)]">10 Produk dengan Penjualan Tertinggi</h3>
          </div>

          {/* Mobile View: Top Products List */}
          <div className="md:hidden divide-y divide-[var(--line)]">
            {topProducts.map((p, idx) => (
              <div key={p.productId} className="py-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[var(--ink-muted)]">#{idx + 1}</span>
                    <span className="font-medium text-[var(--ink)]">{p.productName}</span>
                  </div>
                  <span className="font-mono font-bold">{formatCurrency(p.revenue)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
                  <span>{p.sku} · {p.categoryName} · {p.unitsSold} unit</span>
                  <span className="text-[var(--success)] font-medium">+{formatCurrency(p.grossProfit)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Top Products Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peringkat</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Unit Terjual</TableHead>
                  <TableHead className="text-right">Total Omzet</TableHead>
                  <TableHead className="text-right">Estimasi Laba Kotor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p, idx) => (
                  <TableRow key={p.productId}>
                    <TableCell isMono className="font-bold text-xs text-[var(--ink-muted)]">
                      #{idx + 1}
                    </TableCell>
                    <TableCell isMono className="text-xs">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.productName}</TableCell>
                    <TableCell className="text-xs">{p.categoryName}</TableCell>
                    <TableCell isNumeric>{p.unitsSold} unit</TableCell>
                    <TableCell isNumeric className="font-bold">{formatCurrency(p.revenue)}</TableCell>
                    <TableCell isNumeric className="font-medium text-[var(--success)]">
                      {formatCurrency(p.grossProfit)}
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
