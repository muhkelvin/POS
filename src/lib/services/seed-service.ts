import { localStorageAdapter, STORAGE_KEYS, CURRENT_SCHEMA_VERSION } from '@/lib/storage/local-storage';
import { SEED_CATEGORIES } from '@/data/seed-categories';
import { SEED_PRODUCTS } from '@/data/seed-products';
import { SEED_TRANSACTIONS, SEED_INVENTORY_MOVEMENTS } from '@/data/seed-transactions';
import { SEED_SETTINGS } from '@/data/seed-settings';

export const seedService = {
  isInitialized(): boolean {
    if (typeof window === 'undefined') return false;
    const version = localStorageAdapter.getItem<number | null>(STORAGE_KEYS.SCHEMA_VERSION, null);
    const hasProducts = localStorageAdapter.getItem<any[]>(STORAGE_KEYS.PRODUCTS, []).length > 0;
    return version !== null && hasProducts;
  },

  initializeIfNeeded(): void {
    if (typeof window === 'undefined') return;
    if (!this.isInitialized()) {
      this.resetToDefaults();
    }
  },

  resetToDefaults(): void {
    if (typeof window === 'undefined') return;

    localStorageAdapter.setItem(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
    localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    localStorageAdapter.setItem(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    localStorageAdapter.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, SEED_INVENTORY_MOVEMENTS);
    localStorageAdapter.setItem(STORAGE_KEYS.SETTINGS, SEED_SETTINGS);
    localStorageAdapter.setItem(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
  },
};
