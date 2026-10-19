export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string; // e.g. 'pcs', 'pack', 'btl', 'box'
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}
