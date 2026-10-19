'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ReceiptPaper } from '@/components/ui/receipt-paper';
import { SegmentedControl } from '@/components/ui/tabs';
import { productRepository } from '@/lib/repositories/product-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { checkoutService } from '@/lib/services/checkout-service';
import { formatCurrency } from '@/lib/formatters';
import { Product, Category } from '@/types/product';
import { CartItem, PaymentMethod, Transaction } from '@/types/transaction';
import { cn } from '@/lib/utils';

export default function PosPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [lastAddedId, setLastAddedId] = React.useState<string | null>(null);

  // Checkout dialog states
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = React.useState<number>(0);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Success Receipt dialog states
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [completedTx, setCompletedTx] = React.useState<Transaction | null>(null);

  // Mobile cart drawer sheet
  const [mobileCartOpen, setMobileCartOpen] = React.useState(false);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshData = React.useCallback(() => {
    setProducts(productRepository.getAll());
    setCategories(categoryRepository.getAll());
  }, []);

  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Filter products by category and search
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const subtotal = React.useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  }, [cart]);

  const discount = 0; // standard cart discount
  const total = Math.max(0, subtotal - discount);
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Stok habis. Tambah stok dulu di menu Inventori.');
      return;
    }
    if (product.status !== 'active') {
      toast.error('Produk sedang nonaktif.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`Maksimal stok tersedia hanya ${product.stock} ${product.unit}.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });

    // Trigger tag highlight flash on added item
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 600);
  };

  // Stepper functions
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              toast.warning(`Stok tidak mencukupi (tersedia ${item.product.stock}).`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Open checkout modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashGiven(total); // default cash to exact total
    setPaymentMethod('cash');
    setCheckoutOpen(true);
  };

  // Confirm checkout
  const handleProcessCheckout = () => {
    setIsProcessing(true);

    const result = checkoutService.processCheckout({
      items: cart,
      subtotal,
      discount,
      total,
      paymentMethod,
      amountPaid: paymentMethod === 'cash' ? cashGiven : total,
      cashierName: 'Budi Santoso',
    });

    setIsProcessing(false);

    if (!result.success || !result.transaction) {
      toast.error(result.error || 'Terjadi kesalahan saat memproses checkout.');
      return;
    }

    // Success
    setCompletedTx(result.transaction);
    setCheckoutOpen(false);
    setMobileCartOpen(false);
    setReceiptOpen(true);
    clearCart();
    refreshData();

    toast.success(`Transaksi ${result.transaction.transactionNumber} selesai.`);
  };

  // Calculate change for cash payment
  const cashDeficit = paymentMethod === 'cash' && cashGiven < total ? total - cashGiven : 0;
  const cashChange = paymentMethod === 'cash' && cashGiven >= total ? cashGiven - total : 0;

  // Category map for colors
  const categoryColorMap = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.color));
    return map;
  }, [categories]);

  // Stock indicator ticks generator (max 8 ticks)
  const renderStockTicks = (stock: number, minStock: number) => {
    const maxTicks = 8;
    const filledTicks = Math.min(maxTicks, Math.max(0, stock));
    const isLow = stock <= minStock;

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxTicks }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-1 h-2 rounded-[1px] transition-colors',
              i < filledTicks
                ? isLow
                  ? 'bg-[var(--warning)]'
                  : 'bg-[var(--ink)]'
                : 'bg-[var(--line)]'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Kasir"
        description="Point of Sale — Transaksi Penjualan Retail"
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-mono text-[var(--ink-muted)]">
              Tekan <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--line)] rounded-[2px] text-[var(--ink)] font-mono">/</kbd> untuk mencari
            </span>
          </div>
        }
      />

      {/* Main 2-Column POS Layout (60% Catalog / 40% Sticky Receipt Panel) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-[var(--paper)]">
        {/* Left Column: Catalog & Search (60%) */}
        <div className="lg:col-span-7 xl:col-span-8 p-3 sm:p-6 pb-28 lg:pb-6 space-y-4 border-r border-[var(--line)]">
          {/* Search bar & Category filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search
                size={18}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none"
              />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Cari produk berdasarkan nama atau SKU (Ctrl + /)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-[var(--surface)] border-[var(--line)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-3 py-1.5 rounded-[4px] font-medium border transition-colors whitespace-nowrap min-h-[36px]',
                  selectedCategory === 'all'
                    ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-semibold'
                    : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]'
                )}
              >
                Semua Kategori ({products.length})
              </button>
              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.id).length;
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-[4px] font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[36px]',
                      isSelected
                        ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-semibold'
                        : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]'
                    )}
                  >
                    <span className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: c.color }} />
                    <span>{c.name}</span>
                    <span className="font-mono text-[11px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid per PRD 5A.5:
              - No images
              - 3px category color line on left border
              - Name (max 2 lines)
              - SKU mono
              - Price tag on hover/active
              - Tick stock indicator + sisa text
              - Out of stock: strikethrough, disabled, HABIS label
          */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isInactive = p.status === 'inactive';
              const isDisabled = isOutOfStock || isInactive;
              const catColor = categoryColorMap.get(p.categoryId) || '#1B1A17';

              return (
                <div
                  key={p.id}
                  onClick={() => !isDisabled && addToCart(p)}
                  className={cn(
                    'group relative flex flex-col justify-between p-3.5 rounded-[4px] border bg-[var(--surface)] transition-all select-none',
                    'border-l-[3px]',
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-[var(--surface)]/70 border-[var(--line)]'
                      : 'cursor-pointer border-[var(--line)] hover:border-[var(--ink)] active:scale-[0.98]'
                  )}
                  style={{ borderLeftColor: catColor }}
                >
                  {/* Top: SKU & Out-of-stock badge */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-[var(--ink-muted)]">{p.sku}</span>
                    {isOutOfStock && (
                      <span className="text-[10px] font-mono font-bold text-[var(--danger)] bg-[var(--danger)]/10 px-1 py-0.2 rounded-[1px]">
                        HABIS
                      </span>
                    )}
                    {isInactive && !isOutOfStock && (
                      <span className="text-[10px] font-mono text-[var(--ink-muted)] bg-[var(--ink-muted)]/10 px-1 py-0.2 rounded-[1px]">
                        NONAKTIF
                      </span>
                    )}
                  </div>

                  {/* Name (max 2 lines) */}
                  <div
                    className={cn(
                      'text-xs font-semibold text-[var(--ink)] line-clamp-2 leading-snug my-1',
                      isDisabled && 'line-through text-[var(--ink-muted)]'
                    )}
                  >
                    {p.name}
                  </div>

                  {/* Bottom: Price tag and stock ticks */}
                  <div className="mt-3 pt-2 border-t border-dashed border-[var(--line)] flex items-end justify-between">
                    <div>
                      {/* Price tag: changes to sharp yellow tag badge on hover per PRD 5A.4 */}
                      <span
                        className={cn(
                          'font-mono text-sm font-bold tabular-nums transition-colors px-1 py-0.5 rounded-[2px]',
                          'group-hover:bg-[var(--tag)] group-hover:text-[var(--ink)]'
                        )}
                      >
                        {formatCurrency(p.sellingPrice)}
                      </span>
                    </div>

                    <div className="text-right">
                      {renderStockTicks(p.stock, p.minStock)}
                      <span
                        className={cn(
                          'text-[10px] font-mono block mt-0.5',
                          p.stock <= p.minStock ? 'text-[var(--warning)] font-semibold' : 'text-[var(--ink-muted)]'
                        )}
                      >
                        sisa {p.stock}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty search state */}
          {filteredProducts.length === 0 && (
            <div className="py-16 text-center border border-dashed border-[var(--line-dashed)] rounded-[4px] bg-[var(--surface)] p-6">
              <ShoppingBag size={28} className="mx-auto text-[var(--ink-muted)] mb-2" strokeWidth={1.5} />
              <p className="text-xs font-mono text-[var(--ink)] font-semibold">
                Tidak ada produk yang cocok dengan &quot;{searchQuery}&quot;.
              </p>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Coba kata kunci lain atau hapus filter kategori untuk melihat seluruh produk.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4"
              >
                Reset Pencarian & Kategori
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Thermal Receipt Cart Panel (40%) on Desktop */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col bg-[var(--surface)] sticky top-0 h-[calc(100vh-65px)] overflow-hidden border-b border-[var(--line)]">
          {/* Top receipt saw-tooth edge */}
          <div className="w-full h-2 overflow-hidden leading-none">
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="w-full h-full fill-[var(--paper)]">
              <polygon points="0,0 5,8 10,0 15,8 20,0 25,8 30,0 35,8 40,0 45,8 50,0 55,8 60,0 65,8 70,0 75,8 80,0 85,8 90,0 95,8 100,0" />
            </svg>
          </div>

          {/* Cart Header */}
          <div className="px-5 py-3 border-b border-dashed border-[var(--line-dashed)] flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                Keranjang Kasir
              </span>
              <span className="font-mono text-[11px] text-[var(--ink-muted)] block">
                {totalItemCount} item barang
              </span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-mono text-[var(--danger)] hover:underline flex items-center gap-1 min-h-[32px]"
              >
                <Trash2 size={13} />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 px-5 py-3 overflow-y-auto space-y-3 font-mono text-xs">
            {cart.map((item) => {
              const isHighlight = lastAddedId === item.product.id;
              const itemTotal = item.product.sellingPrice * item.quantity;

              return (
                <div
                  key={item.product.id}
                  className={cn(
                    'p-2.5 rounded-[3px] border border-[var(--line)] bg-[var(--paper)]/50 transition-colors',
                    isHighlight && 'animate-tag-highlight'
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--ink)] line-clamp-1">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] text-[var(--ink-muted)]">
                        {item.product.sku} · {formatCurrency(item.product.sellingPrice)}/{item.product.unit}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[var(--ink-muted)] hover:text-[var(--danger)] p-1 min-h-[28px] min-w-[28px] flex items-center justify-center"
                      aria-label="Hapus item"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Quantity stepper & subtotal */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-[var(--line)]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)] active:bg-[var(--line)]"
                        aria-label="Kurangi kuantitas"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-bold text-xs tabular-nums text-[var(--ink)]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)] active:bg-[var(--line)]"
                        aria-label="Tambah kuantitas"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="font-bold text-sm text-[var(--ink)] tabular-nums">
                      {formatCurrency(itemTotal)}
                    </div>
                  </div>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="py-16 text-center text-[var(--ink-muted)] space-y-2">
                <ShoppingBag size={32} className="mx-auto text-[var(--line-dashed)]" strokeWidth={1.5} />
                <p className="text-xs">
                  Belum ada barang. Pilih produk di sebelah kiri atau cari dengan SKU.
                </p>
              </div>
            )}
          </div>

          {/* Cart Footer: Subtotal, Total (40px mono with --tag highlight), Bayar Button */}
          <div className="p-5 border-t border-[var(--line)] bg-[var(--surface)] space-y-3">
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[var(--ink-muted)]">
                <span>Subtotal ({totalItemCount} item)</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[var(--danger)]">
                  <span>Diskon</span>
                  <span className="tabular-nums">-{formatCurrency(discount)}</span>
                </div>
              )}
            </div>

            {/* Total 40px mono with --tag highlight per PRD 5A.5 */}
            <div className="pt-2 border-t border-dashed border-[var(--line-dashed)]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
                Total Tagihan
              </div>
              <div className="text-3xl sm:text-[36px] font-bold font-mono text-[var(--ink)] tracking-tight tabular-nums mt-0.5">
                <span className="bg-[var(--tag)] px-2 py-0.5 rounded-[2px]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Solid Ink Full-Width Pay Button */}
            <Button
              variant="primary"
              size="lg"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="w-full text-base font-bold font-mono min-h-[48px]"
            >
              Bayar Sekarang &rarr;
            </Button>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Bar (when cart has items) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-[var(--surface)] border-t border-[var(--line)] px-4 py-3 shadow-2xl z-30 flex items-center justify-between gap-3">
          <div className="font-mono">
            <div className="text-[11px] text-[var(--ink-muted)]">{totalItemCount} item dipilih</div>
            <div className="text-base font-bold text-[var(--ink)] tabular-nums">{formatCurrency(total)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMobileCartOpen(true)}
              className="text-xs font-mono min-h-[44px]"
            >
              Lihat Struk
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="text-xs font-bold font-mono min-h-[44px]"
            >
              Bayar &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Cart Sheet Dialog */}
      <Dialog
        open={mobileCartOpen}
        onOpenChange={setMobileCartOpen}
        title="Keranjang Kasir"
        description={`${totalItemCount} item dalam antrean`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {cart.map((item) => (
            <div key={item.product.id} className="p-3 border border-[var(--line)] rounded-[4px] bg-[var(--paper)]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-xs text-[var(--ink)]">{item.product.name}</div>
                  <div className="text-[11px] font-mono text-[var(--ink-muted)]">
                    {formatCurrency(item.product.sellingPrice)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-[var(--danger)] text-xs font-mono p-1"
                >
                  Hapus
                </button>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-8 h-8 rounded border flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-8 h-8 rounded border flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
                <div className="font-mono font-bold text-sm">
                  {formatCurrency(item.product.sellingPrice * item.quantity)}
                </div>
              </div>
            </div>
          ))}

          <div className="p-4 border-t border-[var(--line)] font-mono space-y-2">
            <div className="flex justify-between font-bold text-base">
              <span>Total:</span>
              <span className="bg-[var(--tag)] px-1.5">{formatCurrency(total)}</span>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setMobileCartOpen(false);
                handleOpenCheckout();
              }}
              className="w-full mt-2 font-mono font-bold"
            >
              Lanjut ke Pembayaran
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Checkout Dialog per PRD 5A.5:
          - Segmented control: Tunai / Transfer / QRIS
          - Quick cash buttons: Uang pas, 50.000, 100.000, 200.000
          - Change calculation: turns --danger if money is deficient
          - Completed within <= 2 taps
      */}
      <Dialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        title="Pembayaran Transaksi"
        description="Pilih metode pembayaran dan masukkan nominal bayar"
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Total Tagihan Banner */}
          <div className="p-4 rounded-[4px] bg-[var(--paper)] border border-[var(--line)] text-center">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)] block">
              Total yang harus dibayar
            </span>
            <div className="text-3xl font-bold font-mono text-[var(--ink)] tabular-nums mt-1">
              <span className="bg-[var(--tag)] px-2 py-0.5 rounded-[2px]">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Segmented Control for Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[var(--ink-muted)]">Metode Pembayaran</label>
            <SegmentedControl<PaymentMethod>
              options={[
                { value: 'cash', label: '💵 Tunai' },
                { value: 'qris', label: '📱 QRIS' },
                { value: 'transfer', label: '🏦 Transfer' },
              ]}
              value={paymentMethod}
              onChange={(m) => {
                setPaymentMethod(m);
                if (m !== 'cash') {
                  setCashGiven(total);
                }
              }}
              className="w-full flex"
            />
          </div>

          {/* If Cash: Quick Buttons & Cash Input */}
          {paymentMethod === 'cash' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-[var(--ink-muted)]">
                  Nominal Diterima
                </label>
                <div className="relative">
                  <Input
                    isMono
                    type="number"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="text-lg font-bold h-12"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setCashGiven(total)}
                  className="px-2 py-2 text-xs font-mono font-medium rounded-[4px] border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--ink)] active:bg-[var(--line)] text-center min-h-[44px]"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashGiven(amt)}
                    className="px-2 py-2 text-xs font-mono font-medium rounded-[4px] border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--ink)] active:bg-[var(--line)] text-center min-h-[44px]"
                  >
                    {formatCurrency(amt).replace('Rp ', '')}
                  </button>
                ))}
              </div>

              {/* Change / Deficiency Info */}
              <div className="p-3 rounded-[4px] border border-dashed border-[var(--line-dashed)] bg-[var(--paper)] flex items-center justify-between font-mono">
                <span className="text-xs text-[var(--ink-muted)]">
                  {cashDeficit > 0 ? 'Status Pembayaran:' : 'Kembalian:'}
                </span>
                {cashDeficit > 0 ? (
                  <span className="text-sm font-bold text-[var(--danger)]">
                    Uang kurang {formatCurrency(cashDeficit)}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-[var(--success)] tabular-nums">
                    {formatCurrency(cashChange)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[4px] border border-[var(--line)] bg-[var(--paper)] text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-[var(--surface)] border border-[var(--line)] rounded-[4px] flex items-center justify-center text-[var(--ink)]">
                {paymentMethod === 'qris' ? <QrCode size={24} /> : <CreditCard size={24} />}
              </div>
              <div className="text-xs font-semibold text-[var(--ink)] uppercase">
                {paymentMethod === 'qris' ? 'Simulasi Pembayaran QRIS' : 'Simulasi Transfer Bank'}
              </div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Pencatatan metode non-tunai. Tekan &quot;Konfirmasi Selesai&quot; untuk mencetak struk transaksi.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCheckoutOpen(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={isProcessing || (paymentMethod === 'cash' && cashGiven < total)}
              onClick={handleProcessCheckout}
              className="font-mono font-bold min-w-[140px]"
            >
              {isProcessing ? 'Memproses...' : 'Konfirmasi Selesai'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Post-Checkout Success Receipt Modal with LUNAS stamp per PRD 5A.4 */}
      <Dialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        title="Transaksi Berhasil"
        description="Struk penjualan siap dicetak atau disimpan"
        maxWidth="md"
      >
        <div className="space-y-4">
          {completedTx && (
            <div className="max-h-[60vh] overflow-y-auto py-2">
              <ReceiptPaper transaction={completedTx} showStamp={true} />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--line)]">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                window.print();
              }}
              className="font-mono text-xs flex items-center gap-2"
            >
              <Printer size={16} />
              <span>Cetak Struk</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setReceiptOpen(false);
                setCompletedTx(null);
              }}
              className="font-mono font-bold text-xs flex items-center gap-2"
            >
              <RotateCcw size={16} />
              <span>Transaksi Baru</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
