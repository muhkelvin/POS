'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  RotateCcw,
  Store,
  Info,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { localStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';
import { seedService } from '@/lib/services/seed-service';
import { StoreSettings } from '@/types/settings';
import { SEED_SETTINGS } from '@/data/seed-settings';

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<StoreSettings>(SEED_SETTINGS);
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorageAdapter.getItem<StoreSettings>(STORAGE_KEYS.SETTINGS, SEED_SETTINGS);
    setSettings(saved);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorageAdapter.setItem(STORAGE_KEYS.SETTINGS, settings);
    toast.success('Pengaturan toko berhasil disimpan.');
  };

  const handleConfirmReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      seedService.resetToDefaults();
      setIsResetting(false);
      setResetModalOpen(false);
      setSettings(SEED_SETTINGS);
      toast.success('Seluruh data demo NexaPOS telah dikembalikan ke kondisi awal.');
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Pengaturan"
        description="Konfigurasi identitas toko, cetak struk, dan manajemen data demo"
      />

      <main className="px-4 sm:px-6 py-6 space-y-6 max-w-4xl">
        {/* Store Profile Card */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-dashed border-[var(--line-dashed)]">
            <Store size={18} strokeWidth={1.5} />
            <h2 className="font-semibold text-sm text-[var(--ink)]">Informasi Profil Toko</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--ink)] font-medium">Nama Toko</label>
                <Input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--ink)] font-medium">Nomor Telepon</label>
                <Input
                  type="text"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">Alamat Lengkap Toko</label>
              <Input
                type="text"
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--ink)] font-medium">Pesan Footer Struk</label>
              <Input
                type="text"
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="md" type="submit" className="font-mono font-bold text-xs">
                <Save size={15} className="mr-1.5" />
                <span>Simpan Pengaturan</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Reset Demo Data Section (PRD 5A.5: Separated with thin --danger border) */}
        <div className="bg-[var(--surface)] border border-[var(--danger)] rounded-[4px] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-dashed border-[var(--danger)]/30 text-[var(--danger)]">
            <RotateCcw size={18} strokeWidth={1.5} />
            <h2 className="font-semibold text-sm uppercase font-mono tracking-wide">
              Reset Demo Data Sistem
            </h2>
          </div>

          <div className="space-y-2 text-xs text-[var(--ink)] leading-relaxed">
            <p>
              Tindakan ini akan mengembalikan seluruh produk, kategori, 100+ transaksi historis, dan riwayat pergerakan stok ke data seed bawaan NexaPOS.
            </p>
            <p className="text-[var(--danger)] font-medium">
              Perubahan lokal, produk baru, dan transaksi yang baru saja Anda buat akan dihapus dan digantikan data demo awal.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="danger"
              size="md"
              onClick={() => setResetModalOpen(true)}
              className="font-mono font-bold text-xs flex items-center gap-2"
            >
              <RotateCcw size={15} />
              <span>Reset Seluruh Data Demo</span>
            </Button>
          </div>
        </div>

        {/* About NexaPOS Architecture per PRD 5A.5 & Section 10 */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-dashed border-[var(--line-dashed)]">
            <Info size={18} strokeWidth={1.5} />
            <h2 className="font-semibold text-sm text-[var(--ink)]">Tentang NexaPOS (Portfolio 04)</h2>
          </div>

          <div className="space-y-3 text-xs text-[var(--ink)] leading-relaxed">
            <p>
              <strong>NexaPOS</strong> adalah aplikasi Point of Sale retail berbasis web yang dirancang dengan konsep desain <em>Kertas & Tinta</em> — terinspirasi oleh kertas struk thermal, stempel lunas, buku kas, dan label harga toko fisik.
            </p>

            <div className="p-3 bg-[var(--paper)] rounded-[4px] border border-[var(--line)] font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">Arsitektur:</span>
                <span>Next.js App Router + TypeScript + Tailwind CSS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">Persistence:</span>
                <span>Browser localStorage (Repository & Service Pattern)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">Future Backend:</span>
                <span>Supabase PostgreSQL & Auth Ready</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">Timezone:</span>
                <span>Asia/Jakarta (WIB)</span>
              </div>
            </div>

            <p className="text-[var(--ink-muted)]">
              Seluruh transaksi, stok opname, dan laporan keuangan dihitung secara real-time dari data lokal aktif tanpa query ke database server.
            </p>
          </div>
        </div>
      </main>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        title="Konfirmasi Reset Data Demo"
        description="Kembalikan sistem ke kondisi awal seed data"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-[4px] border border-[var(--danger)] bg-[var(--danger)]/5 space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-xs text-[var(--danger)]">
              <AlertTriangle size={16} />
              <span>PERINGATAN RESET TOTAL</span>
            </div>
            <p className="text-xs text-[var(--ink)] leading-relaxed">
              Apakah Anda yakin ingin mengatur ulang data demo? Semua data produk baru dan transaksi yang telah dibuat akan hilang.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <Button variant="outline" size="md" onClick={() => setResetModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={isResetting}
              onClick={handleConfirmReset}
              className="font-mono font-bold text-xs min-w-[140px]"
            >
              {isResetting ? 'Mengatur Ulang...' : 'Ya, Reset Sekarang'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
