'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Stamp } from '@/components/ui/stamp';
import { SegmentedControl } from '@/components/ui/tabs';
import { ReceiptPaper } from '@/components/ui/receipt-paper';
import { formatCurrency } from '@/lib/formatters';
import { Transaction } from '@/types/transaction';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

const SAMPLE_TX: Transaction = {
  id: 'tx-sample-01',
  transactionNumber: 'NX-20261020-0042',
  items: [
    {
      id: 'it-1',
      productId: 'prd-001',
      sku: 'PRD-001',
      productName: 'Kopi Susu Gula Aren 250ml',
      quantity: 2,
      costPriceSnapshot: 11000,
      unitPriceSnapshot: 18000,
      discount: 0,
      subtotal: 36000,
    },
    {
      id: 'it-2',
      productId: 'prd-008',
      sku: 'PRD-008',
      productName: 'Roti Gandum Kismis 200g',
      quantity: 1,
      costPriceSnapshot: 12000,
      unitPriceSnapshot: 17500,
      discount: 0,
      subtotal: 17500,
    },
  ],
  subtotal: 53500,
  discount: 3500,
  total: 50000,
  paymentMethod: 'cash',
  amountPaid: 100000,
  change: 50000,
  status: 'completed',
  cashierName: 'Budi Santoso',
  createdAt: '2026-10-20T14:30:00+07:00',
  voidedAt: null,
};

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = React.useState('tokens');

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans p-6 sm:p-10 max-w-6xl mx-auto space-y-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 border border-[var(--line)] rounded-[4px] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)] text-xs font-mono flex items-center gap-1.5 min-h-[44px]"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Dashboard</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-tight">NexaPOS Design System Reference</h1>
            <p className="text-xs text-[var(--ink-muted)]">
              Acuan visual konsep &quot;Kertas &amp; Tinta&quot; (Section 5A PRD)
            </p>
          </div>
        </div>
        <span className="font-mono text-xs px-2 py-1 bg-[var(--ink)] text-[var(--paper)] rounded-[2px] uppercase">
          Internal Only
        </span>
      </div>

      {/* 5A.1 Concept Principles */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-6 space-y-3">
        <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-[var(--ink)]">
          Prinsip Utama: Kertas &amp; Tinta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs leading-relaxed">
          <div className="p-3 bg-[var(--paper)] rounded-[4px] border border-[var(--line)]">
            <span className="font-bold font-mono block mb-1">1. Angka adalah bintangnya</span>
            Harga, total, kembalian, dan stok tampil besar, rapi, dan tidak pernah bergeser (monospace + tabular nums).
          </div>
          <div className="p-3 bg-[var(--paper)] rounded-[4px] border border-[var(--line)]">
            <span className="font-bold font-mono block mb-1">2. Garis, bukan bayangan</span>
            Struktur dibentuk oleh hairline border 1px dan spasi kelipatan 4px, bukan drop shadow dan kartu mengambang.
          </div>
          <div className="p-3 bg-[var(--paper)] rounded-[4px] border border-[var(--line)]">
            <span className="font-bold font-mono block mb-1">3. Satu aksen: Kuning Tag</span>
            Kuning label harga (#F2B705) hanya untuk hal yang sedang aktif, terpilih, atau highlight total.
          </div>
        </div>
      </section>

      {/* Color Palette Tokens */}
      <section className="space-y-4">
        <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-[var(--ink)]">
          Design Tokens — Warna (Section 5A.3)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { token: '--paper', hex: '#F4F1E8', label: 'Background Halaman' },
            { token: '--surface', hex: '#FBFAF5', label: 'Panel, Tabel, Dialog' },
            { token: '--ink', hex: '#1B1A17', label: 'Teks Utama, Tombol', textWhite: true },
            { token: '--ink-muted', hex: '#6A655A', label: 'Teks Sekunder, Label', textWhite: true },
            { token: '--line', hex: '#D8D3C5', label: 'Hairline Border' },
            { token: '--line-dashed', hex: '#B9B3A2', label: 'Divider Struk' },
            { token: '--tag', hex: '#F2B705', label: 'Aksen Kuning Kasir' },
            { token: '--success', hex: '#2F7D4F', label: 'Lunas, Profit', textWhite: true },
            { token: '--warning', hex: '#A8520B', label: 'Peringatan Stok Rendah', textWhite: true },
            { token: '--danger', hex: '#B8321F', label: 'Batal, Error, Hapus', textWhite: true },
          ].map((c) => (
            <div
              key={c.token}
              className="p-3 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] space-y-2"
            >
              <div
                className="w-full h-12 rounded-[2px] border border-[var(--line)] flex items-center justify-center font-mono text-xs font-bold"
                style={{ backgroundColor: c.hex, color: c.textWhite ? '#FFFFFF' : '#1B1A17' }}
              >
                {c.hex}
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-[var(--ink)]">{c.token}</div>
                <div className="text-[11px] text-[var(--ink-muted)]">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Colors */}
      <section className="space-y-4">
        <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-[var(--ink)]">
          Warna Kategori Produk (Section 5A.3)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'Minuman', hex: '#2B7A78' },
            { name: 'Makanan', hex: '#C4622D' },
            { name: 'Kebutuhan Rumah', hex: '#7A7F2A' },
            { name: 'Perawatan Pribadi', hex: '#7B4B6A' },
            { name: 'Aksesori', hex: '#4A5A73' },
          ].map((cat) => (
            <div key={cat.name} className="p-3 rounded-[4px] border border-[var(--line)] bg-[var(--surface)] flex items-center gap-3">
              <span className="w-5 h-5 rounded-[2px] shrink-0" style={{ backgroundColor: cat.hex }} />
              <div>
                <div className="font-semibold text-xs text-[var(--ink)]">{cat.name}</div>
                <div className="font-mono text-[10px] text-[var(--ink-muted)]">{cat.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Scale */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-6 space-y-4">
        <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-[var(--ink)]">
          Skala Tipografi: Instrument Sans &amp; IBM Plex Mono
        </h2>
        <div className="space-y-4 border-t border-dashed border-[var(--line-dashed)] pt-4">
          <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2">
            <span className="text-xs font-mono text-[var(--ink-muted)]">40px Mono — Hero Total</span>
            <span className="text-[40px] font-mono font-bold text-[var(--ink)] tabular-nums leading-none">
              Rp 1.450.000
            </span>
          </div>

          <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2">
            <span className="text-xs font-mono text-[var(--ink-muted)]">28px Sans — Header Title</span>
            <span className="text-[28px] font-semibold tracking-tight text-[var(--ink)]">
              Kasir Transaksi Penjualan
            </span>
          </div>

          <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2">
            <span className="text-xs font-mono text-[var(--ink-muted)]">20px Mono — Subheading Metric</span>
            <span className="text-[20px] font-mono font-bold text-[var(--ink)] tabular-nums">
              128 Transaksi Selesai
            </span>
          </div>

          <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2">
            <span className="text-xs font-mono text-[var(--ink-muted)]">16px Sans — Normal Bold</span>
            <span className="text-[16px] font-semibold text-[var(--ink)]">
              Kopi Susu Gula Aren 250ml
            </span>
          </div>

          <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-2">
            <span className="text-xs font-mono text-[var(--ink-muted)]">14px Sans — Body Default</span>
            <span className="text-[14px] text-[var(--ink)]">
              Antarmuka kasir cepat dan mudah digunakan oleh staf toko retail.
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs font-mono text-[var(--ink-muted)]">12px Mono — Caption / SKU</span>
            <span className="text-[12px] font-mono text-[var(--ink-muted)]">
              SKU: PRD-001 · Dibuat: 20 Okt 2026, 14:30 WIB
            </span>
          </div>
        </div>
      </section>

      {/* Component Gallery: Buttons, Stamps, Badges */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons and Badges */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-6 space-y-6">
          <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-[var(--ink)]">
            Varian Komponen UI
          </h2>

          <div className="space-y-3">
            <span className="text-xs font-mono text-[var(--ink-muted)] block">Tombol (Radius 4px, 100ms press)</span>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Primary Ink</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="tag">Tag Accent</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono text-[var(--ink-muted)] block">
              Status Badge (Kotak 8px, bukan pill pastel)
            </span>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="active" />
              <StatusBadge status="inactive" />
              <StatusBadge status="low_stock" />
              <StatusBadge status="out_of_stock" />
              <StatusBadge status="completed" />
              <StatusBadge status="voided" />
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono text-[var(--ink-muted)] block">
              Stempel Status Otentik (Rotasi -6°, animasi 160ms)
            </span>
            <div className="flex items-center gap-6 pt-2">
              <Stamp status="LUNAS" size="lg" />
              <Stamp status="BATAL" size="lg" />
            </div>
          </div>
        </div>

        {/* Live Thermal Receipt Component */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-6 space-y-4">
          <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-[var(--ink)]">
            Pratinjau Struk Kasir (Serrated Edge)
          </h2>
          <div className="max-h-[480px] overflow-y-auto">
            <ReceiptPaper transaction={SAMPLE_TX} showStamp={true} />
          </div>
        </div>
      </section>

      {/* Anti-Template Audit Checklist (Section 5A.2) */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[4px] p-6 space-y-3">
        <h2 className="font-bold font-mono text-sm uppercase tracking-wider text-[var(--ink)]">
          Audit Anti-Template (Section 5A.2)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            'Bebas gradient ungu/biru/pink pada button atau hero',
            'Bebas glassmorphism, blur berlebihan, dan glow neon',
            'Bebas kartu rounded-2xl dan shadow-lg generik',
            'Bebas lingkaran warna pastel di KPI card',
            'Warna light mode Kertas & Tinta murni (#F4F1E8)',
            'Semua angka monospaced dan tabular numerals',
            'Bebas emoji sebagai ikon (menggunakan Lucide stroke 1.5)',
            'Bebas template marketing copy ("Welcome back 👋")',
            'Bar chart Recharts datar tanpa gradient',
            'Tombol dan target sentuh minimal 44x44px',
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[var(--ink)]">
              <CheckCircle2 size={15} className="text-[var(--success)] shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
