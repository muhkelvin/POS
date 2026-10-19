import { Transaction } from '@/types/transaction';
import { localStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

export const transactionRepository = {
  getAll(): Transaction[] {
    return localStorageAdapter.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  },

  getById(id: string): Transaction | undefined {
    return this.getAll().find((t) => t.id === id);
  },

  getByNumber(transactionNumber: string): Transaction | undefined {
    const cleanNum = transactionNumber.trim().toUpperCase();
    return this.getAll().find((t) => t.transactionNumber.trim().toUpperCase() === cleanNum);
  },

  create(transaction: Transaction): boolean {
    const transactions = this.getAll();
    transactions.unshift(transaction);
    return localStorageAdapter.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  update(id: string, updates: Partial<Transaction>): boolean {
    const transactions = this.getAll();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return false;

    transactions[index] = {
      ...transactions[index],
      ...updates,
    };

    return localStorageAdapter.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  },
};
