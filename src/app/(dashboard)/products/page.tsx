'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  Power,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { SegmentedControl } from '@/components/ui/tabs';
import { productRepository } from '@/lib/repositories/product-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { inventoryRepository } from '@/lib/repositories/inventory-repository';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { Product, Category, ProductStatus } from '@/types/product';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedStatus, setSelectedStatus] = React.useState('all');

  // Modal form states
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [formData, setFormData] = React.useState({
    sku: '',
    name: '',
    categoryId: '',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStock: 5,
    unit: 'pcs',
    status: 'active' as ProductStatus,
  });
  const [formError, setFormError] = React.useState<string | null>(null);

  // Delete confirm modal states
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  const loadData = React.useCallback(() => {
    setProducts(productRepository.getAll());
    setCategories(categoryRepository.getAll());
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered products
  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, selectedCategory, selectedStatus]);

  // Open create form
  const handleOpenCreate = () => {
    setEditingProduct(null);
    const nextNum = products.length + 1;
    setFormData({
      sku: `PRD-${String(nextNum).padStart(3, '0')}`,
      name: '',
      categoryId: categories[0]?.id || '',
      costPrice: 0,
      sellingPrice: 0,
      stock: 10,
      minStock: 5,
      unit: 'pcs',
      status: 'active',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open edit form
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      categoryId: p.categoryId,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      status: p.status,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Save product (create or update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('Nama produk wajib diisi.');
      return;
    }
    if (!formData.sku.trim()) {
      setFormError('SKU wajib diisi.');
      return;
    }
    if (formData.costPrice < 0) {
      setFormError('Harga modal tidak boleh bernilai negatif.');
      return;
    }
    if (formData.sellingPrice < 0) {
      setFormError('Harga jual tidak boleh bernilai negatif.');
      return;
    }
    if (formData.sellingPrice < formData.costPrice) {
      // warning note
    }
    if (formData.stock < 0) {
      setFormError('Stok harus berupa bilangan bulat nonnegatif.');
      return;
    }

    if (editingProduct) {
      // Update
      const result = productRepository.update(editingProduct.id, {
        sku: formData.sku.toUpperCase(),
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        unit: formData.unit.trim(),
        status: formData.status,
      });

      if (!result.success) {
        setFormError(result.error || 'Gagal memperbarui produk.');
        return;
      }

      toast.success(`Produk "${formData.name}" berhasil diperbarui.`);
    } else {
      // Create
      const result = productRepository.create({
        sku: formData.sku.toUpperCase(),
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        unit: formData.unit.trim(),
        status: formData.status,
      });

      if (!result.success || !result.data) {
        setFormError(result.error || 'Gagal membuat produk baru.');
        return;
      }

      // Record initial stock movement
      if (formData.stock > 0) {
        inventoryRepository.create({
          productId: result.data.id,
          productName: result.data.name,
          sku: result.data.sku,
          type: 'initial_stock',
          quantity: formData.stock,
          stockBefore: 0,
          stockAfter: formData.stock,
          reason: 'Stok awal penambahan produk baru',
          referenceId: null,
        });
      }

      toast.success(`Produk "${result.data.name}" berhasil ditambahkan.`);
    }

    setIsFormOpen(false);
    loadData();
  };

  // Toggle active/inactive
  const handleToggleStatus = (p: Product) => {
    const nextStatus: ProductStatus = p.status === 'active' ? 'inactive' : 'active';
    productRepository.update(p.id, { status: nextStatus });
    toast.success(`Status produk "${p.name}" diubah menjadi ${nextStatus === 'active' ? 'Aktif' : 'Nonaktif'}.`);
    loadData();
  };

  // Open delete dialog
  const handleOpenDelete = (p: Product) => {
    setProductToDelete(p);
    setDeleteModalOpen(true);
  };

  // Check if product has historical transactions
  const hasTransactions = React.useMemo(() => {
    if (!productToDelete) return false;
    const allTx = transactionRepository.getAll();
    return allTx.some((tx) => tx.items.some((it) => it.productId === productToDelete.id));
  }, [productToDelete]);

  const handleConfirmDelete = () => {
    if (!productToDelete) return;

    const result = productRepository.delete(productToDelete.id, hasTransactions);
    if (!result.success) {
      toast.error(result.error || 'Gagal menghapus produk.');
      return;
    }

    toast.success(`Produk "${productToDelete.name}" telah dihapus.`);
    setDeleteModalOpen(false);
    setProductToDelete(null);
    loadData();
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Produk"
        description="Kelola katalog produk, harga jual, margin keuntungan, dan batas minimum stok"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 font-mono text-xs font-bold"
          >
            <Plus size={16} />
            <span>Tambah Produk</span>
          </Button>
        }
      />

      <main className="px-4 sm:px-6 py-6 space-y-5">
        {/* Search & Filter Bar */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-6 relative">
              <Search
                size={16}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Cari nama produk atau SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3 flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[var(--ink-muted)] shrink-0">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-2 text-xs rounded-[4px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] font-mono"
              >
                <option value="all">Semua ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3 flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[var(--ink-muted)] shrink-0">Status:</span>
              <SegmentedControl
                size="sm"
                options={[
                  { value: 'all', label: 'Semua' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Nonaktif' },
                ]}
                value={selectedStatus}
                onChange={setSelectedStatus}
              />
            </div>
          </div>
        </div>

        {/* Mobile View: 2-line dense list per PRD 5A.5 */}
        <div className="md:hidden divide-y divide-[var(--line)] bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
          {filtered.map((p) => {
            const category = categories.find((c) => c.id === p.categoryId);
            const isLowStock = p.status === 'active' && p.stock <= p.minStock && p.stock > 0;
            const isOutOfStock = p.stock <= 0;

            return (
              <div key={p.id} className="p-3.5 space-y-2 hover:bg-[var(--ink)]/[0.02] transition-colors">
                {/* Baris 1: Nama & Harga Jual */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[var(--ink)] truncate">{p.name}</span>
                      {isOutOfStock ? (
                        <StatusBadge status="out_of_stock" />
                      ) : isLowStock ? (
                        <StatusBadge status="low_stock" />
                      ) : (
                        <StatusBadge status={p.status} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--ink-muted)] mt-0.5">
                      <span>{p.sku}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: category?.color || '#1B1A17' }} />
                        {category?.name || 'Umum'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-[var(--ink)] tabular-nums">
                      {formatCurrency(p.sellingPrice)}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--ink-muted)]">
                      HPP: {formatCurrency(p.costPrice)}
                    </div>
                  </div>
                </div>

                {/* Baris 2: Stok Fisik & Tombol Aksi */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-[var(--line)]">
                  <div className="text-xs font-mono">
                    <span className="text-[var(--ink-muted)]">Stok: </span>
                    <span
                      className={cn(
                        'font-bold',
                        isOutOfStock ? 'text-[var(--danger)]' : isLowStock ? 'text-[var(--warning)]' : 'text-[var(--ink)]'
                      )}
                    >
                      {p.stock} {p.unit}
                    </span>
                    {isLowStock && <span className="text-[10px] text-[var(--warning)] ml-1">(min {p.minStock})</span>}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(p)}
                      title={p.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-[2px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    >
                      <Power size={16} className={p.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--ink-muted)]'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      title="Edit"
                      className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-[2px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(p)}
                      title="Hapus"
                      className="p-2 text-[var(--ink-muted)] hover:text-[var(--danger)] rounded-[2px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-xs font-mono text-[var(--ink-muted)]">
              Tidak ada produk yang cocok dengan pencarian atau filter.
            </div>
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga Modal</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Stok Fisik</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const category = categories.find((c) => c.id === p.categoryId);
                const margin = p.sellingPrice - p.costPrice;
                const marginPercent = p.sellingPrice > 0 ? ((margin / p.sellingPrice) * 100).toFixed(0) : '0';
                const isLowStock = p.status === 'active' && p.stock <= p.minStock && p.stock > 0;
                const isOutOfStock = p.stock <= 0;

                return (
                  <TableRow key={p.id}>
                    <TableCell isMono className="font-semibold text-xs">
                      {p.sku}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-[var(--ink)]">{p.name}</div>
                      <div className="text-[11px] font-mono text-[var(--ink-muted)]">Satuan: {p.unit}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                        <span
                          className="w-2 h-2 rounded-[1px]"
                          style={{ backgroundColor: category?.color || '#1B1A17' }}
                        />
                        {category?.name || 'Umum'}
                      </span>
                    </TableCell>
                    <TableCell isNumeric>{formatCurrency(p.costPrice)}</TableCell>
                    <TableCell isNumeric className="font-bold">
                      {formatCurrency(p.sellingPrice)}
                    </TableCell>
                    <TableCell isNumeric className="text-[var(--success)] font-medium">
                      +{marginPercent}%
                    </TableCell>
                    <TableCell isNumeric>
                      <span
                        className={cn(
                          'font-bold',
                          isOutOfStock
                            ? 'text-[var(--danger)]'
                            : isLowStock
                            ? 'text-[var(--warning)]'
                            : 'text-[var(--ink)]'
                        )}
                      >
                        {p.stock} {p.unit}
                      </span>
                      {isLowStock && (
                        <span className="block text-[10px] text-[var(--warning)] font-mono">
                          (min {p.minStock})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isOutOfStock ? (
                        <StatusBadge status="out_of_stock" />
                      ) : isLowStock ? (
                        <StatusBadge status="low_stock" />
                      ) : (
                        <StatusBadge status={p.status} />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          title={p.status === 'active' ? 'Nonaktifkan produk' : 'Aktifkan produk'}
                          className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-[2px] min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <Power size={14} className={p.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--ink-muted)]'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit produk"
                          className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-[2px] min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(p)}
                          title="Hapus produk"
                          className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--danger)] rounded-[2px] min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-xs font-mono text-[var(--ink-muted)]">
                    Tidak ada produk yang cocok dengan pencarian atau filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Product Form Modal (Create / Edit) */}
      <Dialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
        description="Pastikan SKU unik dan harga modal/jual akurat"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-[4px] border border-[var(--danger)] bg-[var(--danger)]/5 text-xs font-mono text-[var(--danger)]">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">SKU (Kode Produk) *</label>
              <Input
                isMono
                type="text"
                placeholder="PRD-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
              <span className="text-[11px] text-[var(--ink-muted)]">Harus unik di seluruh sistem</span>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">Kategori *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full h-11 px-3 text-sm rounded-[4px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] font-mono"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink)] font-medium">Nama Produk *</label>
            <Input
              type="text"
              placeholder="Contoh: Kopi Susu Gula Aren 250ml"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cost Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">Harga Modal (HPP) *</label>
              <Input
                isMono
                type="number"
                placeholder="0"
                value={formData.costPrice || ''}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) || 0 })}
                min="0"
                required
              />
              <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                {formatCurrency(formData.costPrice)}
              </span>
            </div>

            {/* Selling Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">Harga Jual *</label>
              <Input
                isMono
                type="number"
                placeholder="0"
                value={formData.sellingPrice || ''}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) || 0 })}
                min="0"
                required
              />
              <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                {formatCurrency(formData.sellingPrice)}
              </span>
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">Satuan Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full h-11 px-3 text-sm rounded-[4px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] font-mono"
              >
                <option value="pcs">pcs (buah)</option>
                <option value="pack">pack (bungkus)</option>
                <option value="btl">btl (botol)</option>
                <option value="box">box (kotak)</option>
                <option value="kaleng">kaleng</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stock */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">Stok Fisik Saat Ini *</label>
              <Input
                isMono
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>

            {/* Min Stock */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">Batas Minimum Stok *</label>
              <Input
                isMono
                type="number"
                placeholder="5"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) || 0 })}
                min="0"
                required
              />
              <span className="text-[11px] text-[var(--ink-muted)]">Peringatan saat stok &le; nilai ini</span>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">Status Penjualan *</label>
              <SegmentedControl<ProductStatus>
                options={[
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Nonaktif' },
                ]}
                value={formData.status}
                onChange={(s) => setFormData({ ...formData, status: s })}
                className="w-full flex h-11"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
            <Button variant="outline" size="md" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="md" type="submit" className="font-mono font-bold">
              {editingProduct ? 'Simpan Perubahan' : 'Buat Produk'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete / Deactivate Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Hapus Produk"
        description="Periksa relasi produk sebelum menghapus"
        maxWidth="md"
      >
        <div className="space-y-4">
          {hasTransactions ? (
            <div className="p-4 rounded-[4px] border border-[var(--warning)] bg-[var(--warning)]/5 space-y-2">
              <div className="flex items-center gap-2 font-mono font-bold text-xs text-[var(--warning)] uppercase">
                <AlertTriangle size={16} />
                <span>Produk Memiliki Riwayat Transaksi</span>
              </div>
              <p className="text-xs text-[var(--ink)] leading-relaxed">
                Produk <strong>&quot;{productToDelete?.name}&quot;</strong> ({productToDelete?.sku}) pernah tercatat pada transaksi kasir. Menghapusnya secara permanen akan merusak konsistensi data riwayat.
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                Sistem menyarankan untuk <strong>menonaktifkan</strong> produk agar tidak muncul di kasir tanpa menghapus riwayatnya.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[4px] border border-[var(--danger)] bg-[var(--danger)]/5 space-y-2">
              <p className="text-xs text-[var(--ink)]">
                Apakah Anda yakin ingin menghapus produk <strong>&quot;{productToDelete?.name}&quot;</strong>? Tindakan ini permanen.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <Button variant="outline" size="md" onClick={() => setDeleteModalOpen(false)}>
              Batal
            </Button>
            {hasTransactions ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (productToDelete) {
                    productRepository.update(productToDelete.id, { status: 'inactive' });
                    toast.success(`Produk "${productToDelete.name}" telah dinonaktifkan.`);
                    setDeleteModalOpen(false);
                    loadData();
                  }
                }}
                className="font-mono text-xs"
              >
                Nonaktifkan Saja
              </Button>
            ) : (
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDelete}
                className="font-mono font-bold text-xs"
              >
                Hapus Permanen
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
