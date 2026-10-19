# NexaPOS — Retail Point of Sale System

**Portfolio:** 04 · **Jenis:** Web Application — Business Operations · **Versi:** 1.1 — MVP Demo · **Gaya Desain:** Kertas & Tinta (Section 5A)

---

## 1. Tentang NexaPOS

**NexaPOS** adalah aplikasi Point of Sale (POS) retail modern berbasis web yang dirancang khusus untuk toko retail kecil, minimarket independen, dan toko aksesori. Aplikasi menggabungkan efisiensi operasional kasir harian dengan manajemen inventori stok opname serta laporan keuangan real-time.

### Desain "Kertas & Tinta" (Anti-Template)

NexaPOS sengaja menghindari tren dashboard SaaS generik (tidak ada gradien ungu, kartu mengambang, atau lingkaran pastel). Identitas visualnya terinspirasi langsung dari objek fisik di meja kasir:
- **Kertas Struk Thermal:** Panel keranjang dan detail transaksi berlatar belakang hangat (`#FBFAF5`) dengan tepi potongan bergerigi (*serrated zigzag*), garis pemisah putus-putus (*dashed line*), dan tipografi monospace.
- **Stempel Otentik:** Transaksi selesai menampilkan stempel **LUNAS** (hijau `#2F7D4F`) dengan rotasi −6° dan animasi pop 160ms. Transaksi dibatalkan menampilkan stempel **BATAL** (merah `#B8321F`).
- **Label Harga Kuning:** Aksen kuning tag kasir (`#F2B705`) digunakan hemat untuk menyorot barang terpilih dan angka total tagihan.
- **Angka Sebagai Bintang:** Seluruh nilai rupiah, stok, dan SKU menggunakan font **IBM Plex Mono** dengan format `tabular-nums` yang rapi dan tidak pernah bergeser.

---

## 2. Fitur Utama

| Modul | Halaman | Fitur Utama |
|---|---|---|
| **01 Dashboard** | `/dashboard` | Strip Ledger KPI (Omzet Hero 40px, Transaksi, Unit Terjual, ATV, Laba Kotor, Stok Rendah), grafik Recharts penjualan harian datar, distribusi kategori horizontal, peringatan stok rendah. |
| **02 Kasir** | `/pos` | Layout 60/40 desktop, pencarian cepat (`/` shortcut), chip kategori, kartu produk tanpa foto dengan indikator deretan tick stok, keranjang struk sticky, dialog checkout tunai dengan tombol cepat (*Uang Pas*, *50k*, *100k*, *200k*), perhitungan kembalian/kekurangan otomatis, dialog struk dengan stempel LUNAS. |
| **03 Transaksi** | `/transactions` | Riwayat lengkap transaksi kasir, filter status (Lunas / Batal) dan metode bayar (Tunai, QRIS, Transfer), modal pratinjau struk, alur pembatalan (*void*) terkontrol yang otomatis mengembalikan stok fisik produk. |
| **04 Produk** | `/products` | CRUD produk lengkap (SKU unik, harga modal HPP, harga jual, stok minimum, unit), status aktif/nonaktif, proteksi pencegahan penghapusan jika produk memiliki riwayat transaksi historis. |
| **05 Kategori** | `/categories` | Manajemen kategori retail dengan palet warna khas, jumlah produk terikat, proteksi relasi produk. |
| **06 Inventori** | `/inventory` | Monitoring stok fisik, pencatatan Restok Masuk dari supplier, Penyesuaian Stok (stock opname) dengan alasan wajib, tabel audit mutasi stok lengkap (`initial_stock`, `sale`, `restock`, `adjustment`, `sale_void`). |
| **07 Laporan** | `/reports` | Analisis omzet, laba kotor HPP snapshot, rata-rata transaksi, grafik harian, tabel 10 produk terlaris, distribusi metode bayar, dan fitur **Ekspor CSV**. |
| **08 Pengaturan** | `/settings` | Profil toko & pesan struk kasir, arsitektur demo, dan **Reset Demo Data** aman dengan konfirmasi dialog. |
| **Design Reference** | `/design` | Halaman referensi internal untuk seluruh token CSS, skala tipografi, varian tombol, badge, stempel, struk thermal, dan audit anti-template. |

---

## 3. Tech Stack & Arsitektur

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 & Vanilla CSS Variables
- **UI Components:** Custom Kertas & Tinta components (Button, Input, Table, Dialog, SegmentedControl, StatusBadge, Stamp, ReceiptPaper)
- **Typography:** Instrument Sans (UI/Heading) & IBM Plex Mono (Angka/Kode) via `next/font/google`
- **Icons:** Lucide React (stroke 1.5, ukuran 16/18px)
- **Charts:** Recharts dengan tema terpusat (`src/lib/charts/theme.ts`)
- **Notifications:** Sonner dengan styling struk kasir
- **Persistence:** LocalStorage adapter dengan *schema versioning* dan repository pattern (`productRepository`, `categoryRepository`, `transactionRepository`, `inventoryRepository`, `checkoutService`, `reportService`, `voidTransactionService`).
- **Supabase Readiness:** Konfigurasi stub layer disiapkan di `src/lib/supabase/client.ts` tanpa ketergantungan wajib pada environment variables.

---

## 4. Cara Menjalankan

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di `http://localhost:3000`.

3. **Build untuk produksi:**
   ```bash
   npm run build
   ```

4. **Reset Data Demo:**
   Buka menu `08 Pengaturan` -> klik tombol `Reset Seluruh Data Demo` untuk memuat ulang ~32 produk, 5 kategori, dan 120+ transaksi seed historis.
