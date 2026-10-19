import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { inventoryRepository } from '@/lib/repositories/inventory-repository';
import { Transaction } from '@/types/transaction';

export interface VoidResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

export const voidTransactionService = {
  voidTransaction(transactionId: string, reason: string): VoidResult {
    const transaction = transactionRepository.getById(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaksi tidak ditemukan.' };
    }

    if (transaction.status === 'voided') {
      return { success: false, error: 'Transaksi ini sudah pernah dibatalkan sebelumnya.' };
    }

    const now = new Date().toISOString();

    // Revert stock for each item in the transaction
    for (const item of transaction.items) {
      const product = productRepository.getById(item.productId);
      const currentStock = product ? product.stock : 0;
      const restoredStock = currentStock + item.quantity;

      if (product) {
        productRepository.updateStock(product.id, restoredStock);
      }

      inventoryRepository.create({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        type: 'sale_void',
        quantity: item.quantity,
        stockBefore: currentStock,
        stockAfter: restoredStock,
        reason: `Pembatalan transaksi #${transaction.transactionNumber}: ${reason || 'Retur/Batal transaksi'}`,
        referenceId: transaction.id,
      });
    }

    // Update transaction status
    const updated = transactionRepository.update(transactionId, {
      status: 'voided',
      voidedAt: now,
      voidReason: reason || 'Pembatalan transaksi kasir',
    });

    if (!updated) {
      return { success: false, error: 'Gagal memperbarui status transaksi di penyimpanan browser.' };
    }

    const updatedTx = transactionRepository.getById(transactionId);
    return {
      success: true,
      transaction: updatedTx,
    };
  },
};
