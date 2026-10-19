/**
 * LocalStorage Adapter with Schema Versioning and Safety Checks
 */

export const STORAGE_KEYS = {
  PRODUCTS: 'nexapos.products',
  CATEGORIES: 'nexapos.categories',
  TRANSACTIONS: 'nexapos.transactions',
  INVENTORY_MOVEMENTS: 'nexapos.inventory_movements',
  SETTINGS: 'nexapos.settings',
  SCHEMA_VERSION: 'nexapos.schema_version',
} as const;

export const CURRENT_SCHEMA_VERSION = 1;

export const localStorageAdapter = {
  getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (err) {
      console.error(`Error reading ${key} from localStorage:`, err);
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Error writing ${key} to localStorage:`, err);
      return false;
    }
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.error(`Error removing ${key} from localStorage:`, err);
    }
  },

  clearAll(): void {
    if (typeof window === 'undefined') return;
    try {
      Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
  },
};
