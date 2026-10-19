import { InventoryMovement } from '@/types/inventory';
import { localStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

export const inventoryRepository = {
  getAll(): InventoryMovement[] {
    return localStorageAdapter.getItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
  },

  getByProductId(productId: string): InventoryMovement[] {
    return this.getAll().filter((m) => m.productId === productId);
  },

  create(movement: Omit<InventoryMovement, 'id' | 'createdAt'>): InventoryMovement {
    const movements = this.getAll();
    const newMovement: InventoryMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    movements.unshift(newMovement);
    localStorageAdapter.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements);
    return newMovement;
  },

  createBatch(newMovements: Omit<InventoryMovement, 'id' | 'createdAt'>[]): void {
    const movements = this.getAll();
    const now = new Date().toISOString();
    const formatted: InventoryMovement[] = newMovements.map((m, idx) => ({
      ...m,
      id: `mov-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    }));

    const combined = [...formatted, ...movements];
    localStorageAdapter.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, combined);
  },
};
