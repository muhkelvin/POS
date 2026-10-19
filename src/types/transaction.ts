export type PaymentMethod = 'cash' | 'transfer' | 'qris';
export type TransactionStatus = 'completed' | 'voided';

export interface TransactionItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  costPriceSnapshot: number;
  unitPriceSnapshot: number;
  discount: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  transactionNumber: string; // NX-YYYYMMDD-NNNN
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  status: TransactionStatus;
  cashierName: string;
  createdAt: string; // ISO datetime
  voidedAt: string | null;
  voidReason?: string;
}

export interface CartItem {
  product: import('./product').Product;
  quantity: number;
  discount: number;
}
