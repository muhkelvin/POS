import { Product } from '@/types/product';
import { localStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

export const productRepository = {
  getAll(): Product[] {
    return localStorageAdapter.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  },

  getById(id: string): Product | undefined {
    return this.getAll().find((p) => p.id === id);
  },

  getBySku(sku: string): Product | undefined {
    const cleanSku = sku.trim().toUpperCase();
    return this.getAll().find((p) => p.sku.trim().toUpperCase() === cleanSku);
  },

  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; data?: Product; error?: string } {
    const products = this.getAll();

    // Validate SKU uniqueness
    if (products.some((p) => p.sku.trim().toUpperCase() === product.sku.trim().toUpperCase())) {
      return { success: false, error: `SKU ${product.sku} sudah dipakai. Gunakan SKU lain.` };
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: `prd-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    products.unshift(newProduct);
    const saved = localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, products);
    if (!saved) {
      return { success: false, error: 'Data tidak tersimpan. Penyimpanan browser penuh atau diblokir.' };
    }

    return { success: true, data: newProduct };
  },

  update(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): { success: boolean; data?: Product; error?: string } {
    const products = this.getAll();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, error: 'Produk tidak ditemukan.' };
    }

    // Check SKU collision if SKU changed
    if (updates.sku) {
      const collision = products.find(
        (p) => p.id !== id && p.sku.trim().toUpperCase() === updates.sku!.trim().toUpperCase()
      );
      if (collision) {
        return { success: false, error: `SKU ${updates.sku} sudah dipakai oleh produk "${collision.name}".` };
      }
    }

    const updated: Product = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updated;
    const saved = localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, products);
    if (!saved) {
      return { success: false, error: 'Gagal memperbarui produk di penyimpanan browser.' };
    }

    return { success: true, data: updated };
  },

  delete(id: string, hasTransactions: boolean): { success: boolean; error?: string } {
    if (hasTransactions) {
      return {
        success: false,
        error: 'Produk ini pernah digunakan dalam transaksi. Nonaktifkan status produk alih-alih menghapusnya.',
      };
    }

    const products = this.getAll().filter((p) => p.id !== id);
    const saved = localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, products);
    if (!saved) {
      return { success: false, error: 'Gagal menghapus produk.' };
    }
    return { success: true };
  },

  updateStock(id: string, newStock: number): boolean {
    const products = this.getAll();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return false;

    products[index].stock = Math.max(0, Math.round(newStock));
    products[index].updatedAt = new Date().toISOString();
    return localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, products);
  },
};
