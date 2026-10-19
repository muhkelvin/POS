'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Search,
  Receipt,
  Eye,
  Ban,
  Printer,
  Calendar,
  Filter,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { ReceiptPaper } from '@/components/ui/receipt-paper';
import { SegmentedControl } from '@/components/ui/tabs';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { voidTransactionService } from '@/lib/services/void-service';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { Transaction, PaymentMethod } from '@/types/transaction';

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [searchNumber, setSearchNumber] = React.useState('');
  const [selectedMethod, setSelectedMethod] = React.useState<string>('all');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);

  const [voidModalOpen, setVoidModalOpen] = React.useState(false);
  const [voidReason, setVoidReason] = React.useState('');
  const [isVoiding, setIsVoiding] = React.useState(false);

  const loadTransactions = React.useCallback(() => {
    setTransactions(transactionRepository.getAll());
  }, []);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Filtered transactions
  const filtered = React.useMemo(() => {
    return transactions.filter((t) => {
      const q = searchNumber.trim().toUpperCase();
      const matchSearch = !q || t.transactionNumber.toUpperCase().includes(q);
      const matchMethod = selectedMethod === 'all' || t.paymentMethod === selectedMethod;
      const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;
      return matchSearch && matchMethod && matchStatus;
    });
  }, [transactions, searchNumber, selectedMethod, selectedStatus]);

  // Open detail receipt modal
  const handleOpenDetail = (tx: Transaction) => {
    setSelectedTx(tx);
    setDetailModalOpen(true);
  };

  // Open void modal
  const handleOpenVoid = (tx: Transaction) => {
    setSelectedTx(tx);
    setVoidReason('');
    setVoidModalOpen(true);
  };

  // Confirm void
  const handleConfirmVoid = () => {
    if (!selectedTx) return;
    setIsVoiding(true);

    const result = voidTransactionService.voidTransaction(selectedTx.id, voidReason);
    setIsVoiding(false);

    if (!result.success || !result.transaction) {
      toast.error(result.error || 'Gagal membatalkan transaksi.');
      return;
    }

    toast.success(`Transaksi ${selectedTx.transactionNumber} berhasil dibatalkan. Stok dikembalikan.`);
    setVoidModalOpen(false);
    setSelectedTx(result.transaction);
    loadTransactions();
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Transaksi"
        description="Riwayat lengkap penjualan, status pembayaran, dan pembatalan transaksi"
        actions={
          <div className="text-xs font-mono text-[var(--ink-muted)]">
            Total tercatat: <span className="font-bold text-[var(--ink)]">{transactions.length}</span> transaksi
          </div>
        }
      />

      <main className="px-4 sm:px-6 py-6 space-y-5">
        {/* Filter and Search Bar */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search
                size={16}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none"
              />
              <Input
                isMono
                type="text"
                placeholder="Cari nomor transaksi (e.g. NX-202610...)"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            {/* Filter Payment Method */}
            <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-mono text-[var(--ink-muted)] shrink-0">Metode:</span>
              <SegmentedControl
                size="sm"
                options={[
                  { value: 'all', label: 'Semua' },
                  { value: 'cash', label: 'Tunai' },
                  { value: 'qris', label: 'QRIS' },
                  { value: 'transfer', label: 'Transfer' },
                ]}
                value={selectedMethod}
                onChange={setSelectedMethod}
              />
            </div>

            {/* Filter Status */}
            <div className="md:col-span-3 flex items-center gap-1.5 overflow-x-auto justify-start md:justify-end">
              <span className="text-[11px] font-mono text-[var(--ink-muted)] shrink-0">Status:</span>
              <SegmentedControl
                size="sm"
                options={[
                  { value: 'all', label: 'Semua' },
                  { value: 'completed', label: 'Lunas' },
                  { value: 'voided', label: 'Batal' },
                ]}
                value={selectedStatus}
                onChange={setSelectedStatus}
              />
            </div>
          </div>
        </div>

        {/* Mobile View: 2-line dense list per PRD 5A.5 */}
        <div className="md:hidden divide-y divide-[var(--line)] bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
          {filtered.map((tx) => {
            const totalUnits = tx.items.reduce((s, it) => s + it.quantity, 0);

            return (
              <div key={tx.id} className="p-3.5 space-y-2 hover:bg-[var(--ink)]/[0.02] transition-colors">
                {/* Baris 1: Judul (No Transaksi + Status) & Total */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[var(--ink)]">{tx.transactionNumber}</span>
                    <StatusBadge status={tx.status} />
                  </div>
                  <div className="font-mono font-bold text-sm text-[var(--ink)] tabular-nums">
                    {formatCurrency(tx.total)}
                  </div>
                </div>

                {/* Baris 2: Meta (Waktu, Kasir, Metode) & Tombol Aksi */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-[var(--line)]">
                  <div className="text-[11px] text-[var(--ink-muted)] space-y-0.5">
                    <div>{formatDateTime(tx.createdAt)}</div>
                    <div className="font-mono text-[10px]">
                      {totalUnits} item · <span className="uppercase">{tx.paymentMethod}</span> · {tx.cashierName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenDetail(tx)}
                      className="h-9 px-2.5 text-xs font-mono min-h-[44px] flex items-center gap-1"
                    >
                      <Eye size={13} />
                      <span>Struk</span>
                    </Button>
                    {tx.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenVoid(tx)}
                        className="h-9 px-2 text-xs font-mono text-[var(--danger)] hover:border-[var(--danger)] min-h-[44px]"
                        aria-label="Batalkan transaksi"
                      >
                        <Ban size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-xs font-mono text-[var(--ink-muted)]">
              Tidak ada transaksi yang cocok dengan filter aktif.
            </div>
          )}
        </div>

        {/* Desktop View: Full Table per PRD 5A.5 */}
        <div className="hidden md:block bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Transaksi</TableHead>
                <TableHead>Waktu Transaksi</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Item</TableHead>
                <TableHead className="text-right">Total Transaksi</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tx) => {
                const totalUnits = tx.items.reduce((s, it) => s + it.quantity, 0);

                return (
                  <TableRow key={tx.id}>
                    <TableCell isMono className="font-semibold text-xs">
                      {tx.transactionNumber}
                    </TableCell>
                    <TableCell className="text-xs">{formatDateTime(tx.createdAt)}</TableCell>
                    <TableCell className="text-xs">{tx.cashierName}</TableCell>
                    <TableCell className="text-xs uppercase font-mono">{tx.paymentMethod}</TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell isNumeric>{totalUnits} unit</TableCell>
                    <TableCell isNumeric className="font-bold text-sm">
                      {formatCurrency(tx.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDetail(tx)}
                          className="h-8 px-2 text-xs font-mono flex items-center gap-1 min-h-[36px]"
                        >
                          <Eye size={13} />
                          <span>Struk</span>
                        </Button>
                        {tx.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenVoid(tx)}
                            className="h-8 px-2 text-xs font-mono text-[var(--danger)] hover:border-[var(--danger)] min-h-[36px]"
                          >
                            <Ban size={13} />
                            <span>Batal</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs font-mono text-[var(--ink-muted)]">
                    Tidak ada transaksi yang cocok dengan filter aktif.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Transaction Detail Receipt Modal */}
      <Dialog
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        title="Detail Struk Transaksi"
        description="Snapshot data transaksi dan bukti pembayaran resmi"
        maxWidth="md"
      >
        <div className="space-y-4">
          {selectedTx && (
            <div className="max-h-[60vh] overflow-y-auto py-2">
              <ReceiptPaper transaction={selectedTx} showStamp={true} />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--line)]">
            <Button
              variant="outline"
              size="md"
              onClick={() => window.print()}
              className="font-mono text-xs flex items-center gap-2"
            >
              <Printer size={16} />
              <span>Cetak Struk</span>
            </Button>

            {selectedTx?.status === 'completed' ? (
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenVoid(selectedTx);
                }}
                className="font-mono text-xs flex items-center gap-2"
              >
                <Ban size={15} />
                <span>Batalkan Transaksi</span>
              </Button>
            ) : (
              <span className="text-xs font-mono text-[var(--danger)] font-medium">
                Transaksi telah dibatalkan
              </span>
            )}
          </div>
        </div>
      </Dialog>

      {/* Controlled Void Dialog per PRD 5A.5 & 5A.6:
          - Warning text: "Batalkan transaksi ini? Stok semua item akan dikembalikan satu kali."
          - Explains effect on products and reports
          - Danger button
      */}
      <Dialog
        open={voidModalOpen}
        onOpenChange={setVoidModalOpen}
        title="Konfirmasi Pembatalan Transaksi"
        description="Tindakan ini tidak dapat diurungkan"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-[4px] border border-[var(--danger)] bg-[var(--danger)]/5 space-y-2">
            <div className="text-xs font-bold font-mono text-[var(--danger)] uppercase">
              Perhatian Pembatalan
            </div>
            <p className="text-xs text-[var(--ink)] leading-relaxed">
              Batalkan transaksi <strong>{selectedTx?.transactionNumber}</strong>? Stok {selectedTx?.items.length} item produk akan dikembalikan satu kali dan tercatat pada riwayat pergerakan inventori.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink-muted)]">
              Alasan Pembatalan (Wajib diisi)
            </label>
            <Input
              type="text"
              placeholder="Contoh: Salah input pesanan / permintaan retur pelanggan"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="text-xs h-10"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <Button
              variant="outline"
              size="md"
              onClick={() => setVoidModalOpen(false)}
              disabled={isVoiding}
            >
              Kembali
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={isVoiding || !voidReason.trim()}
              onClick={handleConfirmVoid}
              className="font-mono font-bold text-xs min-w-[130px]"
            >
              {isVoiding ? 'Membatalkan...' : 'Ya, Batalkan Transaksi'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
