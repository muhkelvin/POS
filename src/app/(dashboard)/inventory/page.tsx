'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Boxes,
  PlusCircle,
  Sliders,
  History,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { SegmentedControl } from '@/components/ui/tabs';
import { productRepository } from '@/lib/repositories/product-repository';
import { inventoryRepository } from '@/lib/repositories/inventory-repository';
import { formatDateTime } from '@/lib/formatters';
import { Product } from '@/types/product';
import { InventoryMovement, MovementType } from '@/types/inventory';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [movements, setMovements] = React.useState<InventoryMovement[]>([]);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'movements'>('overview');
  const [selectedTypeFilter, setSelectedTypeFilter] = React.useState<string>('all');

  // Restock modal
  const [restockModalOpen, setRestockModalOpen] = React.useState(false);
  const [restockProductId, setRestockProductId] = React.useState('');
  const [restockQty, setRestockQty] = React.useState<number>(10);
  const [restockReason, setRestockReason] = React.useState('');

  // Adjustment modal
  const [adjustModalOpen, setAdjustModalOpen] = React.useState(false);
  const [adjustProductId, setAdjustProductId] = React.useState('');
  const [adjustNewStock, setAdjustNewStock] = React.useState<number>(0);
  const [adjustReason, setAdjustReason] = React.useState('');

  const loadData = React.useCallback(() => {
    setProducts(productRepository.getAll());
    setMovements(inventoryRepository.getAll());
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Open restock modal
  const handleOpenRestock = (productId?: string) => {
    const defaultProd = productId || products[0]?.id || '';
    setRestockProductId(defaultProd);
    setRestockQty(10);
    setRestockReason('Penerimaan pasokan barang baru');
    setRestockModalOpen(true);
  };

  // Confirm restock
  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    const product = productRepository.getById(restockProductId);
    if (!product) {
      toast.error('Produk tidak ditemukan.');
      return;
    }
    if (restockQty <= 0) {
      toast.error('Jumlah stok masuk harus lebih dari 0.');
      return;
    }

    const stockBefore = product.stock;
    const stockAfter = stockBefore + Number(restockQty);

    productRepository.updateStock(product.id, stockAfter);

    inventoryRepository.create({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'restock',
      quantity: Number(restockQty),
      stockBefore,
      stockAfter,
      reason: restockReason || 'Penerimaan restok barang',
      referenceId: `RESTOCK-${Date.now().toString().slice(-6)}`,
    });

    toast.success(`Berhasil menambahkan ${restockQty} ${product.unit} ke stok "${product.name}".`);
    setRestockModalOpen(false);
    loadData();
  };

  // Open adjustment modal
  const handleOpenAdjust = (product: Product) => {
    setAdjustProductId(product.id);
    setAdjustNewStock(product.stock);
    setAdjustReason('');
    setAdjustModalOpen(true);
  };

  // Confirm adjustment
  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const product = productRepository.getById(adjustProductId);
    if (!product) {
      toast.error('Produk tidak ditemukan.');
      return;
    }
    if (!adjustReason.trim()) {
      toast.error('Alasan penyesuaian wajib diisi.');
      return;
    }

    const stockBefore = product.stock;
    const stockAfter = Math.max(0, Number(adjustNewStock));
    const delta = stockAfter - stockBefore;

    productRepository.updateStock(product.id, stockAfter);

    inventoryRepository.create({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'adjustment',
      quantity: delta,
      stockBefore,
      stockAfter,
      reason: adjustReason.trim(),
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
    });

    toast.success(`Stok "${product.name}" disesuaikan dari ${stockBefore} menjadi ${stockAfter} ${product.unit}.`);
    setAdjustModalOpen(false);
    loadData();
  };

  // Filtered movements
  const filteredMovements = React.useMemo(() => {
    return movements.filter((m) => {
      if (selectedTypeFilter === 'all') return true;
      return m.type === selectedTypeFilter;
    });
  }, [movements, selectedTypeFilter]);

  const movementLabels: Record<MovementType, { label: string; color: string }> = {
    initial_stock: { label: 'Stok Awal', color: 'text-[var(--ink-muted)]' },
    sale: { label: 'Penjualan', color: 'text-[var(--ink)]' },
    restock: { label: 'Restok Masuk', color: 'text-[var(--success)]' },
    adjustment: { label: 'Penyesuaian', color: 'text-[var(--warning)]' },
    sale_void: { label: 'Retur/Batal', color: 'text-[var(--danger)]' },
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Inventori"
        description="Monitoring stok fisik, penambahan pasokan, dan riwayat mutasi barang"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleOpenRestock()}
              className="flex items-center gap-1.5 font-mono text-xs font-bold"
            >
              <PlusCircle size={16} />
              <span>Restok Masuk</span>
            </Button>
          </div>
        }
      />

      <main className="px-4 sm:px-6 py-6 space-y-5">
        {/* Tab Selector: Overview vs Movement History */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SegmentedControl
            options={[
              { value: 'overview', label: '📦 Status Stok Produk' },
              { value: 'movements', label: '📋 Riwayat Mutasi Stok' },
            ]}
            value={activeTab}
            onChange={(v) => setActiveTab(v as any)}
          />

          {activeTab === 'movements' && (
            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              <span className="font-mono text-[var(--ink-muted)] shrink-0">Tipe Mutasi:</span>
              <SegmentedControl
                size="sm"
                options={[
                  { value: 'all', label: 'Semua' },
                  { value: 'sale', label: 'Penjualan' },
                  { value: 'restock', label: 'Restok' },
                  { value: 'adjustment', label: 'Penyesuaian' },
                  { value: 'sale_void', label: 'Batal' },
                ]}
                value={selectedTypeFilter}
                onChange={setSelectedTypeFilter}
              />
            </div>
          )}
        </div>

        {/* Tab 1: Product Stock Overview */}
        {activeTab === 'overview' && (
          <>
            {/* Mobile View: dense list */}
            <div className="md:hidden divide-y divide-[var(--line)] bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
              {products.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLow = p.stock <= p.minStock && !isOutOfStock;

                return (
                  <div key={p.id} className="p-3.5 space-y-2 hover:bg-[var(--ink)]/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-xs text-[var(--ink)]">{p.name}</div>
                        <div className="text-[11px] font-mono text-[var(--ink-muted)] mt-0.5">{p.sku}</div>
                      </div>
                      <div>
                        {isOutOfStock ? (
                          <span className="font-mono text-xs font-bold text-[var(--danger)]">■ Habis</span>
                        ) : isLow ? (
                          <span className="font-mono text-xs font-bold text-[var(--warning)]">■ Rendah</span>
                        ) : (
                          <span className="font-mono text-xs text-[var(--success)] font-medium">■ Normal</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-[var(--line)]">
                      <div className="text-xs font-mono">
                        <span className="text-[var(--ink-muted)]">Stok: </span>
                        <span
                          className={cn(
                            'font-bold',
                            isOutOfStock ? 'text-[var(--danger)]' : isLow ? 'text-[var(--warning)]' : 'text-[var(--ink)]'
                          )}
                        >
                          {p.stock} {p.unit}
                        </span>
                        <span className="text-[10px] text-[var(--ink-muted)] ml-1">(min {p.minStock})</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenRestock(p.id)}
                          className="h-9 px-2.5 text-xs font-mono min-h-[44px]"
                        >
                          + Restok
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdjust(p)}
                          className="h-9 px-2.5 text-xs font-mono min-h-[44px]"
                        >
                          Sesuaikan
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="text-right">Batas Min</TableHead>
                    <TableHead className="text-right">Stok Fisik</TableHead>
                    <TableHead>Kondisi</TableHead>
                    <TableHead className="text-center">Aksi Inventori</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    const isLow = p.stock <= p.minStock && !isOutOfStock;

                    return (
                      <TableRow key={p.id}>
                        <TableCell isMono className="font-semibold text-xs">
                          {p.sku}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-[var(--ink)]">{p.name}</div>
                          <div className="text-[11px] font-mono text-[var(--ink-muted)]">Satuan: {p.unit}</div>
                        </TableCell>
                        <TableCell isNumeric>
                          {p.minStock} {p.unit}
                        </TableCell>
                        <TableCell isNumeric className="font-bold text-sm">
                          <span
                            className={cn(
                              isOutOfStock
                                ? 'text-[var(--danger)]'
                                : isLow
                                ? 'text-[var(--warning)]'
                                : 'text-[var(--ink)]'
                            )}
                          >
                            {p.stock} {p.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isOutOfStock ? (
                            <span className="font-mono text-xs font-bold text-[var(--danger)]">
                              ■ Stok Habis
                            </span>
                          ) : isLow ? (
                            <span className="font-mono text-xs font-bold text-[var(--warning)]">
                              ■ Stok Rendah
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-[var(--success)] font-medium">
                              ■ Normal
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenRestock(p.id)}
                              className="h-8 px-2.5 text-xs font-mono min-h-[36px]"
                            >
                              + Restok
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAdjust(p)}
                              className="h-8 px-2.5 text-xs font-mono min-h-[36px]"
                            >
                              Penyesuaian
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Tab 2: Stock Movement Audit History */}
        {activeTab === 'movements' && (
          <>
            {/* Mobile View: dense list */}
            <div className="md:hidden divide-y divide-[var(--line)] bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
              {filteredMovements.map((m) => {
                const conf = movementLabels[m.type] || { label: m.type, color: 'text-[var(--ink)]' };
                const isPositive = m.quantity > 0;

                return (
                  <div key={m.id} className="p-3.5 space-y-1.5 hover:bg-[var(--ink)]/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-xs text-[var(--ink)]">{m.productName || 'Produk'}</div>
                        <div className="text-[10px] font-mono text-[var(--ink-muted)]">{m.sku} · {formatDateTime(m.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            'font-bold font-mono text-sm block',
                            isPositive ? 'text-[var(--success)]' : 'text-[var(--ink)]'
                          )}
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </span>
                        <span className={cn('text-[10px] font-mono font-semibold', conf.color)}>
                          ■ {conf.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)] pt-1 border-t border-dashed border-[var(--line)]">
                      <span className="line-clamp-1">{m.reason}</span>
                      <span className="shrink-0">{m.stockBefore} &rarr; {m.stockAfter}</span>
                    </div>
                  </div>
                );
              })}

              {filteredMovements.length === 0 && (
                <div className="text-center py-12 text-xs font-mono text-[var(--ink-muted)]">
                  Belum ada riwayat pergerakan stok untuk filter ini.
                </div>
              )}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>SKU & Produk</TableHead>
                    <TableHead>Jenis Mutasi</TableHead>
                    <TableHead className="text-right">Perubahan</TableHead>
                    <TableHead className="text-right">Sebelum</TableHead>
                    <TableHead className="text-right">Sesudah</TableHead>
                    <TableHead>Alasan / Referensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((m) => {
                    const conf = movementLabels[m.type] || { label: m.type, color: 'text-[var(--ink)]' };
                    const isPositive = m.quantity > 0;

                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs font-mono">{formatDateTime(m.createdAt)}</TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-[var(--ink)]">{m.productName || 'Produk'}</div>
                          <div className="text-[10px] font-mono text-[var(--ink-muted)]">{m.sku || '—'}</div>
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-xs font-mono font-semibold', conf.color)}>
                            ■ {conf.label}
                          </span>
                        </TableCell>
                        <TableCell isNumeric>
                          <span
                            className={cn(
                              'font-bold font-mono text-sm',
                              isPositive ? 'text-[var(--success)]' : 'text-[var(--ink)]'
                            )}
                          >
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </TableCell>
                        <TableCell isNumeric>{m.stockBefore}</TableCell>
                        <TableCell isNumeric className="font-semibold">
                          {m.stockAfter}
                        </TableCell>
                        <TableCell className="text-xs text-[var(--ink-muted)] max-w-sm">
                          <div>{m.reason}</div>
                          {m.referenceId && (
                            <div className="font-mono text-[10px] text-[var(--ink)]">{m.referenceId}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {filteredMovements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-xs font-mono text-[var(--ink-muted)]">
                        Belum ada riwayat pergerakan stok untuk filter ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </main>

      {/* Restock Modal */}
      <Dialog
        open={restockModalOpen}
        onOpenChange={setRestockModalOpen}
        title="Catat Stok Masuk (Restok)"
        description="Menambahkan stok fisik produk dari pemasok atau distributor"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmRestock} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink)] font-medium">Pilih Produk *</label>
            <select
              value={restockProductId}
              onChange={(e) => setRestockProductId(e.target.value)}
              className="w-full h-11 px-3 text-sm rounded-[4px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] font-mono"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Stok saat ini: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink)] font-medium">Jumlah Masuk *</label>
            <Input
              isMono
              type="number"
              min="1"
              value={restockQty || ''}
              onChange={(e) => setRestockQty(Number(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink)] font-medium">Keterangan / Nomor Surat Jalan</label>
            <Input
              type="text"
              placeholder="Contoh: Penerimaan PO-202610-09 dari Distributor Kopi"
              value={restockReason}
              onChange={(e) => setRestockReason(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <Button variant="outline" size="md" onClick={() => setRestockModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="md" type="submit" className="font-mono font-bold">
              Simpan Restok
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Stock Adjustment Modal */}
      <Dialog
        open={adjustModalOpen}
        onOpenChange={setAdjustModalOpen}
        title="Penyesuaian Stok (Stock Opname)"
        description="Koreksi stok fisik aktual hasil audit opname atau barang rusak"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmAdjust} className="space-y-4">
          <div className="p-3 rounded-[4px] border border-[var(--line)] bg-[var(--paper)]">
            <div className="text-xs font-semibold text-[var(--ink)]">
              {products.find((p) => p.id === adjustProductId)?.name}
            </div>
            <div className="text-[11px] font-mono text-[var(--ink-muted)] mt-0.5">
              Stok tercatat sistem saat ini:{' '}
              <span className="font-bold text-[var(--ink)]">
                {products.find((p) => p.id === adjustProductId)?.stock} unit
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink)] font-medium">Stok Fisik Aktual Baru *</label>
            <Input
              isMono
              type="number"
              min="0"
              value={adjustNewStock}
              onChange={(e) => setAdjustNewStock(Number(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink)] font-medium">
              Alasan Penyesuaian (Wajib diisi) *
            </label>
            <Input
              type="text"
              placeholder="Contoh: Selisih stock opname bulanan / barang bocor"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <Button variant="outline" size="md" onClick={() => setAdjustModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="md" type="submit" className="font-mono font-bold">
              Terapkan Penyesuaian
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
