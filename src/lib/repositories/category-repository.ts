import { Category } from '@/types/product';
import { localStorageAdapter, STORAGE_KEYS } from '@/lib/storage/local-storage';

export const categoryRepository = {
  getAll(): Category[] {
    return localStorageAdapter.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  },

  getById(id: string): Category | undefined {
    return this.getAll().find((c) => c.id === id);
  },

  create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; data?: Category; error?: string } {
    const categories = this.getAll();
    if (categories.some((c) => c.name.trim().toLowerCase() === category.name.trim().toLowerCase())) {
      return { success: false, error: `Kategori "${category.name}" sudah ada.` };
    }

    const now = new Date().toISOString();
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    categories.push(newCategory);
    const saved = localStorageAdapter.setItem(STORAGE_KEYS.CATEGORIES, categories);
    if (!saved) {
      return { success: false, error: 'Gagal menyimpan kategori ke browser.' };
    }

    return { success: true, data: newCategory };
  },

  update(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): { success: boolean; data?: Category; error?: string } {
    const categories = this.getAll();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: 'Kategori tidak ditemukan.' };
    }

    if (updates.name) {
      const collision = categories.find(
        (c) => c.id !== id && c.name.trim().toLowerCase() === updates.name!.trim().toLowerCase()
      );
      if (collision) {
        return { success: false, error: `Kategori "${updates.name}" sudah ada.` };
      }
    }

    const updated: Category = {
      ...categories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    categories[index] = updated;
    const saved = localStorageAdapter.setItem(STORAGE_KEYS.CATEGORIES, categories);
    if (!saved) {
      return { success: false, error: 'Gagal memperbarui kategori.' };
    }

    return { success: true, data: updated };
  },

  delete(id: string, associatedProductCount: number): { success: boolean; error?: string } {
    if (associatedProductCount > 0) {
      return {
        success: false,
        error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${associatedProductCount} produk. Pindahkan produk ke kategori lain terlebih dahulu.`,
      };
    }

    const categories = this.getAll().filter((c) => c.id !== id);
    const saved = localStorageAdapter.setItem(STORAGE_KEYS.CATEGORIES, categories);
    if (!saved) {
      return { success: false, error: 'Gagal menghapus kategori.' };
    }
    return { success: true };
  },
};
