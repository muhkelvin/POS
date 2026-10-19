import { Transaction } from '@/types/transaction';
import { Product } from '@/types/product';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';

export type PeriodFilter = 'today' | '7days' | '30days' | 'custom';

export interface ReportSummary {
  revenue: number;
  transactionsCount: number;
  productsSold: number;
  averageTransactionValue: number;
  grossProfit: number;
  lowStockCount: number;
  // Deltas against previous period
  revenueDeltaPercent: number;
  transactionsDeltaPercent: number;
  productsSoldDeltaPercent: number;
  atvDeltaPercent: number;
  grossProfitDeltaPercent: number;
}

export interface DailySalesData {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "19 Okt"
  revenue: number;
  transactions: number;
  isToday: boolean;
}

export interface CategorySalesData {
  categoryId: string;
  categoryName: string;
  color: string;
  revenue: number;
  unitsSold: number;
  percentage: number;
}

export interface TopProductData {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  grossProfit: number;
}

export interface PaymentMethodBreakdown {
  method: 'cash' | 'transfer' | 'qris';
  label: string;
  count: number;
  total: number;
  percentage: number;
}

export const reportService = {
  getDateRange(period: PeriodFilter, customStart?: string, customEnd?: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    let durationDays = 1;

    if (period === 'today') {
      durationDays = 1;
    } else if (period === '7days') {
      start.setDate(end.getDate() - 6);
      durationDays = 7;
    } else if (period === '30days') {
      start.setDate(end.getDate() - 29);
      durationDays = 30;
    } else if (period === 'custom' && customStart && customEnd) {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      durationDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        start: s,
        end: e,
        prevStart: new Date(s.getTime() - durationDays * 24 * 60 * 60 * 1000),
        prevEnd: new Date(s.getTime() - 1),
      };
    }

    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - durationDays * 24 * 60 * 60 * 1000);
    prevStart.setHours(0, 0, 0, 0);

    return { start, end, prevStart, prevEnd };
  },

  filterTransactions(transactions: Transaction[], start: Date, end: Date, includeVoided = false): Transaction[] {
    return transactions.filter((t) => {
      const txTime = new Date(t.createdAt).getTime();
      const inRange = txTime >= start.getTime() && txTime <= end.getTime();
      return inRange && (includeVoided ? true : t.status === 'completed');
    });
  },

  calculateSummary(transactions: Transaction[], prevTransactions: Transaction[], lowStockCount: number): ReportSummary {
    const calc = (txList: Transaction[]) => {
      let revenue = 0;
      let productsSold = 0;
      let totalCost = 0;

      txList.forEach((t) => {
        revenue += t.total;
        t.items.forEach((item) => {
          productsSold += item.quantity;
          totalCost += item.costPriceSnapshot * item.quantity;
        });
      });

      const transactionsCount = txList.length;
      const averageTransactionValue = transactionsCount > 0 ? Math.round(revenue / transactionsCount) : 0;
      const grossProfit = revenue - totalCost;

      return { revenue, transactionsCount, productsSold, averageTransactionValue, grossProfit };
    };

    const current = calc(transactions);
    const prev = calc(prevTransactions);

    const calcDelta = (currVal: number, prevVal: number): number => {
      if (prevVal === 0) return currVal > 0 ? 100 : 0;
      return Number((((currVal - prevVal) / prevVal) * 100).toFixed(1));
    };

    return {
      revenue: current.revenue,
      transactionsCount: current.transactionsCount,
      productsSold: current.productsSold,
      averageTransactionValue: current.averageTransactionValue,
      grossProfit: current.grossProfit,
      lowStockCount,
      revenueDeltaPercent: calcDelta(current.revenue, prev.revenue),
      transactionsDeltaPercent: calcDelta(current.transactionsCount, prev.transactionsCount),
      productsSoldDeltaPercent: calcDelta(current.productsSold, prev.productsSold),
      atvDeltaPercent: calcDelta(current.averageTransactionValue, prev.averageTransactionValue),
      grossProfitDeltaPercent: calcDelta(current.grossProfit, prev.grossProfit),
    };
  },

  getDailySales(transactions: Transaction[], start: Date, end: Date): DailySalesData[] {
    const map = new Map<string, { revenue: number; transactions: number; dateObj: Date }>();

    // Initialize all dates in range with 0
    const current = new Date(start);
    while (current <= end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      map.set(key, { revenue: 0, transactions: 0, dateObj: new Date(current) });
      current.setDate(current.getDate() + 1);
    }

    // Accumulate
    transactions.forEach((t) => {
      const txDate = new Date(t.createdAt);
      const yyyy = txDate.getFullYear();
      const mm = String(txDate.getMonth() + 1).padStart(2, '0');
      const dd = String(txDate.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      if (map.has(key)) {
        const item = map.get(key)!;
        item.revenue += t.total;
        item.transactions += 1;
      }
    });

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    return Array.from(map.entries()).map(([key, data]) => {
      const d = data.dateObj.getDate();
      const m = months[data.dateObj.getMonth()];
      return {
        date: key,
        displayDate: `${d} ${m}`,
        revenue: data.revenue,
        transactions: data.transactions,
        isToday: key === todayKey,
      };
    });
  },

  getCategorySales(transactions: Transaction[]): CategorySalesData[] {
    const categories = categoryRepository.getAll();
    const products = productRepository.getAll();
    const prodCatMap = new Map<string, string>();
    products.forEach((p) => prodCatMap.set(p.id, p.categoryId));

    const catStats = new Map<string, { revenue: number; unitsSold: number }>();
    categories.forEach((c) => catStats.set(c.id, { revenue: 0, unitsSold: 0 }));

    let totalRev = 0;
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        const catId = prodCatMap.get(item.productId) || 'other';
        const current = catStats.get(catId) || { revenue: 0, unitsSold: 0 };
        current.revenue += item.subtotal;
        current.unitsSold += item.quantity;
        catStats.set(catId, current);
        totalRev += item.subtotal;
      });
    });

    return categories
      .map((c) => {
        const stats = catStats.get(c.id) || { revenue: 0, unitsSold: 0 };
        return {
          categoryId: c.id,
          categoryName: c.name,
          color: c.color,
          revenue: stats.revenue,
          unitsSold: stats.unitsSold,
          percentage: totalRev > 0 ? Number(((stats.revenue / totalRev) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  },

  getTopProducts(transactions: Transaction[], limit = 5): TopProductData[] {
    const prodMap = new Map<string, { name: string; sku: string; units: number; rev: number; cost: number; catId: string }>();
    const allProducts = productRepository.getAll();
    const prodLookup = new Map(allProducts.map((p) => [p.id, p]));
    const catLookup = new Map(categoryRepository.getAll().map((c) => [c.id, c.name]));

    transactions.forEach((t) => {
      t.items.forEach((item) => {
        const existing = prodMap.get(item.productId) || {
          name: item.productName,
          sku: item.sku,
          units: 0,
          rev: 0,
          cost: 0,
          catId: prodLookup.get(item.productId)?.categoryId || '',
        };

        existing.units += item.quantity;
        existing.rev += item.subtotal;
        existing.cost += item.costPriceSnapshot * item.quantity;
        prodMap.set(item.productId, existing);
      });
    });

    return Array.from(prodMap.entries())
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        sku: data.sku,
        categoryName: catLookup.get(data.catId) || 'Umum',
        unitsSold: data.units,
        revenue: data.rev,
        grossProfit: data.rev - data.cost,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  getPaymentBreakdown(transactions: Transaction[]): PaymentMethodBreakdown[] {
    const counts = { cash: 0, transfer: 0, qris: 0 };
    const totals = { cash: 0, transfer: 0, qris: 0 };
    let grandTotal = 0;

    transactions.forEach((t) => {
      counts[t.paymentMethod] = (counts[t.paymentMethod] || 0) + 1;
      totals[t.paymentMethod] = (totals[t.paymentMethod] || 0) + t.total;
      grandTotal += t.total;
    });

    const labels: Record<string, string> = {
      cash: 'Tunai',
      transfer: 'Transfer Bank',
      qris: 'QRIS',
    };

    return (['cash', 'qris', 'transfer'] as const).map((method) => ({
      method,
      label: labels[method],
      count: counts[method],
      total: totals[method],
      percentage: grandTotal > 0 ? Number(((totals[method] / grandTotal) * 100).toFixed(1)) : 0,
    }));
  },

  generateCSV(transactions: Transaction[]): string {
    const headers = [
      'No Transaksi',
      'Tanggal',
      'Metode Pembayaran',
      'Status',
      'Subtotal',
      'Diskon',
      'Total',
      'Kasir',
      'Jumlah Item',
    ];

    const rows = transactions.map((t) => [
      `"${t.transactionNumber}"`,
      `"${t.createdAt}"`,
      `"${t.paymentMethod}"`,
      `"${t.status}"`,
      t.subtotal,
      t.discount,
      t.total,
      `"${t.cashierName}"`,
      t.items.reduce((sum, item) => sum + item.quantity, 0),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
