'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Layers, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { Category, Product } from '@/types/product';
import { formatDateTime } from '@/lib/formatters';

const PRESET_COLORS = [
  { name: 'Minuman', hex: '#2B7A78' },
  { name: 'Makanan', hex: '#C4622D' },
  { name: 'Kebutuhan Rumah', hex: '#7A7F2A' },
  { name: 'Perawatan Pribadi', hex: '#7B4B6A' },
  { name: 'Aksesori', hex: '#4A5A73' },
  { name: 'Netral', hex: '#1B1A17' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);

  // Form modal
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    color: '#2B7A78',
  });
  const [formError, setFormError] = React.useState<string | null>(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);

  const loadData = React.useCallback(() => {
    setCategories(categoryRepository.getAll());
    setProducts(productRepository.getAll());
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: PRESET_COLORS[categories.length % PRESET_COLORS.length]?.hex || '#2B7A78',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setFormData({
      name: c.name,
      description: c.description,
      color: c.color,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    if (editingCategory) {
      const res = categoryRepository.update(editingCategory.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
      });

      if (!res.success) {
        setFormError(res.error || 'Gagal memperbarui kategori.');
        return;
      }

      toast.success(`Kategori "${formData.name}" berhasil diperbarui.`);
    } else {
      const res = categoryRepository.create({
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
      });

      if (!res.success) {
        setFormError(res.error || 'Gagal membuat kategori baru.');
        return;
      }

      toast.success(`Kategori "${formData.name}" berhasil ditambahkan.`);
    }

    setIsFormOpen(false);
    loadData();
  };

  const handleOpenDelete = (c: Category) => {
    setCategoryToDelete(c);
    setDeleteModalOpen(true);
  };

  const activeProductCount = React.useMemo(() => {
    if (!categoryToDelete) return 0;
    return products.filter((p) => p.categoryId === categoryToDelete.id).length;
  }, [categoryToDelete, products]);

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;

    const res = categoryRepository.delete(categoryToDelete.id, activeProductCount);
    if (!res.success) {
      toast.error(res.error || 'Gagal menghapus kategori.');
      return;
    }

    toast.success(`Kategori "${categoryToDelete.name}" telah dihapus.`);
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
    loadData();
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Kategori"
        description="Kelola klasifikasi produk dan palet warna identitas kategori"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 font-mono text-xs font-bold"
          >
            <Plus size={16} />
            <span>Tambah Kategori</span>
          </Button>
        }
      />

      <main className="px-4 sm:px-6 py-6 space-y-5">
        {/* Mobile View: dense list */}
        <div className="md:hidden divide-y divide-[var(--line)] bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
          {categories.map((c) => {
            const count = products.filter((p) => p.categoryId === c.id).length;

            return (
              <div key={c.id} className="p-3.5 space-y-2 hover:bg-[var(--ink)]/[0.02] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-[2px] border border-[var(--ink)]/20 shadow-none shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <div>
                      <div className="font-semibold text-xs text-[var(--ink)]">{c.name}</div>
                      <div className="font-mono text-[10px] text-[var(--ink-muted)]">{c.color}</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-xs text-[var(--ink)]">
                    {count} produk
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-[var(--line)]">
                  <div className="text-[11px] text-[var(--ink-muted)] line-clamp-1 flex-1">
                    {c.description || '—'}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      title="Edit"
                      className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-[2px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(c)}
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

          {categories.length === 0 && (
            <div className="text-center py-12 text-xs font-mono text-[var(--ink-muted)]">
              Belum ada kategori yang terdaftar.
            </div>
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block bg-[var(--surface)] border border-[var(--line)] rounded-[4px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori & Warna</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Jumlah Produk Terkait</TableHead>
                <TableHead>Dibuat Pada</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.id).length;

                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-[2px] border border-[var(--ink)]/20 shadow-none shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <div>
                          <div className="font-semibold text-sm text-[var(--ink)]">{c.name}</div>
                          <div className="font-mono text-[10px] text-[var(--ink-muted)]">{c.color}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--ink-muted)] max-w-md">
                      {c.description || '—'}
                    </TableCell>
                    <TableCell isNumeric className="font-bold text-sm">
                      {count} produk
                    </TableCell>
                    <TableCell className="text-xs">{formatDateTime(c.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit kategori"
                          className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-[2px] min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(c)}
                          title="Hapus kategori"
                          className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--danger)] rounded-[2px] min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-xs font-mono text-[var(--ink-muted)]">
                    Belum ada kategori yang terdaftar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Form Modal */}
      <Dialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        description="Klasifikasi dan kode warna kategori produk"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-[4px] border border-[var(--danger)] bg-[var(--danger)]/5 text-xs font-mono text-[var(--danger)]">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink)] font-medium">Nama Kategori *</label>
            <Input
              type="text"
              placeholder="Contoh: Minuman Segar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink)] font-medium">Deskripsi Kategori</label>
            <Input
              type="text"
              placeholder="Deskripsi singkat jenis produk..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[var(--ink)] font-medium">Warna Identitas (Hex) *</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-10 h-10 rounded-[4px] border border-[var(--line)] cursor-pointer bg-transparent"
              />
              <Input
                isMono
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-32 text-xs uppercase"
              />
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((pc) => (
                  <button
                    key={pc.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: pc.hex })}
                    className="w-6 h-6 rounded-[2px] border border-[var(--ink)]/30 hover:scale-110 transition-transform"
                    style={{ backgroundColor: pc.hex }}
                    title={pc.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
            <Button variant="outline" size="md" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="md" type="submit" className="font-mono font-bold">
              {editingCategory ? 'Simpan Kategori' : 'Buat Kategori'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Category Modal */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Konfirmasi Hapus Kategori"
        description="Periksa produk terkait sebelum menghapus kategori"
        maxWidth="md"
      >
        <div className="space-y-4">
          {activeProductCount > 0 ? (
            <div className="p-4 rounded-[4px] border border-[var(--danger)] bg-[var(--danger)]/5 space-y-2">
              <div className="flex items-center gap-2 font-mono font-bold text-xs text-[var(--danger)] uppercase">
                <AlertCircle size={16} />
                <span>Kategori Masih Digunakan</span>
              </div>
              <p className="text-xs text-[var(--ink)] leading-relaxed">
                Kategori <strong>&quot;{categoryToDelete?.name}&quot;</strong> masih digunakan oleh <strong>{activeProductCount} produk</strong> aktif. Anda tidak dapat menghapus kategori ini sebelum produk dipindahkan ke kategori lain.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[4px] border border-[var(--line)] bg-[var(--paper)]">
              <p className="text-xs text-[var(--ink)]">
                Apakah Anda yakin ingin menghapus kategori <strong>&quot;{categoryToDelete?.name}&quot;</strong>?
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <Button variant="outline" size="md" onClick={() => setDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={activeProductCount > 0}
              onClick={handleConfirmDelete}
              className="font-mono font-bold text-xs"
            >
              Hapus Kategori
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
