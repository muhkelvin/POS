import { Transaction, TransactionItem, PaymentMethod } from '@/types/transaction';
import { InventoryMovement } from '@/types/inventory';
import { SEED_PRODUCTS } from './seed-products';

// Helper to format ISO string in Asia/Jakarta offset (+07:00)
function getJakartaISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}+07:00`;
}

// Generate realistic 120 transactions over the last 30 days
function generateSeedTransactionsAndMovements(): {
  transactions: Transaction[];
  movements: InventoryMovement[];
} {
  const transactions: Transaction[] = [];
  const movements: InventoryMovement[] = [];

  // Base date reference: 2026-10-20
  const baseDate = new Date(2026, 9, 20, 15, 0, 0); // Oct 20, 2026
  const cashiers = ['Budi Santoso', 'Siti Rahma', 'Ahmad Fauzi'];
  const paymentMethods: PaymentMethod[] = ['cash', 'qris', 'transfer', 'cash', 'cash', 'qris'];

  // 1. Initial stock movements for all products on Sept 1
  SEED_PRODUCTS.forEach((p) => {
    movements.push({
      id: `mov-init-${p.id}`,
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      type: 'initial_stock',
      quantity: p.stock + 20, // initial stock before 30 days of sales
      stockBefore: 0,
      stockAfter: p.stock + 20,
      reason: 'Stok awal sistem NexaPOS',
      referenceId: null,
      createdAt: '2026-09-01T08:00:00+07:00',
    });
  });

  // Track simulated stock per product for movements
  const simulatedStock = new Map<string, number>();
  SEED_PRODUCTS.forEach((p) => simulatedStock.set(p.id, p.stock + 20));

  let txSequence = 1000;

  // Distribute 120 transactions over 30 days (approx 3 to 6 per day)
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const txCountThisDay = (dayOffset % 5 === 0 ? 6 : (dayOffset % 3 === 0 ? 5 : 3)) + (dayOffset === 0 ? 2 : 0);
    const dayDate = new Date(baseDate);
    dayDate.setDate(dayDate.getDate() - dayOffset);

    for (let t = 0; t < txCountThisDay; t++) {
      txSequence++;
      const hour = 9 + ((t * 2) % 11);
      const minute = (t * 17) % 60;
      const txDate = new Date(dayDate);
      txDate.setHours(hour, minute, 12);
      const isoDate = getJakartaISO(txDate);

      const pad = (n: number) => String(n).padStart(2, '0');
      const txNum = `NX-${txDate.getFullYear()}${pad(txDate.getMonth() + 1)}${pad(txDate.getDate())}-${String(txSequence).padStart(4, '0')}`;
      const txId = `tx-${txSequence}`;

      // Pick 1 to 4 products
      const itemCount = (txSequence % 3) + 1;
      const items: TransactionItem[] = [];
      let subtotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const prodIndex = (txSequence * 7 + i * 5) % (SEED_PRODUCTS.length - 2); // avoid inactive
        const prod = SEED_PRODUCTS[prodIndex];
        const qty = ((txSequence + i) % 3) + 1;
        const itemSubtotal = prod.sellingPrice * qty;

        items.push({
          id: `item-${txSequence}-${i + 1}`,
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          quantity: qty,
          costPriceSnapshot: prod.costPrice,
          unitPriceSnapshot: prod.sellingPrice,
          discount: 0,
          subtotal: itemSubtotal,
        });

        subtotal += itemSubtotal;

        // Record stock movement
        const currentStock = simulatedStock.get(prod.id) || 30;
        const newStock = Math.max(0, currentStock - qty);
        simulatedStock.set(prod.id, newStock);

        movements.push({
          id: `mov-sale-${txSequence}-${i + 1}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'sale',
          quantity: -qty,
          stockBefore: currentStock,
          stockAfter: newStock,
          reason: `Penjualan kasir #${txNum}`,
          referenceId: txId,
          createdAt: isoDate,
        });
      }

      // 5% chance of small transaction discount
      const discount = txSequence % 19 === 0 ? 5000 : 0;
      const total = Math.max(0, subtotal - discount);

      const paymentMethod = paymentMethods[txSequence % paymentMethods.length];
      let amountPaid = total;
      let change = 0;

      if (paymentMethod === 'cash') {
        // Round up to nearest 10.000 or 50.000
        amountPaid = Math.ceil(total / 10000) * 10000;
        if (amountPaid === total && total > 20000) {
          amountPaid += 10000;
        }
        change = amountPaid - total;
      }

      // Mark 4 specific transactions as voided across the 30 days
      const isVoided = txSequence === 1015 || txSequence === 1042 || txSequence === 1078 || txSequence === 1105;
      const cashierName = cashiers[txSequence % cashiers.length];

      let voidedAt: string | null = null;
      let voidReason: string | undefined = undefined;

      if (isVoided) {
        const voidDate = new Date(txDate);
        voidDate.setMinutes(voidDate.getMinutes() + 15);
        voidedAt = getJakartaISO(voidDate);
        voidReason = 'Permintaan pelanggan: salah pesan item dan ganti metode pembayaran';

        // Add sale_void movements to restore inventory
        items.forEach((item, itemIdx) => {
          const cur = simulatedStock.get(item.productId) || 20;
          const restored = cur + item.quantity;
          simulatedStock.set(item.productId, restored);

          movements.push({
            id: `mov-void-${txSequence}-${itemIdx + 1}`,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            type: 'sale_void',
            quantity: item.quantity,
            stockBefore: cur,
            stockAfter: restored,
            reason: `Pembatalan transaksi #${txNum} - stok dikembalikan`,
            referenceId: txId,
            createdAt: voidedAt!,
          });
        });
      }

      transactions.push({
        id: txId,
        transactionNumber: txNum,
        items,
        subtotal,
        discount,
        total,
        paymentMethod,
        amountPaid,
        change,
        status: isVoided ? 'voided' : 'completed',
        cashierName,
        createdAt: isoDate,
        voidedAt,
        voidReason,
      });
    }
  }

  // Add 3 realistic restock movements and 2 adjustment movements in recent weeks
  const restockDate = '2026-10-14T10:15:00+07:00';
  movements.push({
    id: 'mov-restock-1',
    productId: 'prd-001',
    productName: 'Kopi Susu Gula Aren 250ml',
    sku: 'PRD-001',
    type: 'restock',
    quantity: 24,
    stockBefore: 12,
    stockAfter: 36,
    reason: 'Penerimaan stok dari Distributor Kopi Nusantara (PO-202610-09)',
    referenceId: 'PO-202610-09',
    createdAt: restockDate,
  });

  movements.push({
    id: 'mov-restock-2',
    productId: 'prd-002',
    productName: 'Air Mineral Pegunungan 600ml',
    sku: 'PRD-002',
    type: 'restock',
    quantity: 48,
    stockBefore: 20,
    stockAfter: 68,
    reason: 'Restok mingguan air mineral',
    referenceId: 'PO-202610-10',
    createdAt: restockDate,
  });

  movements.push({
    id: 'mov-adj-1',
    productId: 'prd-018',
    productName: 'Deterjen Cair Konsentrat 800ml',
    sku: 'PRD-018',
    type: 'adjustment',
    quantity: -1,
    stockBefore: 3,
    stockAfter: 2,
    reason: 'Penyesuaian stok: 1 botol bocor saat penataan rak',
    referenceId: 'ADJ-202610-01',
    createdAt: '2026-10-18T16:45:00+07:00',
  });

  return { transactions, movements };
}

const { transactions: SEED_TRANSACTIONS, movements: SEED_INVENTORY_MOVEMENTS } = generateSeedTransactionsAndMovements();

export { SEED_TRANSACTIONS, SEED_INVENTORY_MOVEMENTS };
