export type MovementType =
  | 'initial_stock'
  | 'sale'
  | 'restock'
  | 'adjustment'
  | 'sale_void';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  type: MovementType;
  quantity: number; // positive for addition, negative for deduction
  stockBefore: number;
  stockAfter: number;
  reason: string;
  referenceId: string | null; // e.g. transactionId, restock PO, adjustment ref
  createdAt: string; // ISO datetime
}
