import { CartItem, PaymentMethod, Transaction, TransactionItem } from '@/types/transaction';
import { productRepository } from '@/lib/repositories/product-repository';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { inventoryRepository } from '@/lib/repositories/inventory-repository';
import { generateTransactionNumber } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

export interface CheckoutParams {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  cashierName?: string;
}

export interface CheckoutResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

export const checkoutService = {
  processCheckout(params: CheckoutParams): CheckoutResult {
    const { items, subtotal, discount, total, paymentMethod, cashierName = 'Kasir Toko' } = params;
    let { amountPaid } = params;

    if (!items || items.length === 0) {
      return { success: false, error: 'Keranjang belanja masih kosong.' };
    }

    // For non-cash (QRIS, Transfer), amount paid is exact total
    if (paymentMethod !== 'cash') {
      amountPaid = total;
    } else {
      // Validate cash payment
      if (amountPaid < total) {
        const diff = total - amountPaid;
        return {
          success: false,
          error: `Uang kurang ${formatCurrency(diff)}`,
        };
      }
    }

    const change = Math.max(0, amountPaid - total);

    // Re-verify stock for every item before confirming
    const currentProducts = productRepository.getAll();
    for (const item of items) {
      const liveProduct = currentProducts.find((p) => p.id === item.product.id);
      if (!liveProduct) {
        return { success: false, error: `Produk "${item.product.name}" tidak ditemukan dalam sistem.` };
      }
      if (liveProduct.status !== 'active') {
        return { success: false, error: `Produk "${item.product.name}" sedang nonaktif dan tidak dapat dibeli.` };
      }
      if (liveProduct.stock < item.quantity) {
        return {
          success: false,
          error: `Stok "${item.product.name}" tidak mencukupi (sisa ${liveProduct.stock}, diminta ${item.quantity}).`,
        };
      }
    }

    // Generate transaction number
    const allTransactions = transactionRepository.getAll();
    const now = new Date();
    // Count transactions today for sequence
    const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const todayTxCount = allTransactions.filter((t) => t.transactionNumber.includes(todayStr)).length + 1;
    const txNumber = generateTransactionNumber(todayTxCount, now);
    const txId = `tx-${Date.now()}`;

    // Build Transaction Items with snapshots
    const txItems: TransactionItem[] = items.map((item, index) => {
      const itemSubtotal = item.product.sellingPrice * item.quantity - (item.discount || 0);
      return {
        id: `item-${Date.now()}-${index + 1}`,
        productId: item.product.id,
        sku: item.product.sku,
        productName: item.product.name,
        quantity: item.quantity,
        costPriceSnapshot: item.product.costPrice,
        unitPriceSnapshot: item.product.sellingPrice,
        discount: item.discount || 0,
        subtotal: itemSubtotal,
      };
    });

    const newTransaction: Transaction = {
      id: txId,
      transactionNumber: txNumber,
      items: txItems,
      subtotal,
      discount,
      total,
      paymentMethod,
      amountPaid,
      change,
      status: 'completed',
      cashierName,
      createdAt: now.toISOString(),
      voidedAt: null,
    };

    // Atomic update of products stock and movements log
    for (const item of items) {
      const liveProduct = productRepository.getById(item.product.id)!;
      const stockBefore = liveProduct.stock;
      const stockAfter = stockBefore - item.quantity;

      // Update product stock
      productRepository.updateStock(item.product.id, stockAfter);

      // Log movement
      inventoryRepository.create({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        type: 'sale',
        quantity: -item.quantity,
        stockBefore,
        stockAfter,
        reason: `Penjualan #${txNumber}`,
        referenceId: txId,
      });
    }

    // Save transaction
    const saved = transactionRepository.create(newTransaction);
    if (!saved) {
      return { success: false, error: 'Data tidak tersimpan. Penyimpanan browser penuh atau diblokir.' };
    }

    return {
      success: true,
      transaction: newTransaction,
    };
  },
};
